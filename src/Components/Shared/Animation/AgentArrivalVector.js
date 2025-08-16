// SPDX-License-Identifier: GPL-3.0-or-later

import { VectorUtils as V } from "../../../Utils/VectorUtils.js";
import { Assert } from "../../../Shared/Assert.js";
import { AgentArrival } from "./AgentArrival.js";
import { Agent } from "./Agent.js";
import { AgentCollection } from "./AgentCollection.js";

/**
 * @typedef {Object} AgentArrivalVectorInitializer
 * @property {Vector} [currentValue]
 * @property {Vector} [targetValue]
 * @property {number} [friction]
 * @property {number} [speed]
 * @property {number} [maximumVelocity]
 * @property {boolean} [passthrough]
 */

/**
 * @extends {Agent<Vector>}
 */
export class AgentArrivalVector extends Agent {
   /** @type {AgentArrival} */
   #agentX = new AgentArrival();
   /** @type {AgentArrival} */
   #agentY = new AgentArrival();
   /** @type {boolean} */
   #isIdle = true;
   /** @type {Vector} */
   #lastStep = V.new(0, 0);
   /** @type {AgentCollection<Agent<Vector>>?} */
   #parentCollection = null;

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */

   get #referenceAgent() { return this.#agentX; }

   /** @override */
   get isIdle() { return this.#isIdle; }

   /** @override */
   get currentValue() { 
      return V.new(this.#agentX.currentValue, this.#agentY.currentValue);
   }
   /** @override */
   set currentValue(value) {
      Assert.vector(value);
      this.#agentX.currentValue = value.x;
      this.#agentY.currentValue = value.y;
   }

   /** @override */
   get targetValue() { 
      return V.new(this.#agentX.targetValue, this.#agentY.targetValue);
   }
   /** @override */
   set targetValue(value) {
      Assert.vector(value);
      this.#agentX.targetValue = value.x;
      this.#agentY.targetValue = value.y;
   }

   get friction() { return this.#referenceAgent.friction; }
   set friction(value) {
      Assert.numberPositiveOrZero(value);
      this.#agentX.friction = this.#agentY.friction = value;
   }

   get speed() { return this.#referenceAgent.speed; }
   set speed(value) {
      Assert.numberPositiveOrZero(value);
      this.#agentX.speed = this.#agentY.speed = value;
   }

   get maximumVelocity() { return this.#referenceAgent.maximumVelocity; }
   set maximumVelocity(value) {
      Assert.numberPositiveOrZero(value);
      this.#agentX.maximumVelocity = this.#agentY.maximumVelocity = value;
   }

   get passthrough() { return this.#referenceAgent.passthrough; }
   set passthrough(value) {
      this.#agentX.passthrough = this.#agentY.passthrough = !!value;
   }

   /** @override @type {Vector} */
   get lastStep() { return this.#lastStep; }

   /**
    * @param {AgentArrivalVectorInitializer} [initializer]
    * @param {AgentCollection<Agent<Vector>>} [parentCollection]
    */
   constructor(initializer, parentCollection) {
      super(); 

      this.currentValue = initializer?.currentValue ?? this.currentValue;
      this.targetValue = initializer?.targetValue ?? this.targetValue;
      this.friction = initializer?.friction ?? this.friction;
      this.speed = initializer?.speed ?? this.speed;
      this.maximumVelocity = initializer?.maximumVelocity ?? this.maximumVelocity;
      this.passthrough = initializer?.passthrough ?? this.passthrough;

      if (parentCollection != null) {
         Assert.class(parentCollection, AgentCollection, "parentCollection");
         this.#parentCollection = parentCollection;
      }

      this.#updateIsIdle();
   }

   /**
    * @override
    * @param {number} deltaTime
    * @returns {Vector}
    */
   update(deltaTime) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");
      let x = this.#agentX.update(deltaTime);
      let y = this.#agentY.update(deltaTime);
      this.#lastStep = V.new(x, y);
      return this.#lastStep;
   }

   /**
    * @param {Vector} offset 
    */
   addToCurrentValue(offset) {
      Assert.vector(offset);
      this.#agentX.addToCurrentValue(offset.x);
      this.#agentY.addToCurrentValue(offset.y);
      this.#updateIsIdle();
   }

   /**
    * @param {Vector} [newTarget]
    */
   stopAtTarget(newTarget) {
      if (newTarget != null) {
         Assert.vector(newTarget, "newTarget");
      }
      this.#agentX.stopAtTarget(newTarget != null ? newTarget.x : undefined);
      this.#agentY.stopAtTarget(newTarget != null ? newTarget.y : undefined);
      this.#updateIsIdle();
   }

   stopAtCurrent() {
      this.#agentX.stopAtCurrent();
      this.#agentY.stopAtCurrent();
      this.#updateIsIdle();
   }

   stopAtPrevious() {
      this.#agentX.stopAtCurrent();
      this.#agentY.stopAtCurrent();
      this.#updateIsIdle();
   }

   #updateIsIdle() {
      this.#isIdle = this.#agentX.isIdle && this.#agentY.isIdle;
      if (!this.#isIdle) {
         this.#parentCollection?.forceWakeUp();
      }
   }
}