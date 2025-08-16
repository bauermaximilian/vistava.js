// SPDX-License-Identifier: GPL-3.0-or-later

import { ObjectDisposedError } from "../Errors/ObjectDisposedError.js";

/**
 * @typedef {object} IDisposable
 * @property {boolean} isDisposed
 * @property {()=>void} dispose
 */

/**
 * @implements {IDisposable} 
 * @virtual Should override {@link dispose} (while calling {@link super.dispose}).
 */
export class Disposable {
   get isDisposed() { return this.#isDisposed; }

   /** @type {boolean} */
   #isDisposed = false;

   /**
    * @returns {boolean} false if the object was already disposed before and no changes were made,
    * true if the object wasn't disposed before and was now disposed.
    */
   dispose() {
      if (!this.#isDisposed) {
         this.#isDisposed = true;
         return true;
      } else {
         return false;
      }
   }

   /**
    * @virtual
    * @throws {ObjectDisposedError}
    * @protected
    */
   throwIfDisposed() {
      if (this.#isDisposed) {
         throw new ObjectDisposedError();
      }
   }
}