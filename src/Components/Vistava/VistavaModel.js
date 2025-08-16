// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { CachedCollection } from "../../Shared/CachedCollection.js";
import { ArgumentError } from "../../Errors/ArgumentError.js";
import { ImplementationError } from "../../Errors/ImplementationError.js";
import { EventController } from "../../Shared/Event.js";
import { TileModel } from "../TileGrid/Tile/TileModel.js";
import { TileGridModel } from "../TileGrid/TileGridModel.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";

export class VistavaModel {
   get query() { return this.#query; }
   set query(value) {
      Assert.string(value);
      if (value !== this.#query) {
         this.#query = value;
         this.#onQueryUpdated.trigger();
         this.#initializeCollection(true);
      }
   }

   get grid() { return this.#gridModel; }

   get onQueryUpdated() { return this.#onQueryUpdated.event; }

   /** @template T @typedef {import("../../Shared/CachedCollection.js").CollectionRetrieverConstructor<T>} CollectionRetrieverConstructor<T> */

   /** @type {EventController<void>} */
   #onQueryUpdated = new EventController();

   /** @readonly @type {CollectionRetrieverConstructor<object>} */
   #collectionFactory;
   /** @type {CachedCollection<object>} */
   #collection = new CachedCollection(() => { throw new InvalidOperationError("No collection was initialized"); });

   /** @readonly @type {TileGridModel} */
   #gridModel = new TileGridModel();
   /** @type {string} */
   #query = "";

   /**
    * 
    * @param {CollectionRetrieverConstructor<object>} collectionFactory
    * @param {TileGridModel} grid 
    */
   constructor(collectionFactory, grid) {
      Assert.function(collectionFactory, "collectionFactory");
      Assert.class(grid, TileGridModel, "model");

      this.#collectionFactory = collectionFactory;
      this.#gridModel = grid;
      
      this.#initializeCollection(false);
   }

   /**
    * @param {number} index 
    * @returns {Promise<boolean>}
    */
   async addAsync(index) {
      let targetModel = this.#gridModel;
      let currentCollection = this.#collection;
      let data = await currentCollection.getAsync(index);
      // If the current collection changed while retrieving the tile data (e.g. query change),
      // do not add the tile from the old source to the model with the new source and just return false.
      if (data !== null && currentCollection === this.#collection) {
         targetModel.add(new TileModel(index, data));
         if (targetModel !== this.#gridModel) {
            throw new ImplementationError("It has happened...");
         }
         return true;
      } else {
         return false;
      }
   }

   /**
    * @param {number} index 
    */
   remove(index) {
      if (index === this.#gridModel.last?.index) {
         this.#gridModel.trimEnd();
      } else if (index === this.#gridModel.first?.index) {
         this.#gridModel.trimStart();
      } else {
         throw new ArgumentError("The tile with the specified index can't be removed.");
      }
   }

   /**
    * @param {boolean} clearGrid 
    */
   #initializeCollection(clearGrid) {
      let collectionRetriever = this.#collectionFactory(this.#query);
      this.#collection = new CachedCollection(collectionRetriever);
      if (clearGrid) {
         this.#gridModel.clear();
      }
   }
}