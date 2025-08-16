// SPDX-License-Identifier: GPL-3.0-or-later

import { InvalidOperationError } from "./InvalidOperationError.js";

export class ObjectDisposedError extends InvalidOperationError {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The object was disposed and can no longer be used.");
   }
}