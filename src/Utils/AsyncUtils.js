// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../Shared/Assert.js";

export class AsyncUtils {
   /**
    * @param {number} interval 
    * @returns {Promise<void>}
    */
   static async sleep(interval) {
      await new Promise(r => setTimeout(r, interval));
   }

   /**
    * @returns {AsyncLock}
    */
   static createAsyncLock() {
      return new AsyncLock();
   }
}

export class AsyncLock {
   /** @type {(()=>Promise<void>)[]} */
   #queuedCallbacks = [];
   /** @type {boolean} */
   #isLocked = false;

   /**
    * @param {()=>(void|Promise<void>)} callback 
    * @returns {Promise<void>}
    */
   lockAsync(callback) {
      Assert.function(callback, "callback");

      let deferredPromiseResolve, deferredPromiseReject;
      let deferredPromise = new Promise((resolve, reject) => {
         deferredPromiseResolve = resolve;
         deferredPromiseReject = reject;
      });

      let callbackExecution = async () => {
         let callbackPromise;
         try {
            callbackPromise = callback();
            if (callbackPromise instanceof Promise) {
               await callbackPromise.then(deferredPromiseResolve, deferredPromiseReject);
            } else {
               deferredPromiseResolve();
            }
         } catch(error) {
            deferredPromiseReject(error);
         }

         if (this.#queuedCallbacks.length > 0) {
            let nextCallbackExecution = this.#queuedCallbacks.shift();
            nextCallbackExecution?.();
         } else {
            this.#isLocked = false;
         }
      }

      if (this.#isLocked) {
         this.#queuedCallbacks.push(callbackExecution);
      } else {
         this.#isLocked = true;
         callbackExecution();
      }

      return deferredPromise;
   }
}