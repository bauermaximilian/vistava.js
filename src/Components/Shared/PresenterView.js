// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { PresenterBinding } from "./PresenterBinding.js";
import { ViewBase } from "./ViewBase.js";

/**
 * @template TPresenter
 * @abstract Must override static string getter {@link tagName}.
 * Provides virtual base implementation for {@link disconnectedCallback} that dismounts presenter.
 * Provides closed {@link ShadowRoot} with protected getter {@link root}, {@link presenter} getters/setters and
 * an {@link onPresenterChanged} event.
 * @example
 * const tagName = "my-view";
 * export class MyPresenterView extends PresenterView {
 *    static get tagName() { return tagName; } 
 *    constructor() {
 *       super(MyPresenter);
 *       this.onPresenterChanged.subscribe(
 *          this.#handleOnPresenterChanged);
 *    } 
 *    #handleOnPresenterChanged = (args) => { };
 * }
 */
export class PresenterView extends ViewBase {
   get presenter() { return this.#presenterBinding.presenter; }
   set presenter(value) { this.#presenterBinding.presenter = value; }
   get onPresenterChanged() { return this.#presenterBinding.onPresenterChanged; }

   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {PresenterBinding<TPresenter>} */
   #presenterBinding;
   
   /**
    * @param {ClassType<TPresenter>} presenterType 
    * @param {boolean} [openShadowRoot=false] 
    */
   constructor(presenterType, openShadowRoot = false) {
      super(openShadowRoot);

      Assert.classType(presenterType, "presenterType");
      this.#presenterBinding = new PresenterBinding(presenterType);
   }

   /** @virtual The method base implementation in {@link PresenterView} is empty. */
   connectedCallback() {
   }

   /** @virtual The method base implementation in {@link PresenterView} sets the {@link presenter} to null. */
   disconnectedCallback() {
      this.#presenterBinding.disconnect();
   }
}
