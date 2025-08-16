// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { EventController } from "../../Shared/Event.js";

export class MissingPresenterError extends InvalidOperationError {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The operation can not be executed until a presenter is assigned.");
   }
}

/**
 * @template TPresenter
 * @example
 * class ExampleView extends HTMLElement {
 *    #binding = new PresenterBinding(ExamplePresenter);
 *    get presenter() { return this.#binding.presenter; }
 *    set presenter(value) { this.#binding.presenter = value; }
 *    get onPresenterChanged() { return this.#binding.onPresenterChanged; }
 * }
 */
export class PresenterBinding {
   /** @type {TPresenter?} */
   get presenter() { return this.#presenter; }
   /** @type {TPresenter?} */
   set presenter(value) {
      if (this.#presenter !== value) {
         Assert.ifDefined(value, () => Assert.class(value, this.#presenterType));
         let oldPresenter = this.#presenter;
         this.#presenter = value ?? null;
         this.#onPresenterChanged.trigger({
            oldValue: oldPresenter,
            newValue: this.#presenter
         });
      }
   }
   get onPresenterChanged() { return this.#onPresenterChanged.event; }

   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {ClassType<TPresenter>} */
   #presenterType;
   /** @type {TPresenter?} */
   #presenter = null;
   /** @type {EventController<import("../../Shared/Event.js").ValueChangedEventArgs<TPresenter>>} */
   #onPresenterChanged = new EventController();

   /**
    * @param {ClassType<TPresenter>} presenterConstructor 
    */
   constructor(presenterConstructor) {
      this.#presenterType = presenterConstructor;
   }

   disconnect() {
      this.presenter = null;
   }
}