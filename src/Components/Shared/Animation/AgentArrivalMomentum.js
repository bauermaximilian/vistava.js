// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { AgentCollection } from "./AgentCollection.js";
import { AgentArrival } from "./AgentArrival.js";
import { Agent } from "./Agent.js";

export class AgentArrivalMomentum extends AgentArrival {
   /** @readonly @type {number} */
   #EPSILON = 0.1;

   /** @type {number?} */
   #startTimestamp = null;
   /** @type {number} */
   #offsetSinceStart = 0;

   /**
   * @typedef {import("./AgentArrival.js").AgentArrivalInitializer} AgentArrivalInitializer
   */

   get isCharging() { return this.#startTimestamp !== null; }

   /**
    * @param {AgentArrivalInitializer} [initializer]
    * @param {AgentCollection<Agent<number>>} [parentCollection]
    */   
   constructor(initializer, parentCollection) {
      super(initializer, parentCollection);
      this.resetCharge();
   }

   startCharging() {
      this.resetCharge();
      this.#startTimestamp = performance.now();
   }

   resetCharge() {
      this.#startTimestamp = null;
      this.#offsetSinceStart = 0;
   }

   /**
    * @param {number} offset 
    */
   addCharge(offset) {
      Assert.number(offset, "offset");
      this.#offsetSinceStart += offset;
   }

   /**
    * @param {number} speedFactor 
    * @param {boolean} peek
    * @returns {number}
    */
   releaseCharge(speedFactor, peek = false) {
      Assert.numberPositiveOrZero(speedFactor, "speedFactor");

      let offset = 0;
      if (this.#startTimestamp !== null && Math.abs(this.#offsetSinceStart) > this.#EPSILON) {
         let time = performance.now() - this.#startTimestamp;
         let speed = this.#offsetSinceStart / time;
         offset = speedFactor * speed;
      }

      if (!peek) {
         this.addToCurrentValue(offset);
         this.resetCharge();
      }

      return offset;
   }

   /**
    * @param {number} deltaTime 
    * @param {number} attenuationFactor 
    */
   attenuateCharge(deltaTime, attenuationFactor) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");
      Assert.numberPositiveOrZero(attenuationFactor, "attenuationFactor");
      this.#offsetSinceStart -= 
         this.#offsetSinceStart * Math.min(1, attenuationFactor * deltaTime);
   }
}