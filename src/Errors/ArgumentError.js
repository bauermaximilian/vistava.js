// SPDX-License-Identifier: GPL-3.0-or-later

export class ArgumentError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The provided arguments were invalid.");
   }
}