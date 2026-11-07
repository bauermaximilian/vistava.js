// SPDX-License-Identifier: GPL-3.0-or-later

export class NotFoundError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message ?? "A required resource wasn't found.");
   }
}