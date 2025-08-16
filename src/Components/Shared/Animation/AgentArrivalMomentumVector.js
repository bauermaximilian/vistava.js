// SPDX-License-Identifier: GPL-3.0-or-later

import { VU } from "../../../Utils/VectorUtils.js";
import { Assert } from "../../../Shared/Assert.js";
import { AgentArrivalVector } from "./AgentArrivalVector.js";
import { AgentCollection } from "./AgentCollection.js";
import { Agent } from "./Agent.js";

export class AgentArrivalMomentumVector extends AgentArrivalVector {
   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */

   /** @type {number?} */
   #startTimestamp = null;
   /** @type {Vector} */
   #offsetSinceStart = VU.new(0, 0);

   /**
    * @typedef {import("./AgentArrivalVector.js").AgentArrivalVectorInitializer
    * } AgentArrivalVectorInitializer
    */

   /**
    * @param {AgentArrivalVectorInitializer} [initializer]
    * @param {AgentCollection<Agent<Vector>>} [parentCollection]
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
      this.#offsetSinceStart = VU.new(0, 0);
   }

   /**
    * @param {Vector} offset 
    */
   addCharge(offset) {
      Assert.vector(offset, "offset");
      this.#offsetSinceStart = VU.add(this.#offsetSinceStart, offset);
   }

   /**
    * @param {number} speedFactor 
    * @param {number} [discardBelowTime=50] 
    * @param {number} [discardBelowDistance=10] 
    */
   releaseCharge(speedFactor, discardBelowTime = 50, discardBelowDistance = 10) {
      Assert.numberPositiveOrZero(speedFactor, "speedFactor");

      let offsetLength = VU.len(this.#offsetSinceStart);
      if (this.#startTimestamp !== null) {
         let time = performance.now() - this.#startTimestamp;
         if (offsetLength > discardBelowDistance && time > discardBelowTime) {
            let speed = offsetLength / time;
            let direction = VU.norm(this.#offsetSinceStart);
            let momentumOffset = VU.scale(direction, speed * speedFactor);
            this.addToCurrentValue(momentumOffset);
         }
      }
      this.resetCharge();
   }

   /**
    * @param {number} deltaTime 
    * @param {number} attenuationFactor 
    */
   attenuateCharge(deltaTime, attenuationFactor) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");
      Assert.numberPositiveOrZero(attenuationFactor, "attenuationFactor");
      this.#offsetSinceStart = VU.sub(this.#offsetSinceStart,
         VU.scale(this.#offsetSinceStart, Math.min(1, attenuationFactor * deltaTime)));
   }
}