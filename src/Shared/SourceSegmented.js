// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../Errors/AbstractMemberNotImplementedError.js";
import { Assert } from "./Assert.js";
import { Source } from "./Source.js";

/**
 * Provides an abstract base class for sources that provide content "page by page".
 * @abstract Must override the {@link createContentRetriever} method.
 */
export class SourceSegmented extends Source {
   /**
    * @template {object} TValue
    * @typedef {import("./CachedCollection.js").CollectionRetrieverConstructor<TValue>
    * } CollectionRetrieverConstructor<TValue>
    */

   /** @type {SourceCache?} */
   #currentCollection = null;
   
   /** @abstract @type {CollectionRetrieverConstructor<object>} */
   createCollectionRetriever(query) {
      Assert.string(query, "query");
      return async (offset, length) => {
         if (this.#currentCollection === null || this.#currentCollection?.query !== query) {
            let contentRetriever = this.createContentRetriever(query);
            this.#currentCollection = new SourceCache(contentRetriever);
         }
         return await this.#currentCollection.getSegmentAsync(offset, length);
      };
   }

   /**
    * @abstract
    * @protected
    * @param {string} query 
    * @returns {SourceSegmentedContentRetriever}
    */
   createContentRetriever(query) {
      throw new AbstractMemberNotImplementedError("createContentRetriever");
   }
}

/**
 * @abstract Must implement the {@link getPageTilesAsync} method and the {@link pageLength} getter.
 */
export class SourceSegmentedContentRetriever {
   get query() { return this.#query; }
   /** @abstract @type {number} */
   get pageLength() { throw new AbstractMemberNotImplementedError("pageLength"); }

   /** @type {string} */
   #query;

   constructor(query) {
      Assert.string(query, "query");
      this.#query = query;
   }

   /**
    * @abstract
    * @param {number?} [page]
    * @returns {Promise<object[]>}
    */
   async getPageTilesAsync(page) {
      throw new AbstractMemberNotImplementedError("getPageTilesAsync");
   }
}

class SourceCache {
   get query() { return this.#contentRetriever.query; }

   /** @type {SourceSegmentedContentRetriever} */
   #contentRetriever;
   /** @type {object[]} */
   #entries = [];
   /** @type {number?} */
   #entriesStart = null;
   /** @type {number?} */
   #entriesLimit = null;

   /**
    * @param {SourceSegmentedContentRetriever} contentRetriever 
    */
   constructor(contentRetriever) {
      Assert.class(contentRetriever, SourceSegmentedContentRetriever, "contentRetriever");
      this.#contentRetriever = contentRetriever;
   }

   /**
    * @param {number} offset 
    * @param {number} length 
    * @returns {Promise<object[]>}
    */
   async getSegmentAsync(offset, length) {
      await this.#ensureSegmentCached(offset, length);
      
      if (this.#entries !== null) {
         return this.#entries.slice(Math.max(0, offset),
            Math.max(0, Math.min(offset + length, this.#entries.length)));
      } else {
         return [];
      }
   }

   /**
    * @param {number} offset 
    * @param {number} length 
    * @returns {Promise} 
    */
   async #ensureSegmentCached(offset, length) {
      if (this.#entriesLimit !== null && offset > this.#entriesLimit) {
         return;
      }

      let startPage = Math.floor(offset / this.#contentRetriever.pageLength);
      let endPage = Math.floor((offset + length) / this.#contentRetriever.pageLength);
         
      for (let page = startPage; page <= endPage; page++) {
         let pageStartIndex = page * this.#contentRetriever.pageLength;
         let pageEndIndex = (pageStartIndex + this.#contentRetriever.pageLength - 1);
         if ((pageEndIndex < this.#entries.length) &&
            (this.#entriesStart !== null && pageStartIndex > this.#entriesStart)) {
            continue;
         }

         try {
            let cacheTargetOffset = page * this.#contentRetriever.pageLength;
            let pageEntries = await this.#contentRetriever.getPageTilesAsync(page);
            for (let i = 0; i < pageEntries.length; i++) {
               let iTarget = cacheTargetOffset + i;
               let postValue = pageEntries[i];
               this.#entries[iTarget] = postValue;
               this.#entriesStart = Math.min(this.#entriesStart ?? iTarget, iTarget);
            }
            if (pageEntries.length !== this.#contentRetriever.pageLength) {
               this.#entriesLimit = this.#entries.length;
               break;
            }
         } catch (error) {
            console.error(`Failed caching segment #${offset}+${length}: ${error}.`);
            break;
         }
      }
   }
}