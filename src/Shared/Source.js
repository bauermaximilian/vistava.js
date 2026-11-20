// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../Errors/AbstractMemberNotImplementedError.js";

/** 
 * @template [TConfig = SourceConfiguration]
 * @typedef {(configuration:TConfig)=>Source} SourceConstructor 
 */

/**
 * Defines a simple configuration object with properties that are used to control the behaviour
 * of the source instance.
 * @typedef {{name:string|undefined}} SourceConfiguration
 */

/**
 * Provides the base class from which all content sources for the application are derived from.
 * Also see {@link SourceSegmented} for a derived abstract class with functionality for pagination.
 * @abstract Must override the {@link createCollectionRetriever} method. May override the 
 * {@link name} property getter.
 * @template {SourceConfiguration} TConfig
 */
export class Source {
   /** 
    * @template T
    * @typedef {import("./CachedCollection.js").CollectionRetriever<T>} CollectionRetriever<T>
    */

   /** @type {TConfig?} */
   #configuration = null;

   /** 
    * Gets the name of the current instance.
    * By default, this is either the value of {@link SourceConfiguration.name} or the class name.
    * @type {string} 
    */
   get name() {
      let name = this.#configuration?.name?.toString().trim();
      if (name == null || name.length === 0) {
         name = this.constructor.name;
      }
      return name;
   }

   /** 
    * Gets the configuration of the current instance, which was provided during instantiation,
    * or null if no valid object was provided.
    */
   get configuration() { return this.#configuration; }

   /**
    * @param {TConfig} configuration Defines the configuration object for the source, which will be 
    * made accessible over the {@link configuration} getter (if the value is not undefined, not null 
    * and of type "object").
    */
   constructor(configuration) {
      if (configuration != null && typeof (configuration) === "object") {
         this.#configuration = configuration;
      }
   }

   /** 
    * Creates a new {@link CollectionRetriever} instance for a specific {@link query}.
    * Must be overridden.
    * @param {string} query 
    * @returns {CollectionRetriever<object>}
    * @abstract
    */
   createCollectionRetriever(query) {
      throw new AbstractMemberNotImplementedError();
   }

   /**
    * An utility method that creates a new {@link CollectionRetriever<object>} from an array.
    * @template T
    * @param {T[]} sourceArray 
    * @returns CollectionRetriever<T>
    */
   static createArrayCollectionRetriever(sourceArray) {
      return (/** @type {number} */ offset, /** @type {number} */ count) => {
         let target = [];
         for (let i = 0; i < count; i++) {
            let iSource = offset + i;
            if (iSource < sourceArray.length && iSource >= 0) {
               target.push(sourceArray[iSource]);
            } else {
               break;
            }
         }
         return Promise.resolve(target);
      }
   }
}