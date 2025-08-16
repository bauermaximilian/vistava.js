// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { EventController } from "../../../Shared/Event.js";
import { Agent } from "./Agent.js";

/**
 * Specifies a factory function for {@link AgentCollection}s that contain {@link Agent} instances
 * with a agent type of {@link TAgent}.
 * @template {Agent<any>} TAgent
 * @typedef {(parent:AgentCollection<TAgent>) => TAgent} AgentFactory
 */

/**
 * @template {Agent<any>} TAgent
 * @implements {Iterable<TAgent>}
 */
export class AgentCollection {
   /** @readonly @type {number} */
   #idleStateChangeCooldown = 1000;   
   /** @readonly @type {TAgent[]} */
   #agents = [];
   /** @type {boolean} */
   #isIdle = true;
   /** @type {number?} */
   #lastIdleStateChangeTime = null;

   /** @readonly @type {EventController<void>} */
   #onIdleStateChanged = new EventController();

   get onIdleStateChanged() { return this.#onIdleStateChanged.event; }
   
   get isIdle() { return this.#isIdle; }

   /** 
    * @param {AgentFactory<TAgent>} agentFactory 
    * @returns {TAgent}
    */
   add(agentFactory) {
      Assert.function(agentFactory, "agentFactory");

      let agent = agentFactory(this);
      if (this.#agents.indexOf(agent) >= 0) {
         throw new InvalidOperationError("The created agent is already part of the collection.");
      }

      this.#agents.push(agent);

      return agent;
   }

   /**
    * @param {TAgent} agent 
    * @returns {boolean}
    */
   remove(agent) {
      let agentIndex = this.#agents.indexOf(agent);

      if (agentIndex >= 0) {
         this.#agents.splice(agentIndex, 1);
         return true;
      } else {
         return false;
      }
   }

   /**
    * @param {number} deltaTime
    */
   update(deltaTime) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");

      let isIdle = true;
      for (let i = 0; i < this.#agents.length; i++) {
         let agent = this.#agents[i];
         this.#agents[i].update(deltaTime);
         isIdle &&= agent.isIdle;
      }

      if (!isIdle && this.#isIdle) {
         this.#isIdle = false;
         this.#triggerOnIdleStateChanged();
      } else if (isIdle && !this.isIdle && (this.#lastIdleStateChangeTime === null ||
         (performance.now() - this.#lastIdleStateChangeTime) > this.#idleStateChangeCooldown)) {
         this.#isIdle = true;
         this.#triggerOnIdleStateChanged();
      }
   }

   forceWakeUp() {
      if (this.#isIdle) {
         this.#isIdle = false;
         this.#triggerOnIdleStateChanged();
      }
   }

   #triggerOnIdleStateChanged() {
      this.#lastIdleStateChangeTime = performance.now();
      this.#onIdleStateChanged.trigger();
   }
   
   [Symbol.iterator]() {
      let index = -1;
      return {
         next: () => ({ value: this.#agents[++index], done: !(index in this.#agents) })
      };
   };
}