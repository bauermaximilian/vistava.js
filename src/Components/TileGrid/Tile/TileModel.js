// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";

export class TileModel {
   get index() { return this.#index; }

   /** @typedef {import("./TileDataField.js").TileDataFieldKey} TileDataFieldKey */
   /** @type {number} */
   #index;
   /** @type {Object.<TileDataFieldKey|string,any>} */
   #data;
   
   /**
    * @param {number} index A number equal to or greater than 0.
    * @param {object} data The properties of the tile.
    * @throws {ArgumentError}
    */
   constructor(index, data) {
      Assert.numberPositiveOrZero(index, "index");
      Assert.defined(data, "data");
      
      this.#index = index;
      this.#data = data;
   }

   /**
    * @overload
    * Gets a specific model data entry.
    * @param {TileDataFieldKey} key The key of the data entry.
    * @returns {any} The requested data entry.
    */
   /**
    * @overload
    * Gets a specific model data entry.
    * @param {string} key The key of the data entry.
    * @returns {any} The requested data entry.
    */
   getData(/** @type {string|TileDataFieldKey} */ key) {
      return this.#data[key] ?? null;
   }

   /**
    * @overload
    * Gets a specific model data entry as {@link string}.
    * @param {TileDataFieldKey} key The key of the data entry.
    * @param {boolean} [allowEmptyOrWhitespacesOnly=false] true to allow and return strings that are empty or 
    * whitespaces only, false (default) to return null in such cases.
    * @returns {string?} The requested data entry as {@link string}, or null if the requested entry
    * was not defined, not a string (no implicit type conversion), or - unless {@link allowEmptyOrWhitespacesOnly} was 
    * set to true - an empty or whitespace-only string.
    */
   /**
    * @overload
    * Gets a specific model data entry as {@link string}.
    * @param {string} key The key of the data entry.
    * @param {boolean} [allowEmptyOrWhitespacesOnly=false] true to allow and return strings that are empty or 
    * whitespaces only, false (default) to return null in such cases.
    * @returns {string?} The requested data entry as {@link string}, or null if the requested entry
    * was not defined, not a string (no implicit type conversion), or - unless {@link allowEmptyOrWhitespacesOnly} was 
    * set to true - an empty or whitespace-only string.
    */
   getDataAsString(/** @type {string|TileDataFieldKey} */ key, allowEmptyOrWhitespacesOnly = false) {
      let value = this.getData(key);
      if (typeof (value) === "string") {
         let valueTrimmedLength = value.trim().length;
         if ((valueTrimmedLength === 0 && allowEmptyOrWhitespacesOnly) || valueTrimmedLength > 0) {
            return value;
         }
      }
      return null;
   }

   /**
    * @overload
    * Gets a specific model data entry as {@link number}.
    * @param {TileDataFieldKey} key The key of the data entry.
    * @returns {number?} The requested data entry as {@link number}, or null if the requested entry
    * was not defined or not a (finite) number (no implicit type conversion).
    */
   /**
    * @overload
    * Gets a specific model data entry as {@link number}.
    * @param {string} key The key of the data entry.
    * @returns {number?} The requested data entry as {@link number}, or null if the requested entry
    * was not defined or not a (finite) number (no implicit type conversion).
    */
   getDataAsNumber(/** @type {string|TileDataFieldKey} */ key) {
      let value = this.getData(key);
      if (typeof (value) === "number" && isFinite(value)) {
         return value;
      }
      return null;
   }
}