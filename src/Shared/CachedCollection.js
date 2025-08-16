// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { AsyncLock } from "../Utils/AsyncUtils.js";

/**
 * @template T
 * @typedef {(offset:number, count:number) => Promise<T[]>} CollectionRetriever
 */

/**
 * @template T
 * @typedef {(query:string) => CollectionRetriever<T>} CollectionRetrieverConstructor
 */

/** 
 * @template T 
 */
export class CachedCollection {
   get length() { return this.#collectionLength; }

   /** @type {number} */
   #updateChunkSize;
   /** @type {(T|undefined)[]} */
   #cache = [];
   /** @type {number?} */
   #collectionLength = null; 
   /** @type {number?} */
   #definedCacheIndexMinimum = null;
   /** @type {number?} */
   #definedCacheIndexMaximum = null;
   /** @type {AsyncLock} */
   #cacheLock = new AsyncLock();
   /** @type {CollectionRetriever<T>} */
   #collectionRetriever;

   /**
    * @param {CollectionRetriever<T>} collectionRetriever 
    * @param {number} [updateChunkSize=10]
    * @throws {ArgumentError}
    */
   constructor(collectionRetriever, updateChunkSize = 10) {
      Assert.function(collectionRetriever, "collectionRetriever");
      Assert.numberPositiveOrZero(updateChunkSize, "updateChunkSize");

      this.#collectionRetriever = collectionRetriever;
      this.#updateChunkSize = updateChunkSize;
   }

   /**
    * @param {number} index 
    * @returns {Promise<T?>}
    */
   async getAsync(index) {
      if ((this.#collectionLength === null || index < this.#collectionLength) && index >= 0) {
         let item = null;
         await this.#cacheLock.lockAsync(async () => {
            if (await this.#ensureItemCachedAsync(index)) {
               item = this.#cache[index] ?? null;
            } else {
               item = null;
            }
         });
         return item;
      }
      return null;
   }

   /**
    * @param {number} index 
    * @returns {Promise<boolean>}
    */
   async #ensureItemCachedAsync(index) {
      // If the total length of the collection is known and the index exceeds that (or the index is negative or
      // otherwise no valid index number), return false immediately.
      if (typeof (index) !== "number" || (this.#collectionLength !== null && index > this.#collectionLength) ||
         index < 0 || !isFinite(index) || Math.floor(index) !== index) {
         return false;
      }

      // If the index is within the already cached item range, return true immediately.
      if (this.#definedCacheIndexMinimum !== null && this.#definedCacheIndexMaximum !== null &&
         index >= this.#definedCacheIndexMinimum && index <= this.#definedCacheIndexMaximum) {
         return true;
      }

      let chunkStartIndex = Math.floor(index / this.#updateChunkSize) * this.#updateChunkSize;
      let chunkItems = await this.#collectionRetriever(chunkStartIndex, this.#updateChunkSize);
      let chunkItemsCount = 0;
      Assert.array(chunkItems, `collectionRetriever(${chunkStartIndex}, ${this.#updateChunkSize})`);

      // Copy the retrieved chunk items into the cache and "break" if there's any undefined/null items.
      for (let i = 0; i < chunkItems.length; i++) {
         let cacheIndex = chunkStartIndex + i;
         let chunkItem = chunkItems[i]; 
         if (chunkItem == null) {
            break;
         }
         
         this.#cache[cacheIndex] = chunkItem;

         this.#definedCacheIndexMinimum = this.#definedCacheIndexMinimum !== null ?
            Math.min(cacheIndex, this.#definedCacheIndexMinimum) : cacheIndex;
         this.#definedCacheIndexMaximum = this.#definedCacheIndexMaximum !== null ?
            Math.max(cacheIndex, this.#definedCacheIndexMaximum) : cacheIndex;
         chunkItemsCount++;
      }

      if (chunkItemsCount !== this.#updateChunkSize) {
         this.#collectionLength = this.#definedCacheIndexMaximum !== null ? (this.#definedCacheIndexMaximum + 1) : 0;
      }

      // If the index is within the cached item range now, return true - otherwise, the index exceeded the collection
      // length (or something else with the collection retriever was wrong) and false should be returned.
      return (this.#definedCacheIndexMinimum !== null && this.#definedCacheIndexMaximum !== null &&
         index >= this.#definedCacheIndexMinimum && index <= this.#definedCacheIndexMaximum);
   }
}