// SPDX-License-Identifier: GPL-3.0-or-later

import { TileGridLayoutType } from "../TileGrid/Shared/TileGridLayoutType.js";
import { TileGridLayoutTypes } from "../TileGrid/Shared/TileGridLayoutTypes.js";
import { VistavaLayoutType } from "./VistavaLayoutType.js";

export class VistavaLayoutTypes extends TileGridLayoutTypes {
   static get default() { return this.#default; }

   get defaultViewType() { return this.#defaultViewType; }

   /** @readonly @type {VistavaLayoutTypes} */
   static #default = new VistavaLayoutTypes([VistavaLayoutType.thumbnails,
      VistavaLayoutType.gallery]);
   
   /** @readonly @type {Map<string, VistavaLayoutType>} */
   #types = new Map();
   /** @readonly @type {VistavaLayoutType} */
   #defaultViewType;

   /**
    * @param  {VistavaLayoutType[]} types 
    */
   constructor(types) {
      super(VistavaLayoutTypes.#getLayoutTypes(types));
      for (let type of types) {
         this.#defaultViewType ??= type;
         this.#types.set(type.identifier, type);
      }
      this.#defaultViewType ??= VistavaLayoutTypes.default.defaultViewType;
   }

   /**
    * @param {string} identifier 
    * @returns {VistavaLayoutType?}
    */
   getViewType(identifier) {
      return this.#types.get(identifier) ?? null;
   }

   /**
    * @param {VistavaLayoutType[]} viewLayoutTypes 
    * @returns {TileGridLayoutType[]}
    */
   static #getLayoutTypes(viewLayoutTypes) {
      let layoutTypes = [];
      for (let viewLayoutType of viewLayoutTypes) {
         layoutTypes.push(viewLayoutType.layoutConfiguration);
      }
      return layoutTypes;
   }
}