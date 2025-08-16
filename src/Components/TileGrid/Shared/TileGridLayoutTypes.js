// SPDX-License-Identifier: GPL-3.0-or-later

import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { TileGridLayoutType } from "./TileGridLayoutType.js";

export class TileGridLayoutTypes {
   static get default() { return this.#default; }
   
   get identifiers() { return this.#identifiers; }
   get defaultLayoutType() { return this.#defaultLayout; }

   /** @readonly @type {TileGridLayoutTypes} */
   static #default = new TileGridLayoutTypes([TileGridLayoutType.thumbnails,
      TileGridLayoutType.gallery]);
   /** @readonly @type {Map<string,TileGridLayoutType>} */
   #types = new Map();
   /** @readonly @type {readonly string[]} */
   #identifiers = [];
   /** @readonly @type {TileGridLayoutType} */
   #defaultLayout;

   /**
    * @param {TileGridLayoutType[]} types 
    */
   constructor(types) {
      for (let layoutType of types) {
         this.#defaultLayout ??= layoutType;
         if (this.#types.has(layoutType.identifier)) {
            throw new ArgumentError(`More than one item with the identifier ${layoutType.identifier} was specified.`);
         }
         this.#types.set(layoutType.identifier, layoutType);
      }
      this.#defaultLayout ??= TileGridLayoutTypes.default.defaultLayoutType;
      if (this.#types.size === 0) {
         throw new ArgumentError("No items were specified.");
      }
      this.#identifiers = Object.freeze(Array.from(this.#types.keys()));
   }

   /**
    * @param {string} identifier 
    * @returns {TileGridLayoutType?}
    */
   getLayoutType(identifier) {
      return this.#types.get(identifier) ?? null;
   }

   /**
    * @param {string} identifier 
    * @returns {boolean}
    */
   has(identifier) {
      return this.#types.has(identifier);
   }
}