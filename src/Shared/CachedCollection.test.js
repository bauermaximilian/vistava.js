// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { CachedCollection } from "./CachedCollection.js";
import { InvalidOperationError } from "../Errors/InvalidOperationError.js";

export class CachedCollectionTests {
   #collectionLength = 50;

   constructor_testCollectionRetriever_executesProperly() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      Assert.defined(collection);
      Assert.equals(null, collection.length);
   }

   async getAsync_incrementingIndexInsideCollectionRange_returnsValidValues() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      for (let index = 0; index < this.#collectionLength; index++) {
         let expectedValue = this.#buildCollectionValue(query, index);
         let actualValue = await collection.getAsync(index);
         Assert.equals(expectedValue, actualValue);
      }

      Assert.equals(50, collection.length);
   }

   async getAsync_incrementingIndexInsideHalfCollectionRange_returnsValidValues() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      for (let index = 0; index < this.#collectionLength / 2; index++) {
         let expectedValue = this.#buildCollectionValue(query, index);
         let actualValue = await collection.getAsync(index);
         Assert.equals(expectedValue, actualValue);
      }

      // As the collection wasn't "fully" requested (only the first chunk), the collection length is unknown.
      Assert.equals(null, collection.length);
   }

   async getAsync_decrementingIndexInsideCollectionRange_returnsValidValues() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      for (let index = this.#collectionLength - 1; index >= 0; index--) {
         let expectedValue = this.#buildCollectionValue(query, index);
         let actualValue = await collection.getAsync(index);
         Assert.equals(expectedValue, actualValue);
      }

      Assert.equals(50, collection.length);
   }

   async getAsync_randomInsideCollectionRange_returnsValidValues() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));
      // Randomly sorted array of all indices between 0-49.
      let indices = Array.from({ length: 50 }, (value, index) => index)
         .map(value => ({ value, sort: Math.random() }))
         .sort((a, b) => a.sort - b.sort)
         .map(({ value }) => value);

      for (let index of indices) {
         let expectedValue = this.#buildCollectionValue(query, index);
         let actualValue = await collection.getAsync(index);
         Assert.equals(expectedValue, actualValue);
      }

      Assert.equals(50, collection.length);
   }

   async getAsync_incrementingIndexInsideCollectionRangeRequestParallel_returnsValidValues() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      let expectedValues = [];
      let promises = [];
      for (let index = 0; index < this.#collectionLength; index++) {
         expectedValues[index] = this.#buildCollectionValue(query, index);
         promises[index] = collection.getAsync(index);
      }
      
      await Promise.all(promises);

      for (let i = 0; i < expectedValues.length; i++) {
         let expectedValue = expectedValues[i];
         let actualValue = await promises[i];
         Assert.equals(expectedValue, actualValue);
      }

      Assert.equals(50, collection.length);
   }

   async getAsync_outOfRangeOrInvalidIndices_returnsNull() {
      let query = "test";
      let collection = new CachedCollection(this.#createCollectionRetriever(query));

      Assert.equals(null, await collection.getAsync(-1));
      Assert.equals(null, await collection.getAsync(51));
      Assert.equals(null, await collection.getAsync(42.2));
      Assert.equals(null, await collection.getAsync(NaN));
      Assert.equals(null, await collection.getAsync(1/0));
   }

   /**
    * @param {string} query 
    * @returns {import("./CachedCollection.js").CollectionRetriever<string>}
    */
   #createCollectionRetriever(query) {
      let requestedOffsets = new Set();
      return async (/** @type {number} */ offset, /** @type {number} */ count) => {
         if (!requestedOffsets.has(offset)) {
            requestedOffsets.add(offset);
         } else {
            throw new InvalidOperationError("The same offset was already requested before.");
         }

         let data = [];
         for (let i = 0; i < count; i++) {
            let index = offset + i;
            if (index < this.#collectionLength) {
               data[i] = this.#buildCollectionValue(query ?? "NULL", index);
            }
         }
         console.log(`${Math.round(performance.now())}: Requested ${count} items from #${offset}.`);
         return data;
      };
   }

   /**
    * @param {string} query 
    * @param {number} index 
    * @returns {string}
    */
   #buildCollectionValue(query, index) {
      return `${query} #${index}`;
   }
}
