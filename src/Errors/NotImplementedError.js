// SPDX-License-Identifier: GPL-3.0-or-later

import { ImplementationError } from "./ImplementationError.js";

export class NotImplementedError extends ImplementationError {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The operation is not implemented.");
   }
}