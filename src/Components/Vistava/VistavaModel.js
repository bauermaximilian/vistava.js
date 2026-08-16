// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { CachedCollection } from "../../Shared/CachedCollection.js";
import { ArgumentError } from "../../Errors/ArgumentError.js";
import { EventController } from "../../Shared/Event.js";
import { TileModel } from "../TileGrid/Tile/TileModel.js";
import { TileGridModel } from "../TileGrid/TileGridModel.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { AsyncUtils } from "../../Utils/AsyncUtils.js";

export class VistavaModel {
   get query() { return this.#query; }
   set query(value) {
      Assert.string(value);
      if (value !== this.#query) {
         this.#query = value;
         this.#onQueryUpdated.trigger();
         this.reset(true);
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

   /** @type {string?} */
   #lastCollectionErrorMessage = null;

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
      
      this.reset(false);
   }

   /**
    * @param {number} index 
    * @returns {Promise<boolean>}
    */
   async addAsync(index) {
      let targetModel = this.#gridModel;
      let targetModelTileCount = this.#gridModel.count;
      let currentCollection = this.#collection;
      
      let data;
      try {
         data = await currentCollection.getAsync(index);
         this.#lastCollectionErrorMessage = null;
      } catch (error) {
         // If unexpected issues with the collection retriever are encountered, log the error only once
         // and force the caller to wait a bit to avoid rapid retries.
         let errorMessage = error?.toString() ?? "Unknown error";
         if (this.#lastCollectionErrorMessage !== errorMessage) {
            this.#lastCollectionErrorMessage = errorMessage;
            console.error(`The collection retriever failed unexpectedly: ${errorMessage}.\n` +
               "Subsequent identical errors will not be logged until a successful request.");
         }
         await AsyncUtils.sleep(1000);
         data = null;
      }

      // If the current collection changed while retrieving the tile data (e.g. query change),
      // do not add the tile from the old source to the model with the new source and just return false.
      if (data !== null && currentCollection === this.#collection) {
         // Do not add the retrieved model value if the grid was cleared or otherwise modified 
         // in the meantime to avoid undefined behaviour.
         if (targetModel !== this.#gridModel || this.#gridModel.count !== targetModelTileCount) {
            return false;
         }
         targetModel.add(new TileModel(index, data));
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
   reset(clearGrid) {
      let collectionRetriever = this.#collectionFactory(this.#query);
      this.#collection = new CachedCollection(collectionRetriever);
      if (clearGrid) {
         this.#gridModel.clear();
      }
   }
}