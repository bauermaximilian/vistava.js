// SPDX-License-Identifier: GPL-3.0-or-later

export class InvalidOperationError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The operation is invalid in the current context.");
   }
}