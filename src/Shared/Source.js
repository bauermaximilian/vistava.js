// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../Errors/AbstractMemberNotImplementedError.js";
import { Assert } from "./Assert.js";

/** 
 * @template [TConfig = SourceConfiguration]
 * @typedef {(configuration:TConfig)=>Source} SourceConstructor 
 */

/**
 * @typedef {object} SourceConfiguration
 * @property {string} identifier
 */

/**
 * @abstract Must override {@link createCollectionRetriever} and provide a constructor that matches
 * the signature of {@link SourceConstructor}.
 */
export class Source {
   get identifier() { return this.#identifier; }

   /** 
    * @template {object} TValue
    * @typedef {import("./CachedCollection.js").CollectionRetrieverConstructor<TValue>
    * } CollectionRetrieverConstructor<TValue>
    */

   /** @type {string} */
   #identifier;

   /**
    * @param {SourceConfiguration} configuration 
    */
   constructor(configuration) {
      Assert.stringNotEmptyOrWhitespacesOnly(configuration.identifier, "configuration.identifier");
      this.#identifier = configuration.identifier;
   }

   /** @abstract @type {CollectionRetrieverConstructor<object>} */
   createCollectionRetriever(query) {
      throw new AbstractMemberNotImplementedError();
   }
}