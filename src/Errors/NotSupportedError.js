// SPDX-License-Identifier: GPL-3.0-or-later

export class NotSupportedError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The operation is not supported.");
   }
}