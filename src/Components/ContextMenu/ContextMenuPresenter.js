// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";
import { ContextMenuModel } from "./ContextMenuModel.js";
import { ContextMenuEntryModel } from "./ContextMenuEntryModel.js";
import { ContextMenuEntryPresenter } from "./ContextMenuEntryPresenter.js";
import { MathUtils } from "../../Utils/MathUtils.js";

/**
 * @typedef {object} ContextMenuEntryEventArgs
 * @property {ContextMenuEntryModel?} entry
 */

export class ContextMenuPresenter {  
   get model() { return this.#model; }
   get entries() { return this.#entryPresenters; }

   /** Occurs after the entries of this context menu were swapped with a new set of elements.  */
   get onMenuElementsChanged() { return this.#onMenuElementsChanged.event; }
   /** Occurs after the location (position/size) of the context menu was changed. */
   get onMenuLocationChanged() { return this.#onMenuLocationChanged.event; }
   /** Occurs after a specific entry was focussed (which un-focusses any previous element.) */
   get onEntryFocussed() { return this.#onEntryFocussed.event; }
   /** Occurs after a specific entry was activated (e.g. clicked). */
   get onEntryActivated() { return this.#onEntryActivated.event; }

   get focussedEntry() { return this.#entryFocus; }
   get isCurrentlyOpen() { return this.#entryPresenters.length > 0; }

   /** @typedef {import("../../Utils/RectangleUtils.js").Rectangle} Rectangle */
   
   /**
    * @template TEventArgs
    * @typedef {import("../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs> 
    */
   
   /** @type {ContextMenuEntryPresenter[]} */
   #entryPresenters = [];
   /** @type {ContextMenuEntryPresenter?} */
   #entryFocus = null;
   /** @type {ContextMenuModel} */
   #model = new ContextMenuModel();
   /** @type {number?} */
   #lastOpenedTimestamp = null;
   /** @type {number?} */
   #lastClosedTimestamp = null;

   /** @type {EventController<void>} */
   #onMenuElementsChanged = new EventController();
   /** @type {EventController<void>} */
   #onMenuLocationChanged = new EventController();
   /** @type {EventController<ContextMenuEntryEventArgs>} */
   #onEntryFocussed = new EventController();
   /** @type {EventController<ContextMenuEntryEventArgs>} */
   #onEntryActivated = new EventController();

   constructor() {
      this.#model.onUpdated.subscribe(this.#handleModelOnUpdated);
   }

   /**
    * 
    * @param {ContextMenuEntryPresenter[]} entries 
    * @param {Rectangle?} sourceBounds 
    * @param {boolean} [focusFirstEntry = false]
    */
   open(entries, sourceBounds, focusFirstEntry = false) {
      this.clearFocus();

      // When this method is used to repopulate the context menu, the presenter should not automatically create
      // new controllers for each entry model, as these are already provided by the caller -
      // therefore, the model onUpdated event subscription is disabled temporarily.
      this.#model.onUpdated.unsubscribe(this.#handleModelOnUpdated);

      let entryModels = [];
      let i = 0;
      for (let entry of entries) {
         Assert.class(entry, ContextMenuEntryPresenter, `entries[${i++}]`);

         entryModels.push(entry.model);
         entry.parentPresenter = this;
      }
      this.#model.entries = entryModels;
      this.#entryPresenters = entries;

      // Reenable the model onUpdated event subscription.
      this.#model.onUpdated.subscribe(this.#handleModelOnUpdated);

      this.#onMenuElementsChanged.trigger();

      this.#model.sourceBounds = sourceBounds;

      if (focusFirstEntry && entries.length > 0) {
         this.focusEntry(entries[0].model);
      }

      this.#lastOpenedTimestamp = performance.now();
   }

   close() {
      if (this.entries.length > 0) {
         this.clearFocus();
         this.#model.apply({ entries: [], sourceBounds: null });
         this.#lastClosedTimestamp = performance.now();
      }
   }

   /**
    * @param {ContextMenuEntryModel} entry 
    */
   focusEntry(entry) {
      Assert.class(entry, ContextMenuEntryModel, "entry");

      let oldEntryFocus = this.#entryFocus;
      this.#entryFocus = this.#entryPresenters.find(e => e.model === entry) ?? null;
      if (this.#entryFocus !== oldEntryFocus) {
         this.#onEntryFocussed.trigger({ entry });
      }
   }

   clearFocus() {
      if (this.#entryFocus !== null) {
         this.#entryFocus = null;
         this.#onEntryFocussed.trigger({ entry: null });
      }
   }

   /**
    * @param {number} offset 
    */
   moveFocus(offset) {
      Assert.numberInteger(offset, "offset");

      if (this.#entryPresenters.length > 0) {
         for (let i = 0; i < this.#entryPresenters.length; i++) {
            if (this.#entryPresenters[i].focussed) {
               let entry = this.#entryPresenters[MathUtils.moduloUnsigned(i + offset, this.#entryPresenters.length)];
               if (entry != null) {
                  this.focusEntry(entry.model);
               }
               return;
            }
         }      
         this.focusEntry(this.#entryPresenters[(offset) % this.#entryPresenters.length].model);
      }
   }

   /**
    * @param {ContextMenuEntryModel} entry 
    */
   activateEntry(entry) {
      Assert.class(entry, ContextMenuEntryModel, "entry");
      this.#onEntryActivated.trigger({ entry });
   }

   /**
    * @param {number} treshold 
    * @returns {boolean}
    */
   wasJustOpened(treshold = 250) {
      return this.#lastOpenedTimestamp != null &&
         (performance.now() - this.#lastOpenedTimestamp) < treshold;
   }

   /**
    * @param {number} treshold 
    * @returns {boolean}
    */
   wasJustClosed(treshold = 250) {
      return this.#lastClosedTimestamp != null &&
         (performance.now() - this.#lastClosedTimestamp) < treshold;
   }

   /** @type {EventHandler<import("../../Shared/Event.js").FieldsChangedEventArgs<ContextMenuModel>>} */
   #handleModelOnUpdated = (args) => {
      if (args.keys.includes("entries")) {
         for (let entryPresenter of this.#entryPresenters) {
            entryPresenter.parentPresenter = null;
         }

         this.#entryPresenters = [];

         for (let entryModel of this.#model.entries) {
            let presenter = new ContextMenuEntryPresenter(entryModel);
            presenter.parentPresenter = this;
            this.#entryPresenters.push(presenter);
         }

         this.#onMenuElementsChanged.trigger();
      }

      if (args.keys.includes("sourceBounds")) {
         this.#onMenuLocationChanged.trigger();  
      }
   };
}