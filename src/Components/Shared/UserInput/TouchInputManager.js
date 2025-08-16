// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { EventController } from "../../../Shared/Event.js";
import { VectorUtils as V } from "../../../Utils/VectorUtils.js";

export class TouchInputManagerSettings {
   /** @type {number} */
   #doubleTapTresholdMs = 400;
   /** @type {number} */
   #dragStartTresholdDistance = 5;
   /** @type {number} */
   #pinchStartTresholdFactorDifference = 0.001;
   /** @type {number} */
   #pinchRegisterDistanceTreshold = 10;

   get doubleTapTresholdMs() { return this.#doubleTapTresholdMs; }
   set doubleTapTresholdMs(value) {
      Assert.numberPositive(value, "value");
      this.#doubleTapTresholdMs = value;
   }

   get dragStartTresholdDistance() { return this.#dragStartTresholdDistance; }
   set dragStartTresholdDistance(value) {
      Assert.numberPositive(value, "value");
      this.#dragStartTresholdDistance = value;
   }

   get pinchStartTresholdFactorDifference() { return this.#pinchStartTresholdFactorDifference; }
   set pinchStartTresholdFactorDifference(value) {
      Assert.numberPositive(value, "value");
      this.#pinchStartTresholdFactorDifference = value;
   }

   get pinchRegisterDistanceTreshold() { return this.#pinchRegisterDistanceTreshold; }
   set pinchRegisterDistanceTreshold(value) {
      Assert.numberPositive(value, "value");
      this.#pinchRegisterDistanceTreshold = value;
   }
}

export class TouchInputManager {
   /** @type {{position: Vector, target: EventTarget?, time:number}?} */
   #primaryStart = null;
   /** @type {Vector?} */
   #primaryCurrentPosition = null;
   /** @type {Vector?} */
   #primaryPrevious = null;
   /** @type {{position: Vector, target: EventTarget?, time:number}?} */
   #secondaryStart = null;
   /** @type {Vector?} */
   #secondaryCurrentPosition = null;
   /** @type Vector?} */
   #secondaryPrevious = null;
   /** @type {number?} */
   #doubleTapTimeout = null;
   /** @type {number?} */
   #dragStartedTimestamp = null;
   /** @type {boolean} */
   #pinchStarted = false;
   /** @type {HTMLElement?} */
   #targetElement = null;

   /** @type {TouchInputManagerSettings} */
   #settings = new TouchInputManagerSettings();

   /** @readonly @type {EventController<{sender: TouchInputManager, position:Vector, target:EventTarget?}>} */
   #onTap = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, position:Vector, target:EventTarget?}>} */
   #onDoubleTap = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, position:Vector, target:EventTarget?}>} */
   #onLongTap = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, position:Vector, initialOffset:Vector, target:EventTarget?}>} */
   #onDragStart = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, offset:Vector, duration:number}>} */
   #onDrag = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager}>} */
   #onDragEnd = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, target:EventTarget?}>} */
   #onPinchStart = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager, position:Vector, factor:number, smoothingHint:boolean}>} */
   #onPinch = new EventController();
   /** @readonly @type {EventController<{sender: TouchInputManager}>} */
   #onPinchEnd = new EventController();

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("./InputManager.js").TargetElementDetacher} TargetElementDetacher */

   get onTap() { return this.#onTap.event; }
   get onDoubleTap() { return this.#onDoubleTap.event; }
   get onLongTap() { return this.#onLongTap.event; }
   get onDragStart() { return this.#onDragStart.event; }
   get onDrag() { return this.#onDrag.event; }
   get onDragEnd() { return this.#onDragEnd.event; }
   get onPinchStart() { return this.#onPinchStart.event; }
   get onPinch() { return this.#onPinch.event; }
   get onPinchEnd() { return this.#onPinchEnd.event; }

   /** @type {boolean} */
   get isAttached() { return this.#targetElement !== null; }

   get settings() { return this.#settings; }
   set settings(value) {
      Assert.class(value, TouchInputManagerSettings, "value");
      this.#settings = value;
   }

   /**
    * @param {HTMLElement} targetElement 
    * @returns {TargetElementDetacher} A callback which - when executed - will both detach the 
    * current instance from the specified {@link targetElement} and allow this instance to be 
    * reattached to another {@link HTMLElement}.
    * @throws {InvalidOperationError} Is thrown when {@link isAttached} is true.
    */
   attach(targetElement) {
      if (this.#targetElement) {
         throw new InvalidOperationError("The current instance is already attached to another " + 
            "HTML element.");
      }

      this.#targetElement = targetElement;
      this.#targetElement.addEventListener("touchstart", this.#onTouchStart, { passive: false });
      this.#targetElement.addEventListener("contextmenu", this.#onContextMenu, { passive: false });
      this.#targetElement.addEventListener("touchmove", this.#onTouchMove, { passive: false });
      this.#targetElement.addEventListener("touchend", this.#onTouchEnd, { passive: false });
      this.#targetElement.addEventListener("touchcancel", this.#onTouchCancel, { passive: false });

      return () => this.#detach(targetElement);
   }

   /**
    * @param {HTMLElement} targetElement
    */
   #detach = (targetElement) => {
      targetElement.removeEventListener("touchstart", this.#onTouchStart);
      targetElement.removeEventListener("contextmenu", this.#onContextMenu);
      targetElement.removeEventListener("touchmove", this.#onTouchMove);
      targetElement.removeEventListener("touchend", this.#onTouchEnd);
      targetElement.removeEventListener("touchcancel", this.#onTouchCancel);

      if (this.#targetElement && this.#targetElement === targetElement) {
         this.#targetElement = null;
      }
   }
   
   /**
    * @param {TouchEvent} event 
    */
   #onTouchStart = event => {
      event.preventDefault();

      if (event.touches.length > 0) {
         let touch = event.touches[0];
         this.#primaryStart = {
            position: V.new(touch.clientX, touch.clientY),
            target: event.target,
            time: event.touches.length === 1 ? performance.now() : 0
         }
         this.#primaryCurrentPosition = this.#primaryStart.position;
         this.#primaryPrevious = null;
      }

      if (event.touches.length > 1) {
         let touch = event.touches[1];
         this.#secondaryStart = {
            position: V.new(touch.clientX, touch.clientY),
            target: event.target,
            time: 0
         }
         this.#secondaryPrevious = null;
      }
   };

   /**
    * @param {MouseEvent} event 
    */
   #onContextMenu = event => {
      if (this.onLongTap.hasSubscribers) {
         event.preventDefault();
      }
   };

   /**
    * @param {TouchEvent} event 
    */
   #onTouchMove = event => {
      event.preventDefault();

      let isSingleTouch = event.touches.length === 1;
      let isMultiTouch = event.touches.length >= 2;

      this.#primaryPrevious = this.#primaryCurrentPosition;
      if (event.touches.length > 0) {
         let touch = event.touches[0];
         this.#primaryCurrentPosition = V.new(touch.clientX, touch.clientY);
      } else {
         this.#primaryCurrentPosition = null;
      }

      this.#secondaryPrevious = this.#secondaryCurrentPosition;
      if (event.touches.length > 1) {
         let touch = event.touches[1];
         this.#secondaryCurrentPosition = V.new(touch.clientX, touch.clientY);
      } else {
         this.#secondaryCurrentPosition = null;
      }

      if (isSingleTouch && this.#primaryCurrentPosition && this.#primaryStart && this.#primaryPrevious) {
         let totalDragOffset = V.sub(this.#primaryCurrentPosition, this.#primaryStart.position);
         let totalDragDistance = V.len(totalDragOffset);
         let currentMovement = V.sub(this.#primaryCurrentPosition, this.#primaryPrevious);
         let hasDragEventSubscribers = this.onDrag.hasSubscribers || 
            this.onDragStart.hasSubscribers || this.onDragEnd.hasSubscribers;
         if (hasDragEventSubscribers && this.#dragStartedTimestamp === null && 
            totalDragDistance > this.#settings.dragStartTresholdDistance) {
            this.#dragStartedTimestamp = performance.now();
            this.#onDragStart.trigger({ 
               sender: this,
               position: this.#primaryCurrentPosition,
               initialOffset: totalDragOffset,
               target: this.#primaryStart.target
            });
         }
         if (this.#dragStartedTimestamp !== null) {
            this.#onDrag.trigger({ 
               sender: this,
               offset: currentMovement,
               duration: (performance.now() - this.#dragStartedTimestamp) / 1000
            });
         }
      } 
      
      if (isMultiTouch && this.#primaryCurrentPosition && this.#secondaryCurrentPosition &&
         this.#primaryPrevious && this.#secondaryPrevious && this.#primaryStart) {
         let touchDistanceCurrent = V.len(V.sub(this.#primaryCurrentPosition, this.#secondaryCurrentPosition));
         let touchDistancePrevious = V.len(V.sub(this.#primaryPrevious, this.#secondaryPrevious));
         let pinchFactor = touchDistanceCurrent / touchDistancePrevious;
         if (touchDistanceCurrent > this.#settings.pinchRegisterDistanceTreshold &&
            touchDistancePrevious > this.#settings.pinchRegisterDistanceTreshold &&
            Number.isFinite(pinchFactor) && pinchFactor > 0) {            
            let hasPinchEventSubscribers = this.onPinchStart.hasSubscribers || 
               this.onPinch.hasSubscribers || this.onPinchEnd.hasSubscribers;
            if (hasPinchEventSubscribers && !this.#pinchStarted && 
               Math.abs(1 - pinchFactor) >= this.#settings.pinchStartTresholdFactorDifference) {
               this.#pinchStarted = true;
               this.#onPinchStart.trigger({
                  sender: this,
                  target: this.#primaryStart.target
               });
            }
            if (this.#pinchStarted) {               
               this.#onPinch.trigger({
                  sender: this,
                  position: this.#primaryStart.position, 
                  factor: pinchFactor,
                  smoothingHint: false
               });
            }
         }
      }
   };

   /**
    * @param {TouchEvent} event 
    */
   #onTouchCancel = event => this.#onTouchEnd(event, true);

   /**
    * @param {TouchEvent} event 
    * @param {boolean} [cancelled]
    */
   #onTouchEnd = (event, cancelled) => {
      event.preventDefault();

      let dragEnded = false, pinchEnded = false;
      if (event.touches.length < 2) {
         if (this.#pinchStarted) {
            this.#pinchStarted = false;
            this.#onPinchEnd.trigger({sender: this});
            pinchEnded = true;
         }
      }
      if (event.touches.length < 1) {         
         if (this.#dragStartedTimestamp !== null) {
            this.#dragStartedTimestamp = null;
            this.#onDragEnd.trigger({sender: this});
            dragEnded = true;
         }
      }
      let dragOrPinchEnded = dragEnded || pinchEnded;

      if (!dragOrPinchEnded && this.#dragStartedTimestamp === null &&
         this.#primaryStart && !this.#secondaryStart && !cancelled) {
         if (this.#doubleTapTimeout === null) {
            if ((performance.now() - this.#primaryStart.time) > this.#settings.doubleTapTresholdMs &&
               this.onLongTap.hasSubscribers) {
               this.#onLongTap.trigger({ 
                  sender: this,
                  position: this.#primaryStart.position,
                  target: this.#primaryStart.target
               });
            } else {
               this.#onTap.trigger({
                  sender: this,
                  position: this.#primaryStart.position,
                  target: this.#primaryStart.target
               });

               if (this.onDoubleTap.hasSubscribers) {
                  this.#doubleTapTimeout = setTimeout(
                     () => this.#doubleTapTimeout = null, this.#settings.doubleTapTresholdMs);
               }
            }
         } else {
            clearTimeout(this.#doubleTapTimeout);
            this.#doubleTapTimeout = null;
            if (this.#onDoubleTap.event.hasSubscribers) {
               this.#onDoubleTap.trigger({ 
                  sender: this,
                  position: this.#primaryStart.position,
                  target: this.#primaryStart.target
               });
            }
         }
      }

      if (pinchEnded) {
         this.#secondaryStart = this.#secondaryCurrentPosition = this.#secondaryPrevious = null;
         this.#primaryCurrentPosition = this.#primaryPrevious = null;
      }
      if (dragEnded) {
         this.#primaryStart = this.#primaryCurrentPosition = this.#primaryStart = null;
      }
   };
}