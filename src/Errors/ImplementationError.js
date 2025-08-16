// SPDX-License-Identifier: GPL-3.0-or-later

export class ImplementationError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "An unknown error occurred.");
   }
}