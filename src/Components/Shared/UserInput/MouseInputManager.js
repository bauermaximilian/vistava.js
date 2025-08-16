// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { EventController } from "../../../Shared/Event.js";
import { VU } from "../../../Utils/VectorUtils.js";

export class MouseInputManagerSettings {
   /** @type {number} */
   #doubleClickTresholdMs = 300;
   /** @type {number} */
   #dragStartTresholdDistance = 5;
   /** @type {number} */
   #scrollSpeed = 1;

   get doubleClickTresholdMs() { return this.#doubleClickTresholdMs; }
   set doubleClickTresholdMs(value) {
      Assert.numberPositive(value, "value");
      this.#doubleClickTresholdMs = value;
   }

   get dragStartTresholdDistance() { return this.#dragStartTresholdDistance; }
   set dragStartTresholdDistance(value) {
      Assert.numberPositive(value, "value");
      this.#dragStartTresholdDistance = value;
   }

   get scrollSpeed() { return this.#scrollSpeed; }
   set scrollSpeed(value) {
      Assert.numberPositive(value, "value");
      this.#scrollSpeed = value;
   }
}

export class MouseInputManager {
   /** @type {{position: Vector, target: EventTarget?}?} */
   #leftClickStart = null;
   /** @type {{position: Vector, target: EventTarget?}?} */
   #rightClickStart = null;
   /** @type {Vector} */
   #positionCurrent = VU.new(0, 0);
   /** @type {Vector} */
   #positionPrevious = VU.new(0, 0);
   /** @type {number?} */
   #dragStartedTimestamp = null;
   /** @type {number?} */
   #doubleLeftClickTimeout = null;
   /** @type {number?} */
   #lastWheelMovementSinceScrollStart = null;
   /** @type {HTMLElement?} */
   #targetElement = null;
   /** @type {number} */
   #lastActionTimestamp = performance.now();

   /** @type {MouseInputManagerSettings} */
   #settings = new MouseInputManagerSettings();

   /** @readonly @type {EventController<{sender: MouseInputManager, position:Vector, target:EventTarget?}>} */
   #onClick = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, position:Vector, target:EventTarget?}>} */
   #onDoubleClick = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, position:Vector, target:EventTarget?}>} */
   #onRightClick = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, position:Vector, initialOffset:Vector, target:EventTarget?}>} */
   #onDragStart = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, offset:Vector, duration:number}>} */
   #onDrag = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager}>} */
   #onDragEnd = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, target:EventTarget?}>} */
   #onWheelStart = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager, position:Vector, factor:number, smoothingHint:boolean, target:EventTarget?}>} */
   #onWheel = new EventController();
   /** @readonly @type {EventController<{sender: MouseInputManager}>} */
   #onWheelEnd = new EventController();

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("./InputManager.js").TargetElementDetacher} TargetElementDetacher */

   get onClick() { return this.#onClick.event; }
   get onDoubleClick() { return this.#onDoubleClick.event; }
   get onRightClick() { return this.#onRightClick.event; }
   get onDragStart() { return this.#onDragStart.event; }
   get onDrag() { return this.#onDrag.event; }
   get onDragEnd() { return this.#onDragEnd.event; }
   get onWheelStart() { return this.#onWheelStart.event; }
   get onWheel() { return this.#onWheel.event; }
   get onWheelEnd() { return this.#onWheelEnd.event; }

   /** @type {boolean} */
   get isAttached() { return this.#targetElement !== null; }

   get settings() { return this.#settings; }
   set settings(value) {
      Assert.class(value, MouseInputManagerSettings, "value");
      this.#settings = value;
   }

   get lastActionTimestamp() { return this.#lastActionTimestamp; }

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
      this.#targetElement.ownerDocument.body.addEventListener("mousedown", this.#onMouseDown);      
      this.#targetElement.ownerDocument.body.addEventListener("contextmenu", this.#onContextMenu);
      this.#targetElement.ownerDocument.body.addEventListener("mouseup", this.#onMouseUp);
      this.#targetElement.ownerDocument.body.addEventListener("mousemove", this.#onMouseMove);
      this.#targetElement.ownerDocument.body.addEventListener("mouseleave", this.#onMouseLeave);
      this.#targetElement.ownerDocument.body.addEventListener("wheel", this.#onMouseWheel, { passive: true });
      this.#targetElement.ownerDocument.body.addEventListener("dragstart", this.#onNativeDragStart);

      return () => this.#detach(targetElement);
   }

   /**
    * @param {HTMLElement} targetElement
    */
   #detach = (targetElement) => {
      targetElement.ownerDocument.body.removeEventListener("mousedown", this.#onMouseDown);
      targetElement.ownerDocument.body.removeEventListener("contextmenu", this.#onContextMenu);
      targetElement.ownerDocument.body.removeEventListener("mouseup", this.#onMouseUp);
      targetElement.ownerDocument.body.removeEventListener("mousemove", this.#onMouseMove);
      targetElement.ownerDocument.body.removeEventListener("mouseleave", this.#onMouseLeave);
      targetElement.ownerDocument.body.removeEventListener("wheel", this.#onMouseWheel);
      targetElement.ownerDocument.body.removeEventListener("dragstart", this.#onNativeDragStart);

      if (this.#targetElement && this.#targetElement === targetElement) {
         this.#targetElement = null;
      }
   }

   #isEventRelevant(/** @type {Event} */ event) {
      return event.target instanceof Node && this.#targetElement?.contains(event.target);
   }

   /** @param {DragEvent} event */
   #onNativeDragStart = event => {
      let eventRelevant = this.#isEventRelevant(event);
      if (eventRelevant) {
         event.preventDefault();
      }
   };

   /**
    * @param {MouseEvent} event 
    */
   #onMouseDown = event => {
      let eventRelevant = this.#isEventRelevant(event);
      if (event.button === 0 && eventRelevant && (this.onClick.hasSubscribers || 
         this.onDoubleClick.hasSubscribers || this.onDrag.hasSubscribers || 
         this.onDragStart.hasSubscribers || this.onDragEnd.hasSubscribers)) {
         this.#leftClickStart = {
            position: VU.new(event.clientX, event.clientY),
            target: event.target
         };
      }

      if (this.onRightClick.hasSubscribers && event.button === 2 && eventRelevant) {
         this.#rightClickStart = {
            position: VU.new(event.clientX, event.clientY),
            target: event.target
         };
      }
   };

   /**
    * @param {MouseEvent} event 
    */
   #onContextMenu = event => {
      let eventRelevant = this.#isEventRelevant(event);
      if (this.onRightClick.hasSubscribers && eventRelevant) {
         event.preventDefault();
      }
   };

   /**
    * @param {MouseEvent} event 
    */
   #onMouseMove = event => {
      this.#positionPrevious.x = this.#positionCurrent.x;
      this.#positionPrevious.y = this.#positionCurrent.y;
      this.#positionCurrent.x = event.clientX;
      this.#positionCurrent.y = event.clientY;

      if (this.#leftClickStart && !this.#rightClickStart) {
         let currentMovement = VU.sub(this.#positionCurrent, this.#positionPrevious);
         let currentMovementDistance = VU.len(currentMovement);
         
         let totalDragOffset = VU.sub(this.#positionCurrent, this.#leftClickStart.position);
         let totalDragDistance = VU.len(totalDragOffset);
         if (this.#dragStartedTimestamp === null && 
            totalDragDistance > this.#settings.dragStartTresholdDistance) {
            this.#dragStartedTimestamp = performance.now();
            this.#onDragStart.trigger({ 
               sender: this,
               initialOffset: totalDragOffset,
               position: this.#leftClickStart.position,
               target: this.#leftClickStart.target
            });
         }
         if (this.#dragStartedTimestamp !== null && currentMovementDistance > 0) {
            this.#onDrag.trigger({ 
               sender: this,
               offset: currentMovement,
               duration: (performance.now() - this.#dragStartedTimestamp) / 1000
            });
         }
      }

      this.#lastActionTimestamp = performance.now();
   };

   /**
    * @param {MouseEvent} event 
    */
   #onMouseUp = event => {
      let eventRelevant = this.#isEventRelevant(event);

      if (event.button === 0 && this.#leftClickStart) {
         if (this.#dragStartedTimestamp !== null) {
            this.#onDragEnd.trigger({ sender: this});
            this.#dragStartedTimestamp = null;
         } else {
            if (this.#doubleLeftClickTimeout === null) {
               this.#onClick.trigger({ 
                  sender: this,
                  position: this.#leftClickStart.position,
                  target: this.#leftClickStart.target 
               });
               if (this.onDoubleClick.hasSubscribers) {
                  this.#doubleLeftClickTimeout = setTimeout(
                     () => this.#doubleLeftClickTimeout = null, 
                     this.#settings.doubleClickTresholdMs);
               }
            } else {
               clearTimeout(this.#doubleLeftClickTimeout);
               this.#doubleLeftClickTimeout = null;
               this.#onDoubleClick.trigger({ 
                  sender: this,
                  position: this.#leftClickStart.position,
                  target: this.#leftClickStart.target 
               });
            }
         }

         this.#leftClickStart = null;
      }

      if (event.button === 2 && this.#rightClickStart && 
         this.#dragStartedTimestamp === null && eventRelevant) {
         this.#onRightClick.trigger({ 
            sender: this,
            position: this.#rightClickStart.position,
            target: this.#rightClickStart.target 
         });
         this.#rightClickStart = null;
      }

      this.#lastActionTimestamp = performance.now();
   };

   /**
    * @param {MouseEvent} event 
    */
   #onMouseLeave = event => {
      if (this.#dragStartedTimestamp !== null) {
         this.#onDragEnd.trigger({ sender: this });
         this.#dragStartedTimestamp = null;
      }
      this.#rightClickStart = this.#leftClickStart = null;

      this.#lastActionTimestamp = performance.now();
   };

   /**
    * @param {WheelEvent} event 
    */
   #onMouseWheel = event => {
      let eventRelevant = this.#isEventRelevant(event);
      if (!eventRelevant) {
         return;
      }

      if (this.#lastWheelMovementSinceScrollStart === null) {
         this.#onWheelStart.trigger({
            sender: this,
            target: event.target
         });
      }
      this.#onWheel.trigger({
         sender: this,
         position: this.#positionCurrent,
         factor: this.#getWheelDeltaFactor(event),
         target: event.target,
         smoothingHint: true
      });
      this.#lastWheelMovementSinceScrollStart = performance.now();

      this.#waitThenTriggerScrollEnd();
   };

   #waitThenTriggerScrollEnd = () => {
      let timeSinceLastWheelMovement = this.#lastWheelMovementSinceScrollStart !== null ?
         (performance.now() - (this.#lastWheelMovementSinceScrollStart ?? 0)) : null;
      if (timeSinceLastWheelMovement !== null && timeSinceLastWheelMovement > 100) {
         this.#lastWheelMovementSinceScrollStart = null;
         this.#onWheelEnd.trigger({ sender: this });
      } else if (timeSinceLastWheelMovement !== null) {
         setTimeout(this.#waitThenTriggerScrollEnd, 50);
      }
   };

   /**
    * @param {WheelEvent} event 
    * @returns {number}
    */
   #getWheelDeltaFactor(event) {
      if (this.#targetElement) {
         let maximum = event.deltaY < 0 ? (-1) : 1;
         let factor;
         if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
            factor = 1 - (this.#settings.scrollSpeed * (event.deltaY / 
               this.#targetElement.ownerDocument.documentElement.clientHeight));
         } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            factor = (event.deltaY >= 0 ? 2 : 0.5) * this.#settings.scrollSpeed;
         } else {
            factor = maximum - (0.01 * this.#settings.scrollSpeed) * maximum;
         }
         return factor;
      } else {
         return 1;
      }
   }
}