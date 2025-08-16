// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../../../Errors/AbstractMemberNotImplementedError.js";

/**
 * @abstract
 * @template {any} TValue
 */
export class Agent {
   /** @abstract @type {boolean} */
   get isIdle() { throw new AbstractMemberNotImplementedError(); }

   /** @abstract  @type {TValue} */
   get currentValue() { throw new AbstractMemberNotImplementedError(); }
   /** @abstract  @type {TValue} */
   set currentValue(value) { throw new AbstractMemberNotImplementedError(); }

   /** @abstract  @type {TValue} */
   get targetValue() { throw new AbstractMemberNotImplementedError(); }
   /** @abstract  @type {TValue} */
   set targetValue(value) { throw new AbstractMemberNotImplementedError(); }

   /** @abstract  @type {TValue} */
   get lastStep() { throw new AbstractMemberNotImplementedError(); }

   /**
    * @abstract
    * @param {number} deltaTime
    * @returns {TValue} The new value of {@link lastStep}.
    */
   update(deltaTime) {
      throw new AbstractMemberNotImplementedError();
   }
}