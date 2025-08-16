// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";
import { ContextMenuPresenter } from "./ContextMenuPresenter.js";
import { ContextMenuEntryModel } from "./ContextMenuEntryModel.js";

/**
 * @typedef {object} ContextMenuEntryFocusChangedEventArgs
 * @property {ContextMenuEntryPresenter} presenter
 * @property {boolean} isFocussed
 */

/**
 * @typedef {object} ContextMenuEntryVisibilityChangedEventArgs
 * @property {ContextMenuEntryPresenter} presenter
 * @property {boolean} isVisible
 */

/**
 * @typedef {object} ContextMenuEntryActivatedEventArgs
 * @property {ContextMenuEntryPresenter} presenter
 * @property {boolean} keepContextMenuOpen
 */

/**
 * @typedef {object} ContextMenuEntryPresenterInit
 * @property {ContextMenuEntryModel} [model]
 * @property {EventHandler<ContextMenuEntryActivatedEventArgs>} [onActivated]
 * @property {EventHandler<ContextMenuEntryFocusChangedEventArgs>} [onFocusChanged]
 * @property {EventHandler<void>} [onShown]
 */

export class ContextMenuEntryPresenter {
   get parentPresenter() { return this.#parentPresenter; }
   set parentPresenter(value) { 
      if (this.#parentPresenter !== value) {
         Assert.ifDefined(value, () => Assert.class(value, ContextMenuPresenter));
         let oldPresenter = this.#parentPresenter;
         this.#parentPresenter = value;
         this.#onParentPresenterChanged.trigger({ oldValue: oldPresenter, newValue: value });
      }
   }

   get focussed() { return this.#focussed; }
   get model() { return this.#model; }

   get isSeparator() {
      return this.#model.iconLabel === null && this.#model.iconName === null &&
         this.#model.iconUrl === null && this.#model.label === null;
   }
   get hasIcon() { 
      return this.model.iconName !== null || this.model.iconLabel !== null || this.model.iconUrl !== null;
   }

   get onParentPresenterChanged() { return this.#onParentPresenterChanged.event; }
   get onActivated() { return this.#onActivated.event; }
   get onFocusChanged() { return this.#onFocusChanged.event; }
   get onShown() { return this.#onShown.event; }

   /** 
    * @template TEventArgs
    * @typedef {import("../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs> 
    */

   /** @type {ContextMenuEntryModel} */
   #model;
   /** @type {boolean} */
   #focussed = false;
   /** @type {ContextMenuPresenter?} */
   #parentPresenter = null;
   /** @type {EventController<import("../../Shared/Event.js").ValueChangedEventArgs<ContextMenuPresenter>>} */
   #onParentPresenterChanged = new EventController();
   /** @type {EventController<ContextMenuEntryActivatedEventArgs>} */
   #onActivated = new EventController();
   /** @type {EventController<ContextMenuEntryFocusChangedEventArgs>} */
   #onFocusChanged = new EventController();
   /** @type {EventController<void>} */
   #onShown = new EventController();

   /**
    * @param {ContextMenuEntryModel} [model]
    */
   constructor(model) {
      if (model != null) {
         Assert.class(model, ContextMenuEntryModel, "model");
         this.#model = model;
      } else {
         this.#model = new ContextMenuEntryModel();
      }

      this.onParentPresenterChanged.subscribe(this.#handleOnParentPresenterChanged);
   }

   /** @type {EventHandler<import("../../Shared/Event.js").ValueChangedEventArgs<ContextMenuPresenter>>} */
   #handleOnParentPresenterChanged = (args) => {
      args.oldValue?.onEntryActivated.unsubscribe(this.#handleParentPresenterOnActivated);
      args.oldValue?.onEntryFocussed.unsubscribe(this.#handleParentPresenterOnFocusChanged);
      args.oldValue?.onMenuElementsChanged.unsubscribe(this.#handleParentPresenterOnMenuElementsChanged);

      args.newValue?.onEntryActivated.subscribe(this.#handleParentPresenterOnActivated);
      args.newValue?.onEntryFocussed.subscribe(this.#handleParentPresenterOnFocusChanged);
      args.newValue?.onMenuElementsChanged.subscribe(this.#handleParentPresenterOnMenuElementsChanged);
   };

   /** @type {EventHandler<import("./ContextMenuPresenter.js").ContextMenuEntryEventArgs>} */
   #handleParentPresenterOnActivated = (args) => {
      if (args.entry === this.model) {
         /** @type {ContextMenuEntryActivatedEventArgs} */
         let args = { presenter: this, keepContextMenuOpen: false };
         this.#onActivated.trigger(args);
         if (!args.keepContextMenuOpen) {
            this.parentPresenter?.close();
         }
      }
   };

   /** @type {EventHandler<import("./ContextMenuPresenter.js").ContextMenuEntryEventArgs>} */
   #handleParentPresenterOnFocusChanged = (args) => {
      let shouldBeFocussedNow = args.entry === this.model;
      if (this.#focussed !== shouldBeFocussedNow) {
         this.#focussed = shouldBeFocussedNow;
         this.#onFocusChanged.trigger({ isFocussed: true, presenter: this });
      }
   };

   /** @type {EventHandler<void>} */
   #handleParentPresenterOnMenuElementsChanged = () => {
      this.#onShown.trigger();
   };
}