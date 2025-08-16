// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../../Shared/Assert.js";

export class GamepadProfile {
   /** @type {Map<string, string>} */
   #buttonActions = new Map();
   /** @type {Map<string, string>} */
   #axisActions = new Map();
   /** @type {number?} */
   #axisMoveHorizontal = null;
   /** @type {number?} */
   #axisMoveVertical = null;
   /** @type {number?} */
   #axisScroll = null;
   /** @type {boolean} */
   #invertVertical = false;
   /** @type {boolean} */
   #invertHorizontal = false;
   /** @type {number} */
   #axisActivationTreshold = 0.1;
   /** @type {number} */
   #axisActionTriggerTreshold = 0.5;
   /** @type {RegExp} */
   #identifierRegExp;

   get buttonActions() { return this.#buttonActions; }
   set buttonActions(value) {
      Assert.class(value, Map, "value");
      this.#buttonActions = value;
   }

   get axisActions() { return this.#axisActions; }
   set axisActions(value) {
      Assert.class(value, Map, "value");
      this.#axisActions = value;
   }

   get axisMoveHorizontal() { return this.#axisMoveHorizontal; }
   set axisMoveHorizontal(value) {
      if (value !== null) {
         Assert.numberPositiveOrZero(value, "value");
      }
      this.#axisMoveHorizontal = value;
   }

   get invertVertical() { return this.#invertVertical; }
   set invertVertical(value) {
      Assert.boolean(value);
      this.#invertVertical = value;
   }

   get invertHorizontal() { return this.#invertHorizontal; }
   set invertHorizontal(value) {
      Assert.boolean(value);
      this.#invertHorizontal = value;
   }

   get axisMoveVertical() { return this.#axisMoveVertical; }
   set axisMoveVertical(value) {
      if (value !== null) {
         Assert.numberPositiveOrZero(value, "value");
      }
      this.#axisMoveVertical = value;
   }
   
   get axisScroll() { return this.#axisScroll; }
   set axisScroll(value) {
      if (value !== null) {
         Assert.numberPositiveOrZero(value, "value");
      }
      this.#axisScroll = value;
   }

   get axisActivationTreshold() { return this.#axisActivationTreshold; }
   set axisActivationTreshold(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#axisActivationTreshold = value;
   }

   get axisActionTriggerTreshold() { return this.#axisActionTriggerTreshold; }
   set axisActionTriggerTreshold(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#axisActionTriggerTreshold = value;
   }

   get identifierRegExp() { return this.#identifierRegExp; }

   /**
    * @param {RegExp} identifierRegExp 
    * @param {((profile:GamepadProfile)=>void)} [init]
    */
   constructor(identifierRegExp, init) {
      //TODO: Improve configurability of input managers and move these definitions where they belong
      this.#identifierRegExp = identifierRegExp;
      init?.(this);
   }
}