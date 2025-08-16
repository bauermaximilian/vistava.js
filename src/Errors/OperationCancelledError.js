// SPDX-License-Identifier: GPL-3.0-or-later

export class OperationCancelledError extends Error {
   /**
    * @param {string} [message]
    */   
   constructor(message) {
      super(message ?? "The operation was cancelled.");
   }
}