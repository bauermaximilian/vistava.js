// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../../Shared/Assert.js";
import { ArgumentError } from "../../../../Errors/ArgumentError.js";
import { InvalidOperationError } from "../../../../Errors/InvalidOperationError.js";
import { EventController } from "../../../../Shared/Event.js";
import { GamepadProfile } from "./GamepadProfile.js";
import { VectorUtils as V } from "../../../../Utils/VectorUtils.js";
import { GamepadInputManagerSettings } from "./GamepadInputManagerSettings.js";
import { AU } from "../../../../Utils/ArrayUtils.js";

export class GamepadInputManager {
   /** 
    * @typedef {object} MappedGamepad
    * @property {GamepadProfile} profile
    * @property {GamepadState} gamepad
    */

   /**
    * @typedef {object} GamepadState
    * @property {number[]} axes
    * @property {boolean[]} buttons
    */

   /** @typedef {import("../../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("../InputManager.js").TargetElementDetacher} TargetElementDetacher */

   /** @readonly */
   #newGamepadPollingInterval = 1000;

   /** @type {GamepadInputManagerSettings} */
   #settings = new GamepadInputManagerSettings();

   /** @type {HTMLElement?} */
   #targetElement = null;
   /** @type {number?} */
   #lastAnimationFrameTimestamp = null;
   /** @type {number} */
   #currentMovementDuration = 0;
   /** @type {MappedGamepad[]} */
   #previousGamepads = [];

   /** @readonly @type {EventController<{sender: GamepadInputManager, initialOffset:Vector}>} */
   #onMoveStart = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager, offset:Vector, duration:number}>} */
   #onMove = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager}>} */
   #onMoveEnd = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager, target:EventTarget?}>} */
   #onScrollStart = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager, position:Vector, factor:number, smoothingHint:boolean, target:EventTarget?}>} */
   #onScroll = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager}>} */
   #onScrollEnd = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager, action:string}>} */
   #onButtonAction = new EventController();
   /** @readonly @type {EventController<{sender: GamepadInputManager, action:string}>} */
   #onAxisAction = new EventController();
   
   get onMoveStart() { return this.#onMoveStart.event; }
   get onMove() { return this.#onMove.event; }
   get onMoveEnd() { return this.#onMoveEnd.event; }
   get onScrollStart() { return this.#onScrollStart.event; }
   get onScroll() { return this.#onScroll.event; }
   get onScrollEnd() { return this.#onScrollEnd.event; }
   get onButtonAction() { return this.#onButtonAction.event; }
   get onAxisAction() { return this.#onAxisAction.event; }

   get settings() { return this.#settings; }
   set settings(value) {
      Assert.class(value, GamepadInputManagerSettings, "value");
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
      this.#startWaitingForGamepads();

      return () => this.#detach(targetElement);
   }

   /**
    * @param {HTMLElement} targetElement
    */
   #detach = (targetElement) => {
      if (this.#targetElement && this.#targetElement === targetElement) {
         this.#targetElement = null;
      }
   }

   /**
    * @returns {MappedGamepad[]?}
    */
   #getConnectedGamepads() {
      let gamepads;
      try {
         gamepads = navigator.getGamepads();
      } catch {
         return null;
      }

      /** @type {MappedGamepad[]} */
      let connectedGamepads = [];
      if (gamepads) {
         for (let gamepad of gamepads) {
            if (gamepad !== null) {
               let gamepadId = gamepad.id;
               let profile = AU.findLastOrNull(this.settings.profiles,
                  p => p.identifierRegExp.test(gamepadId)) ??
                  (this.settings.profiles.length > 0 ? this.settings.profiles[0] : null);
               /** @type {GamepadState} */
               let gamepadState = {
                  axes: [...gamepad.axes],
                  buttons: gamepad.buttons.map(button => button.pressed)
               };
               if (profile !== null) {
                  connectedGamepads.push({ gamepad: gamepadState, profile });
               }
            }
         }
      }
      return connectedGamepads;
   }

   #startWaitingForGamepads = () => {
      let gamepads = this.#getConnectedGamepads();
      if (gamepads && gamepads.length === 0 && this.#targetElement !== null) {
         setTimeout(this.#startWaitingForGamepads, this.#newGamepadPollingInterval);
      } else if (gamepads && gamepads.length > 0 && this.#targetElement !== null) {
         this.#startProcessingGamepadStates(null);
      } else if (!gamepads) {
         console.error("Couldn't access gamepad API - ensure your browser supports this " +
            "functionality and the page is loaded in a secure context (HTTPS).");
      }
   };

   /** @param {number?} timestamp */
   #startProcessingGamepadStates = timestamp => {
      let gamepads = this.#getConnectedGamepads();
      let shouldProcessGamepadStates = 
         gamepads && gamepads.length > 0 && this.#targetElement !== null;

      if (gamepads) {
         let elapsedSeconds = 0;
         if (this.#lastAnimationFrameTimestamp !== null && timestamp != null) {
            elapsedSeconds = (timestamp - this.#lastAnimationFrameTimestamp) / 1000;
         } 
         this.#lastAnimationFrameTimestamp = timestamp;

         for (let g = 0; g < Math.max(this.#previousGamepads.length, gamepads.length); g++) {
            let current = g < gamepads.length ? gamepads[g] : null;
            let previous = g < this.#previousGamepads.length ? this.#previousGamepads[g] : null;
            let profile = this.#getGamepadProfile(previous, current);

            this.#processButtons(previous, current, profile, elapsedSeconds);
            this.#processAxes(previous, current, profile, elapsedSeconds);
         }

         this.#previousGamepads = [];
         for (let gamepad of gamepads) {
            this.#previousGamepads.push(gamepad);
         }
      }

      if (shouldProcessGamepadStates) {
         requestAnimationFrame(this.#startProcessingGamepadStates);
      } else {
         this.#startWaitingForGamepads();
      }
   };

   /**
    * @param {MappedGamepad?} previous 
    * @param {MappedGamepad?} current 
    * @param {GamepadProfile} profile
    * @param {number} elapsedSeconds
    */
   #processButtons(previous, current, profile, elapsedSeconds) {
      let currentButtons = current !== null ? current.gamepad.buttons : [];
      let previousButtons = previous !== null ? previous.gamepad.buttons : [];
      
      for (let b = 0; b < Math.max(currentButtons.length, previousButtons.length); b++) {
         let currentButtonPressed = 
            b < currentButtons.length ? currentButtons[b] : false;
         let previousButtonPressed =
            b < previousButtons.length ? previousButtons[b] : false;

         if (previousButtonPressed && !currentButtonPressed) {
            let action = profile.buttonActions.get(b.toString());
            if (action !== undefined) {
               this.#onButtonAction.trigger({ sender: this, action: action });
            }
         }
      }
   }

   /**
    * @param {(readonly number[]|number[])} axes 
    * @param {number?} axisIndex 
    * @returns {number}
    */
   #getAxisInput(axes, axisIndex) {
      if (axisIndex !== null && axisIndex >= 0 && axisIndex < axes.length) {
         return axes[axisIndex];
      } else {
         return 0;
      }
   }

   /**
    * @param {(readonly number[]|number[])} axes 
    * @param {GamepadProfile} profile
    * @returns {Vector}
    */
   #getMovementInput(axes, profile) {
      let horizontalMovementInput = this.#getAxisInput(axes, profile.axisMoveHorizontal);
      let verticalMovementInput = this.#getAxisInput(axes, profile.axisMoveVertical);
      return V.new(horizontalMovementInput, verticalMovementInput);
   }

   /**
    * @param {MappedGamepad?} previous 
    * @param {MappedGamepad?} current 
    * @param {GamepadProfile} profile
    * @param {number} elapsedSeconds
    */
   #processAxes(previous, current, profile, elapsedSeconds) {
      let previousAxes = previous?.gamepad.axes ?? [];
      let currentAxes = current?.gamepad.axes ?? [];

      let currentMovementInput = this.#getMovementInput(currentAxes, profile);
      let currentMovementInputLength = V.len(currentMovementInput);
      let previousMovementInput = this.#getMovementInput(previousAxes, profile);
      let previousMovementInputLength = V.len(previousMovementInput);

      let speedupIntensity = this.#settings.movementSpeedupTimeSeconds <= 0 ? 1 :
         Math.min(1, this.#currentMovementDuration / this.#settings.movementSpeedupTimeSeconds);
      let movementSpeedupFactor = 1 + this.#settings.movementSpeedupByFactor * speedupIntensity;
      let clampedMovementInput = currentMovementInputLength > 1 ? 
         V.scale(currentMovementInput, 1 / currentMovementInputLength) : currentMovementInput;
      let movementOffset = V.scale(clampedMovementInput, 
         this.#settings.movementSpeed * movementSpeedupFactor * elapsedSeconds);
      if (profile.invertHorizontal && profile.invertVertical) {
         movementOffset = V.scale(movementOffset, -1);
      }
      else if (profile.invertHorizontal) {
         movementOffset = V.new(movementOffset.x * -1, movementOffset.y);
      }
      else if (profile.invertVertical) {
         movementOffset = V.new(movementOffset.x, movementOffset.y * -1);
      }

      if (previousMovementInputLength < profile.axisActivationTreshold &&
         currentMovementInputLength >= profile.axisActivationTreshold) {
         this.#onMoveStart.trigger({ sender: this, initialOffset: movementOffset });
      } else if (previousMovementInputLength >= profile.axisActivationTreshold &&
         currentMovementInputLength >= profile.axisActivationTreshold) {
         this.#onMove.trigger({ 
            sender: this, 
            offset: movementOffset, 
            duration: this.#currentMovementDuration 
         });
         this.#currentMovementDuration += elapsedSeconds;
      } else if (previousMovementInputLength >= profile.axisActivationTreshold &&
         currentMovementInputLength < profile.axisActivationTreshold) {
         this.#onMoveEnd.trigger({sender: this});
         this.#currentMovementDuration = 0;
      }

      let currentScrollInput = this.#getAxisInput(currentAxes, profile.axisScroll);
      let previousScrollInput = this.#getAxisInput(previousAxes, profile.axisScroll);

      if (Math.abs(previousScrollInput) < profile.axisActivationTreshold &&
         Math.abs(currentScrollInput) >= profile.axisActivationTreshold) {
         this.#onScrollStart.trigger({ sender: this, target: null });
      } else if (Math.abs(previousScrollInput) >= profile.axisActivationTreshold &&
         Math.abs(currentScrollInput) >= profile.axisActivationTreshold &&
         this.#targetElement && this.#onScroll.event.hasSubscribers) {
         // Scaling out looks faster than scaling in with the same factor, so let's damp the scaling out a bit
         let directionFactor = currentScrollInput > 0 ? 0.9 : -1;
         let scrollFactor = Math.max(0.75, Math.min(1.25,
            1 - (this.#settings.scrollSpeed * elapsedSeconds * directionFactor)));
         let bounds = this.#targetElement.getBoundingClientRect();
         let boundsCenter = V.new(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2
         );
         this.#onScroll.trigger({ 
            sender: this, 
            position: boundsCenter,
            factor: scrollFactor,
            target: null,
            smoothingHint: true
         });
      } else if (Math.abs(previousScrollInput) >= profile.axisActivationTreshold &&
         Math.abs(currentScrollInput) < profile.axisActivationTreshold) {
         this.#onScrollEnd.trigger({ sender: this });
      }

      for (let a = 0; a < Math.min(currentAxes.length, previousAxes.length); a++) {
         let axisActionPositive = profile.axisActions.get(`${a}`);
         let axisActionNegative = profile.axisActions.get(`${a}-`);
         if (axisActionPositive !== undefined &&
            previousAxes[a] < profile.axisActionTriggerTreshold &&
            currentAxes[a] >= profile.axisActionTriggerTreshold) {
            this.#onAxisAction.trigger({ sender: this, action: axisActionPositive });
         } else if (axisActionNegative !== undefined &&
            previousAxes[a] > -profile.axisActionTriggerTreshold &&
            currentAxes[a] <= -profile.axisActionTriggerTreshold) {
            this.#onAxisAction.trigger({ sender: this, action: axisActionNegative });
         }         
      }
   }

   /**
    * @param {MappedGamepad?} previous 
    * @param {MappedGamepad?} current 
    * @returns {GamepadProfile}
    * @throws {ArgumentError} Is thrown when both {@link previous} and {@link current} are null.
    */
   #getGamepadProfile(previous, current) {
      if (current !== null) {
         return current.profile;
      } else if (previous !== null) {
         return previous.profile;
      } else {
         throw new ArgumentError("At least one gamepad state must be provided.");
      }
   }
}