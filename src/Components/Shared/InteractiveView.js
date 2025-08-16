// SPDX-License-Identifier: GPL-3.0-or-later

import { InputManagerBinding } from "./InputManagerBinding.js";
import { ClassUtils } from "../../Utils/ClassUtils.js";
import { ViewBase } from "./ViewBase.js";

/**
 * @abstract Must override static string getter {@link tagName}.
 * Provides virtual base implementation for {@link disconnectedCallback} that unassigns any currently 
 * assigned {@link inputManager}.
 * Provides closed {@link ShadowRoot} with protected getter {@link root} and {@link inputManager} 
 * getter/setter and {@link inputEventsGroup} getter with event trigger on value change.
 * @extends {ViewBase}
 */
export class InteractiveView extends ViewBase {
   /**
    * Occurs after the current {@link inputEventsGroup} was changed to another value, which can happen
    * after assigning a new {@link inputManager} value.
    * @protected 
    */
   get onInputEventsGroupChanged() { return this.#inputManagerBinding.onInputEventsGroupChanged; }

   /**
    * Occurs after the current {@link inputManager} was changed to another value.
    * This event can be followed by a {@link onInputEventsGroupChanged} event.
    */
   get onInputManagerChanged() { return this.#inputManagerBinding.onInputManagerChanged; }

   /**
    * Gets the {@link InputEventsGroup} the current view is associated with, or null.
    * To change the input events group, see {@link inputManager}.
    * @protected 
    */
   get inputEventsGroup() { return this.#inputManagerBinding.inputEventsGroup; }

   /**
    * Gets or sets the {@link InputManager} the current view gets its {@link inputEventsGroup} from,
    * or null. Ensure the current class type is registered in the specified {@link InputManager} before
    * assigning it to this property.
    */
   get inputManager() { return this.#inputManagerBinding.inputManager; }
   set inputManager(value) { this.#inputManagerBinding.inputManager = value; }

   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {InputManagerBinding} */
   #inputManagerBinding;

   /**
    * @param {ClassType<HTMLElement>} [inputEventsGroupTargetType] Gets the type which is used to retrieve the 
    * correct {@link inputEventsGroup} from the assigned {@link inputManager}. If unspecified, the class
    * type of the current (derived) class is used.
    * @param {boolean} [openShadowRoot=false] 
    */
   constructor(inputEventsGroupTargetType, openShadowRoot = false) {
      super(openShadowRoot);
      this.#inputManagerBinding = new InputManagerBinding(
         inputEventsGroupTargetType ?? ClassUtils.getClassType(this));
   }

   /** @virtual The base method implementation must be called when being overridden. */
   disconnectedCallback() {
      this.#inputManagerBinding.disconnect();
   }
}