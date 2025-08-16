// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";
import { InputEventsGroup } from "./UserInput/InputEventsGroup.js";
import { InputManager } from "./UserInput/InputManager.js";

export class InputManagerBinding {
   /**
    * Occurs after the current {@link inputEventsGroup} was changed to another value, which can happen
    * after assigning a new {@link inputManager} value.
    */
   get onInputEventsGroupChanged() { return this.#onInputEventsGroupChanged.event; }

   /**
    * Occurs after the current {@link inputManager} was changed to another value.
    * This event can be followed by a {@link onInputEventsGroupChanged} event.
    */
   get onInputManagerChanged() { return this.#onInputManagerChanged.event; }

   /**
    * Gets the {@link InputEventsGroup} the current view is associated with, or null.
    * To change the input events group, see {@link inputManager}.
    */
   get inputEventsGroup() { return this.#inputEventsGroup; }

   /**
    * Gets or sets the {@link InputManager} the current view gets its {@link inputEventsGroup} from,
    * or null. Ensure the current class type is registered in the specified {@link InputManager} before
    * assigning it to this property.
    */
   get inputManager() { return this.#inputManager; }
   set inputManager(value) {
      if (value !== this.#inputManager) {
         if (value !== null) {
            Assert.class(value, InputManager);
         }

         let oldInputManager = this.#inputManager;
         this.#inputManager = value;

         let oldInputEventsGroup = this.#inputEventsGroup;
         let targetType = this.#inputEventsGroupTargetType
         this.#inputEventsGroup = this.#inputManager?.getInputEventGroup(targetType) ?? null;

         this.#onInputManagerChanged.trigger({
            oldValue: oldInputManager,
            newValue: this.#inputManager
         });

         if (oldInputEventsGroup !== this.#inputEventsGroup) {
            this.#onInputEventsGroupChanged.trigger({
               oldValue: oldInputEventsGroup,
               newValue: this.#inputEventsGroup
            });
         }
      }
   }

   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {ClassType<HTMLElement>} */
   #inputEventsGroupTargetType;
   /** @type {InputManager?} */
   #inputManager = null;
   /** @type {InputEventsGroup?} */
   #inputEventsGroup = null;

   /** @type {EventController<import("../../Shared/Event.js").ValueChangedEventArgs<InputEventsGroup>>} */
   #onInputEventsGroupChanged = new EventController();
   /** @type {EventController<import("../../Shared/Event.js").ValueChangedEventArgs<InputManager>>} */
   #onInputManagerChanged = new EventController();

   /**
    * @param {ClassType<HTMLElement>} inputEventsGroupTargetType 
    */
   constructor(inputEventsGroupTargetType) {
      Assert.classType(inputEventsGroupTargetType, "inputEventsGroupTargetType");
      this.#inputEventsGroupTargetType = inputEventsGroupTargetType;
   } 

   disconnect() {
      this.inputManager = null;
   }
} 