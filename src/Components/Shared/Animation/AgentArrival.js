// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { Agent } from "./Agent.js";
import { AgentCollection } from "./AgentCollection.js";

/**
 * @typedef {Object} AgentArrivalInitializer
 * @property {number} [currentValue]
 * @property {number} [targetValue]
 * @property {number} [friction]
 * @property {number} [speed]
 * @property {number} [maximumVelocity]
 * @property {boolean} [passthrough]
 */

/**
 * @extends {Agent<number>}
 */
export class AgentArrival extends Agent {
   /** @readonly @type {number} */
   #EPSILON = 0.001;

   /** @type {number} */
   #currentValue = 0;
   /** @type {number} */
   #targetValue = 0;
   /** @type {number} */
   #velocity = 0;
   /** @type {number} */
   #lastStep = 0;
   /** @type {boolean} */
   #isIdle = true;
   
   /** @type {boolean} */
   #passthrough = false;
   /** @type {number} */
   #friction = 15;
   /** @type {number} */
   #speed = 110;
   /** @type {number} */
   #maximumVelocity = 1500;
   /** @type {AgentCollection<Agent<number>>?} */
   #parentCollection = null;

   get isIdle() { return this.#isIdle; }
   
   /** @override */
   get currentValue() { return this.#currentValue; }
   /** @override */
   set currentValue(value) {
      Assert.number(value);
      this.#currentValue = value;
      this.#updateIsIdle();
   }

   /** @override */
   get targetValue() { return this.#targetValue; }
   /** @override */
   set targetValue(value) {
      Assert.number(value);
      this.#targetValue = value;
      this.#updateIsIdle();
   }

   get friction() { return this.#friction; }
   set friction(value) {
      Assert.numberPositiveOrZero(value);
      this.#friction = value;
   }

   get speed() { return this.#speed; }
   set speed(value) {
      Assert.numberPositiveOrZero(value);
      this.#speed = value;
   }

   get maximumVelocity() { return this.#maximumVelocity; }
   set maximumVelocity(value) {
      Assert.numberPositiveOrZero(value);
      this.#maximumVelocity = value;
   }

   get passthrough() { return this.#passthrough; }
   set passthrough(value) {
      this.#passthrough = !!value;
   }

   /** @override */
   get lastStep() { return this.#lastStep; }

   /**
    * @param {AgentArrivalInitializer} [initializer]
    * @param {AgentCollection<Agent<number>>} [parentCollection]
    */
   constructor(initializer, parentCollection) {
      super();

      this.currentValue = initializer?.currentValue ?? this.#currentValue;
      this.targetValue = initializer?.targetValue ?? this.#targetValue;
      this.friction = initializer?.friction ?? this.#friction;
      this.speed = initializer?.speed ?? this.#speed;
      this.maximumVelocity = initializer?.maximumVelocity ?? this.#maximumVelocity;
      this.passthrough = initializer?.passthrough ?? this.#passthrough;

      if (parentCollection != null) {
         Assert.class(parentCollection, AgentCollection, "parentCollection");
         this.#parentCollection = parentCollection;
      }

      this.#updateIsIdle();
   }

   /**
    * @override
    * @param {number} deltaTime
    * @returns {number} The new value of {@link lastStep}.
    */
   update(deltaTime) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");
      
      let distance = this.#currentValue - this.#targetValue;
      let acceleration = distance * this.#speed;

      let velocity = this.#velocity + acceleration * deltaTime;

      velocity -= velocity * Math.min(1, this.#friction * deltaTime);

      if (Math.abs(velocity) > 0) {
         let limitFactor = Math.max(0, Math.abs(velocity) - this.#maximumVelocity) / velocity;
         velocity -= Math.abs(velocity) * limitFactor;
      }

      let nextStep;
      if (Math.abs(distance) < this.#EPSILON || this.#passthrough) {
         nextStep = distance;
         this.#currentValue = this.#targetValue;
      } else {
         nextStep = velocity * deltaTime;
         this.#currentValue -= nextStep;
      }

      this.#lastStep = nextStep;
      this.#velocity = velocity;

      this.#updateIsIdle();

      return nextStep;
   }

   /**
    * @param {number} offset 
    */
   addToCurrentValue(offset) {
      Assert.number(offset, "offset");
      this.#currentValue += offset;

      this.#updateIsIdle();
   }

   /**
    * @param {number} [newTarget]
    */
   stopAtTarget(newTarget) {     
      if (newTarget != null) {
         Assert.number(newTarget, "newTarget");
         this.#targetValue = newTarget;
      }

      this.#velocity = 0;
      this.#currentValue = this.#targetValue;

      this.#updateIsIdle();
   }

   stopAtCurrent() {
      this.#velocity = 0;
      this.#targetValue = this.#currentValue;

      this.#updateIsIdle();
   }

   stopAtPrevious() {
      this.#velocity = 0;
      this.#currentValue -= this.#lastStep;
      this.#targetValue = this.#currentValue;

      this.#updateIsIdle();
   }

   #updateIsIdle() {
      this.#isIdle = this.#currentValue === this.#targetValue;
      if (!this.#isIdle) {
         this.#parentCollection?.forceWakeUp();
      }
   }
}