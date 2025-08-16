// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";

/**
 * @typedef {{ 
 *    pathnameUpdated: boolean, 
 *    searchParamsUpdated: boolean, 
 *    externalOrigin:boolean 
 * }} HashRouterUpdatedEventArgs
 */

export class HashRouter {
   /** @readonly @type {string} */
   static #hashPrefix = "#/"

   /** @type {string} */
   #pathname = "";   
   /** @type {HashURLSearchParams} */
   #searchParams = new HashURLSearchParams();
   /** @type {boolean} */
   #autoUpdateWindowHash = true;
   /** @type {boolean} */
   #ignoreHashChanges = false;
   /** @type {boolean} */
   #ignoreSearchParamsChanges = false;
   /** @type {boolean} */
   #disableHistoryChanges = false;

   /** @type {EventController<HashRouterUpdatedEventArgs>} */
   #onUpdated = new EventController();

   get onUpdated() { return this.#onUpdated.event; }

   get pathname() { return this.#pathname; }

   set pathname(value) { 
      if (this.#pathname !== value) {
         Assert.string(value);
         this.#pathname = value;
         this.#considerUpdatingWindowHash();
         this.#onUpdated.trigger({ 
            pathnameUpdated: true,
            searchParamsUpdated: false,
            externalOrigin: false 
         });
      }
   }

   /** @type {URLSearchParams} */
   get searchParams() {
      return this.#searchParams;
   }

   get autoUpdateWindowHash() {
      return this.#autoUpdateWindowHash;
   }
   set autoUpdateWindowHash(value) {
      this.#autoUpdateWindowHash = value;
   }
   
   get disableHistoryChanges() {
      return this.#disableHistoryChanges;
   }
   set disableHistoryChanges(value) {
      this.#disableHistoryChanges = value;
   }

   constructor() {
   }

   attach() {
      window.addEventListener("hashchange", this.#handleOnHashChanged);
      this.#searchParams.onChange.subscribe(this.#handleOnSearchParamsChanged);

      // Covers the cases "first loaded page hash contains parameters to apply" and
      // "first broadcast of hash parameters to external subscribers".
      if (!this.#handleOnHashChanged()) {
         this.#onUpdated.trigger({
            externalOrigin: true,
            pathnameUpdated: true,
            searchParamsUpdated: true
         });
      }

      this.#considerUpdatingWindowHash();
   }

   detach() {
      window.removeEventListener("hashchange", this.#handleOnHashChanged);
      this.#searchParams.onChange.unsubscribe(this.#handleOnSearchParamsChanged);
   }

   /**
    * @param {boolean} [hideFromHistory]
    */
   updateWindowHash(hideFromHistory) {
      this.#ignoreHashChanges = true;

      let hash = 
         `${HashRouter.#hashPrefix}${encodeURI(this.#pathname)}?${this.#searchParams.toString()}`;

      if ((hideFromHistory ?? this.#disableHistoryChanges) &&
         window.location.hash.trim().length > 0) {
         location.replace(hash);
         //console.log(`Replaced window hash with ${hash}`);
      } else {
         location.assign(hash);
         //console.log(`Assigned window hash with ${hash}`);
      }

      this.#ignoreHashChanges = false;
   }

   #considerUpdatingWindowHash() {
      if (this.#autoUpdateWindowHash) {
         this.updateWindowHash();
      }
   }

   #handleOnSearchParamsChanged = () => {
      if (!this.#ignoreSearchParamsChanges) {
         this.#considerUpdatingWindowHash();
         this.#onUpdated.trigger({ 
            pathnameUpdated: false,
            searchParamsUpdated: true,
            externalOrigin: false 
         });
      }
   };

   #handleOnHashChanged = () => {
      let triggeredEvent = false;

      if (!this.#ignoreHashChanges) {
         this.#ignoreSearchParamsChanges = true;
         let pathnameUpdated = false;
         let searchParamsUpdated = false;

         let hashParts = HashRouter.parseHash(window.location.hash);

         if (hashParts !== null) {
            if (hashParts.pathname !== this.#pathname) {
               this.#pathname = hashParts.pathname;
               pathnameUpdated = true;
            }

            for (let searchParam of hashParts.searchParams) {
               if (this.#searchParams.get(searchParam[0]) !== searchParam[1]) {
                  this.#searchParams.set(searchParam[0], searchParam[1]);
                  searchParamsUpdated = true;
               }
            }

            let currentSearchParamNames = Array.from(this.#searchParams.keys());
            for (let searchParamName of currentSearchParamNames) {
               if (!hashParts.searchParams.has(searchParamName)) {
                  this.#searchParams.delete(searchParamName);
                  searchParamsUpdated = true;
               }
            }
         } else {
            if (this.#pathname.length !== 0) {
               this.#pathname = "";
               pathnameUpdated = true;
            }
            if (this.#searchParams.size > 0) {
               let currentSearchParamNames = Array.from(this.#searchParams.keys());
               for (let searchParamName of currentSearchParamNames) {
                  this.#searchParams.delete(searchParamName);
               }
            }
         }

         if (pathnameUpdated || searchParamsUpdated) {
            this.#onUpdated.trigger({ 
               pathnameUpdated: pathnameUpdated,
               searchParamsUpdated: searchParamsUpdated,
               externalOrigin: true 
            });
            triggeredEvent = true;
         }

         this.#ignoreSearchParamsChanges = false;
      }

      return triggeredEvent;
   };

   /**
    * @param {string|null|undefined} locationHash
    * @returns {{pathname:string, searchParams:URLSearchParams}?}
    */
   static parseHash(locationHash) {
      if (locationHash != null && locationHash.startsWith(HashRouter.#hashPrefix)) {
         let result = {
            /** @type {string} */
            pathname: "",
            /** @type {URLSearchParams} */
            searchParams: new URLSearchParams()
         };

         let hash = locationHash.substring(HashRouter.#hashPrefix.length);

         let searchParamsSeparatorIndex = hash.lastIndexOf("?");
         if (searchParamsSeparatorIndex >= 0) {
            result.pathname = decodeURI(hash.substring(0, searchParamsSeparatorIndex));
            let searchParamsString = hash.substring(searchParamsSeparatorIndex + 1);
            if (searchParamsString.length > 0) {
               result.searchParams = new URLSearchParams(searchParamsString);
            }
         } else {
            result.pathname = decodeURI(hash);
         }

         return result;
      } else {
         return null;
      }
   }
}

class HashURLSearchParams extends URLSearchParams {
   /** @type {EventController<void>} */
   #onChange = new EventController;

   get onChange() { return this.#onChange.event; }

   constructor() {
      super();
   }

   /**
    * @param {string} name 
    * @param {string} value 
    * @returns {void}
    */
   append(name, value) {
      super.append(name, value);
      this.#onChange.trigger();
   }

   /**
    * @param {string} name
    */
   delete(name) {
      if (super.has(name)) {
         super.delete(name);
         this.#onChange.trigger();
      }
   }

   /**
    * @param {string} name
    * @param {string} value
    */
   set(name, value) {
      if (this.get(name) !== value) {
         super.set(name, value);
         this.#onChange.trigger();
      }
   }

   sort() {
      super.sort();
      this.#onChange.trigger();
   }
}