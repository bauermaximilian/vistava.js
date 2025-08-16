// SPDX-License-Identifier: GPL-3.0-or-later

import { InputManagerBinding } from "./InputManagerBinding.js";
import { PresenterView } from "./PresenterView.js";
import { InputEventsGroup } from "./UserInput/InputEventsGroup.js";
import { InputManager } from "./UserInput/InputManager.js";
import { ClassUtils } from "../../Utils/ClassUtils.js";

/**
 * @template TPresenter
 * @abstract Must override static string getter {@link tagName}.
 * Provides virtual base implementation for {@link disconnectedCallback} that dismounts presenter and
 * unassigns any currently assigned {@link inputManager}.
 * Provides closed {@link ShadowRoot} with protected getter {@link root}, {@link presenter} getters/setters,
 * a {@link onPresenterChanged} event and a {@link assertPresenterAssigned} method to throw an error when 
 * no {@link presenter} is currently assigned.
 * Provides {@link inputManager} getter/setter and {@link inputEventsGroup} getter with event trigger on 
 * value change.
 * @extends {PresenterView<TPresenter>}
 */
export class InteractivePresenterView extends PresenterView {
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
    * @param {ClassType<TPresenter>} presenterType 
    * @param {ClassType<HTMLElement>} [inputEventsGroupTargetType] Gets the type which is used to retrieve the 
    * correct {@link inputEventsGroup} from the assigned {@link inputManager}. If unspecified, the class
    * type of the current (derived) class is used.
    * @param {boolean} [openShadowRoot=false] 
    */
   constructor(presenterType, inputEventsGroupTargetType, openShadowRoot = false) {
      super(presenterType, openShadowRoot);
      this.#inputManagerBinding = new InputManagerBinding(
         inputEventsGroupTargetType ?? ClassUtils.getClassType(this));
   }

   /** @virtual The base method implementation must be called when being overridden. */
   disconnectedCallback() {
      super.disconnectedCallback();
      this.#inputManagerBinding.disconnect();
   }
}