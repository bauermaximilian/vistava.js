// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { OperationCancelledError } from "../Errors/OperationCancelledError.js";

export class RateLimiter {
   /** @type {number} */
   #delayMs;
   /** @type {number?} */
   #queueCapacity;
   /** @type {number?} */
   #lastCallbackTimestamp = null;
   /** @type {number?} */
   #lastProcessingHandle = null;
   /** @type {QueuedCallback<any>[]} */
   #callbackQueue = [];

   /**
    * 
    * @param {number} delayMs 
    * @param {number?} [queueCapacity=null] 
    */
   constructor(delayMs, queueCapacity = null) {
      Assert.numberPositive(delayMs, "delayMs");
      Assert.ifDefined(queueCapacity, () => Assert.numberIntegerPositive(queueCapacity, "queueCapacity"));
      this.#delayMs = delayMs;
      this.#queueCapacity = queueCapacity ?? null;
   }

   /**
    * @template [T=void]
    * @param {()=>T} callback 
    * @returns {Promise<T>}
    */
   async executeThrottledAsync(callback) {
      let queuedCallback = new QueuedCallback(callback);
      this.#unclogQueue();
      this.#callbackQueue.push(queuedCallback);
      this.#processQueue();
      return await queuedCallback.promise;
   }

   /**
    * @template [T=void]
    * @param {()=>T} callback 
    * @param {(result:(T|PromiseLike<T>))=>void} [onResolve]
    * @param {(reason:any?)=>void} [onReject]
    */
   executeThrottled(callback, onResolve, onReject) {
      let promise = this.executeThrottledAsync(callback);
      promise.then(result => onResolve?.(result)).catch(reason => onReject?.(reason));
   }

   #unclogQueue() {
      while (this.#queueCapacity !== null && this.#callbackQueue.length > (this.#queueCapacity - 1)) {
         this.#callbackQueue.pop()?.cancel();
      }
   }

   #processQueue() {
      let timeSinceLastExecution = this.#lastCallbackTimestamp !== null ?
         (performance.now() - this.#lastCallbackTimestamp) : (this.#delayMs + 1);
      if (timeSinceLastExecution > this.#delayMs) {
         this.#lastProcessingHandle = null;
         this.#lastCallbackTimestamp = performance.now();
         let queueItem = this.#callbackQueue.shift();
         if (queueItem != null) {
            queueItem.startExecution();
            queueItem.promise.then(this.#tryProcessQueue);
         }
      } else if (this.#lastProcessingHandle === null) {
         setTimeout(this.#tryProcessQueue,
            Math.max(0, 1 + (this.#delayMs - timeSinceLastExecution)));
      }
   }

   #tryProcessQueue = () => this.#processQueue();
}

/**
 * @template [T=void]
 */
class QueuedCallback {
   get promise() { return this.#promise; }

   /** @type {Promise<T>} */
   #promise;
   /** @type {(value:T|PromiseLike<T>)=>void} */
   #promiseResolver = () => {};
   /** @type {(reason:any?)=>void} */
   #promiseRejector = () => {};
   /** @type {()=>(T|PromiseLike<T>)} */
   #callback;
   /** @type {boolean} */
   #promiseFinished = false;
   /** @type {number?} */
   #executionHandle = null;

   /**
    * @param {()=>T} callback 
    */
   constructor(callback) {
      this.#promise = new Promise((resolver, rejector) => {
         this.#promiseResolver = resolver;
         this.#promiseRejector = rejector;
      });
      this.#callback = callback;
   }

   cancel() {
      if (this.#executionHandle !== null) {
         clearTimeout(this.#executionHandle);
      }
      this.#reject(new OperationCancelledError());
   }

   startExecution() {
      this.#executionHandle = setTimeout(() => {
         this.#executionHandle = null;
         try {
            let result = this.#callback();
            if (result instanceof Promise) {
               result.then(result => this.#resolve(result),
                  error => this.#reject(error));
            } else {
               this.#resolve(result);
            }
         } catch (error) {
            this.#reject(error);
         }
      }, 0);
   }

   /**
    * @param {any|null} reason 
    */
   #reject(reason) {
      if (!this.#promiseFinished) {
         this.#promiseFinished = true;
         this.#promiseRejector(reason);
      }
   }

   /**
    * @param {T | PromiseLike<T>} result 
    */
   #resolve(result) {
      if (!this.#promiseFinished) {
         this.#promiseFinished = true;
         this.#promiseResolver(result);
      }
   }
}