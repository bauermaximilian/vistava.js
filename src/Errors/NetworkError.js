// SPDX-License-Identifier: GPL-3.0-or-later

export class NetworkError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "The operation failed due to a network error.");
   }
}