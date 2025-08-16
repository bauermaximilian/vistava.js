// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { ArgumentError } from "../../Errors/ArgumentError.js";
import { EventController } from "../../Shared/Event.js";
import { TileModel } from "./Tile/TileModel.js";

/**
 * @typedef {object} TileGridModelUpdateEventArgs
 * @property {boolean} updatedGridStart
 * @property {boolean} updatedGridEnd
 * @property {TileModel} model
 */

export class TileGridModel {
   get count() { return this.#models.length; }

   get first() { return this.#models.length > 0 ? this.#models[0] : null; }
   get last() { return this.#models.length > 0 ? this.#models[this.#models.length - 1] : null; }

   get onAdded() { return this.#onAdded.event; }
   get onTrimmed() { return this.#onTrimmed.event; }
   get onCleared() { return this.#onCleared.event; }

   get indices() { return this.#modelsByIndex.keys(); }
   get indicesSorted() { return this.#getIndicesSorted(); }

   /** @type {EventController<TileGridModelUpdateEventArgs>} */
   #onAdded = new EventController();
   /** @type {EventController<TileGridModelUpdateEventArgs>} */
   #onTrimmed = new EventController();
   /** @type {EventController<void>} */
   #onCleared = new EventController();

   /** @type {TileModel[]} */
   #models = [];
   /** @type {Map<number, TileModel>} */
   #modelsByIndex = new Map();

   constructor() {
   }

   /**
    * @overload
    * @param {TileModel} model 
    * @returns {boolean}
    */
   /**
    * @overload
    * @param {number} modelIndex
    * @returns {boolean}
    */
   has() {
      if (typeof (arguments[0]) === "number") {
         return this.#modelsByIndex.has(arguments[0]);
      } else {
         return this.#models.includes(arguments[0]);
      }
   }

   /**
    * @param {number} index 
    * @returns {TileModel?}
    */
   get(index) {
      return this.#modelsByIndex.get(index) ?? null;
   }
   
   /**
    * @param {TileModel} model 
    */
   add(model) {
      Assert.class(model, TileModel, "model");

      if (!this.#models.includes(model)) {
         if (!this.#modelsByIndex.has(model.index)) {
            let first = this.first;
            let last = this.last;
            if (first !== null && model.index < first.index) {
               this.#models.splice(0, 0, model);
               this.#modelsByIndex.set(model.index, model);
               this.#onAdded.trigger({ model, updatedGridStart: true, updatedGridEnd: false });
            } else if (last === null || model.index > last.index) {
               this.#models.push(model);
               this.#modelsByIndex.set(model.index, model);
               this.#onAdded.trigger({ model, updatedGridStart: false, updatedGridEnd: true });
            } else {
               throw new ArgumentError("The specified model can neither be appended nor prepended due to its index " +
                  "being invalid in the given context.");
            }
         } else {
            throw new ArgumentError("The specified model index is already taken.");
         }
      } else {
         throw new ArgumentError("The specified model already exists within the column.");
      }
   }

   trimStart() {
      if (this.#models.length > 0) {
         let model = this.#models.splice(0, 1)[0];
         this.#modelsByIndex.delete(model.index);
         this.#onTrimmed.trigger({ model, updatedGridStart: true, updatedGridEnd: false });
      }
   }

   trimEnd() {
      if (this.#models.length > 0) {
         let model = this.#models.splice(this.#models.length - 1, 1)[0];
         this.#modelsByIndex.delete(model.index);
         this.#onTrimmed.trigger({ model, updatedGridStart: false, updatedGridEnd: true });
      }
   }

   clear() {
      if (this.#models.length > 0) {
         this.#models = [];
         this.#modelsByIndex.clear();
         this.#onCleared.trigger();
      }
   }

   *#getIndicesSorted() {
      for (let i = 0; i < this.#models.length; i++) {
         yield this.#models[i].index;
      }
   }
}