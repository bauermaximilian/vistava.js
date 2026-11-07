// SPDX-License-Identifier: GPL-3.0-or-later

export class ExtensionError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "An error occurred in an extension.");
   }
}