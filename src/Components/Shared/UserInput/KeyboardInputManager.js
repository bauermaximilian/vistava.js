// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { EventController } from "../../../Shared/Event.js";
import { VectorUtils as V } from "../../../Utils/VectorUtils.js";
import { KeyboardInputManagerSettings } from "./KeyboardInputManagerSettings.js";
import defaultConfiguration from "./Configurations/keyboard.json" with { type: "json" };

export class KeyboardInputManager {
   /** @readonly @type {number} */
   #actionTriggerTreshold = 200;

   /** @type {HTMLElement?} */
   #targetElement = null;
   /** @type {number} */
   #currentMovementDuration = 0;
   /** @type {number?} */
   #requestAnimationFrameHandler = null;
   /** @type {number?} */
   #lastAnimationFrameTimestamp = null;

   /** @type {boolean} */
   #moveUpDown = false;
   /** @type {boolean} */
   #moveRightDown = false;
   /** @type {boolean} */
   #moveDownDown = false;
   /** @type {boolean} */
   #moveLeftDown = false;
   /** @type {Map<string,number>} */
   #startedKeyActions = new Map();

   /** @type {KeyboardInputManagerSettings} */
   #settings = KeyboardInputManagerSettings.fromConfiguration(defaultConfiguration);

   /** @type {EventController<{sender:KeyboardInputManager, initialOffset:Vector}>} */
   #onMoveStart = new EventController();
   /** @type {EventController<{sender:KeyboardInputManager, offset:Vector, duration:number}>} */
   #onMove = new EventController();
   /** @type {EventController<{sender:KeyboardInputManager}>} */
   #onMoveEnd = new EventController();
   /** @type {EventController<{sender:KeyboardInputManager, action:string}>} */
   #onKeyAction = new EventController();

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("./InputManager.js").TargetElementDetacher} TargetElementDetacher */

   get #arrowKeyDown() { 
      return this.#moveLeftDown || this.#moveRightDown || 
         this.#moveUpDown || this.#moveDownDown; 
   }

   get #enableMovementByKeys() {
      return this.#settings.moveUpKey && this.#settings.moveRightKey &&
         this.#settings.moveDownKey && this.#settings.moveLeftKey; 
   }

   get onMoveStart() { return this.#onMoveStart.event; }
   get onMove() { return this.#onMove.event; }
   get onMoveEnd() { return this.#onMoveEnd.event; }
   get onKeyAction() { return this.#onKeyAction.event; }
   
   /** @type {boolean} */
   get isAttached() { return this.#targetElement !== null; }

   get settings() { return this.#settings; }
   set settings(value) {
      Assert.class(value, KeyboardInputManagerSettings, "value");
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

      this.#targetElement.ownerDocument.body.addEventListener("keydown", this.#onKeyDown);
      this.#targetElement.ownerDocument.body.addEventListener("keyup", this.#onKeyUp);
      this.#targetElement.ownerDocument.addEventListener("visibilitychange", this.#onFocusLost);
      window.addEventListener("blur", this.#onFocusLost);

      return () => this.#detach(targetElement);
   }

   /**
    * @param {HTMLElement} targetElement
    */
   #detach = targetElement => {
      targetElement.ownerDocument.body.removeEventListener("keydown", this.#onKeyDown);
      targetElement.ownerDocument.body.removeEventListener("keyup", this.#onKeyUp);
      targetElement.ownerDocument.removeEventListener("visibilitychange", this.#onFocusLost);
      window.removeEventListener("blur", this.#onFocusLost);

      this.#startedKeyActions.clear();
      
      this.#targetElement = null;
   };

   /**
    * @param {KeyboardEvent} event 
    */
   #onKeyDown = event => {
      this.#moveLeftDown = (!this.#moveLeftDown && event.key === this.#settings.moveLeftKey) ? 
         true : this.#moveLeftDown;
      this.#moveRightDown = (!this.#moveRightDown && event.key === this.#settings.moveRightKey) ? 
         true : this.#moveRightDown;
      this.#moveUpDown = (!this.#moveUpDown && event.key === this.#settings.moveUpKey) ? 
         true : this.#moveUpDown;
      this.#moveDownDown = (!this.#moveDownDown && event.key === this.#settings.moveDownKey) ? 
         true : this.#moveDownDown;
         
      let keyAction = this.#settings.keyActions.get(this.#getKeyName(event));
      if (keyAction !== undefined && !this.#startedKeyActions.has(keyAction)) {
         this.#startedKeyActions.set(keyAction, performance.now());
      }

      if (this.#enableMovementByKeys && this.#arrowKeyDown && 
         this.#requestAnimationFrameHandler === null) {
         this.#startUpdatingMovement(null);
      }
   };

   /**
    * @param {KeyboardEvent} event 
    */
   #onKeyUp = event => {      
      let keyAction = this.#settings.keyActions.get(this.#getKeyName(event));
      if (keyAction !== undefined) {
         let keyActionStarted = this.#startedKeyActions.get(keyAction);
         if (keyActionStarted !== undefined && 
            (performance.now() - keyActionStarted) < this.#actionTriggerTreshold) {
            this.#onKeyAction.trigger({ sender: this, action: keyAction });
         }
         this.#startedKeyActions.delete(keyAction);
      }

      this.#moveLeftDown = (this.#moveLeftDown && event.key === this.#settings.moveLeftKey) ? 
         false : this.#moveLeftDown;
      this.#moveRightDown = (this.#moveRightDown && event.key === this.#settings.moveRightKey) ? 
         false : this.#moveRightDown;
      this.#moveUpDown = (this.#moveUpDown && event.key === this.#settings.moveUpKey) ? 
         false : this.#moveUpDown;
      this.#moveDownDown = (this.#moveDownDown && event.key === this.#settings.moveDownKey) ? 
         false : this.#moveDownDown;
   };

   #onFocusLost = () => {
      this.#moveLeftDown = this.#moveRightDown = this.#moveUpDown = this.#moveDownDown = false;
      this.#startedKeyActions.clear();
   };

   /**
    * @param {KeyboardEvent} event 
    * @returns {string}
    */
   #getKeyName(event) {
      let keyName = event.key;
      if (event.shiftKey && event.key !== "Shift") {
         keyName = "Shift+" + keyName;
      } else if (event.ctrlKey && event.key !== "Control") {
         keyName = "Ctrl+" + keyName;
      } else if (event.altKey && event.key !== "Alt") {
         keyName = "Alt+" + keyName;
      }
      return keyName;
   }

   /**
    * @param {number?} timestamp 
    */
   #startUpdatingMovement = timestamp => {
      let elapsedSeconds = 0;
      if (this.#lastAnimationFrameTimestamp !== null && timestamp != null) {
         elapsedSeconds = (timestamp - this.#lastAnimationFrameTimestamp) / 1000;
      }

      this.#lastAnimationFrameTimestamp = timestamp;

      if (this.#arrowKeyDown) {
         let currentMovementInput = V.norm(V.new( 
            (this.#moveLeftDown ? 1 : 0) + (this.#moveRightDown ? -1 : 0),
            (this.#moveUpDown ? 1 : 0) + (this.#moveDownDown ? -1 : 0)
         ));
         let currentMovementInputLength = V.len(currentMovementInput);

         let t = this.#currentMovementDuration / this.#settings.movementSpeedupDuration - 
            this.#settings.movementSpeedupStart;
         let movementFadeIn = t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

         let clampedMovementInput = currentMovementInputLength > 1 ? 
            V.scale(currentMovementInput, 1 / currentMovementInputLength) : currentMovementInput;

         let movementOffset = V.scale(clampedMovementInput, 
            this.#settings.movementSpeed * movementFadeIn * elapsedSeconds);

         if (V.len(currentMovementInput) > 0) {
            if (this.#requestAnimationFrameHandler === null) {
               this.#onMoveStart.trigger({sender: this, initialOffset: movementOffset});
            } else {
               this.#onMove.trigger({ 
                  sender: this,
                  offset: movementOffset, 
                  duration: this.#currentMovementDuration 
               });
            }
            this.#currentMovementDuration += elapsedSeconds;
         }
      }

      if (this.#enableMovementByKeys && this.#arrowKeyDown) {
         this.#requestAnimationFrameHandler = requestAnimationFrame(this.#startUpdatingMovement);
      } else {
         this.#onMoveEnd.trigger({ sender: this });
         this.#currentMovementDuration = 0;
         this.#requestAnimationFrameHandler = null;
      }
   };
}