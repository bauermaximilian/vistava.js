// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../Errors/AbstractMemberNotImplementedError.js";

/** 
 * @template [TConfig = SourceConfiguration]
 * @typedef {(configuration:TConfig)=>Source} SourceConstructor 
 */

/**
 * Defines a simple configuration object with properties that are used to control the behaviour
 * of the source instance. For the base {@link Source} class, this is just an empty object.
 * @typedef {{}} SourceConfiguration
 */

/**
 * Provides the base class from which all content sources for the application are derived from.
 * Also see {@link SourceSegmented} for a derived abstract class with functionality for pagination.
 * @abstract Must override {@link createCollectionRetriever} and provide a constructor that matches
 * the signature of {@link SourceConstructor}.
 */
export class Source {
   /** 
    * @template {object} TValue
    * @typedef {import("./CachedCollection.js").CollectionRetrieverConstructor<TValue>
    * } CollectionRetrieverConstructor<TValue>
    */

   /** @virtual @type {string} */
   get name() { return this.constructor.name; }

   /**
    * @param {SourceConfiguration} configuration Defines the configuration for the source.
    * For the {@link Source} base class, this is just an empty object.
    */
   constructor(configuration) {
   }

   /** @abstract @type {CollectionRetrieverConstructor<object>} */
   createCollectionRetriever(query) {
      throw new AbstractMemberNotImplementedError();
   }
}