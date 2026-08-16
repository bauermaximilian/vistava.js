// SPDX-License-Identifier: GPL-3.0-or-later

import { ParserError } from "../../../../Errors/ParserError.js";
import { Assert } from "../../../../Shared/Assert.js";
import { PU } from "../../../../Utils/ParseUtils.js";

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
   /** @type {boolean} */
   #invertScroll = false;
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

   get invertScroll() { return this.#invertScroll; }
   set invertScroll(value) {
      Assert.boolean(value);
      this.#invertScroll = value;
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
      this.#identifierRegExp = identifierRegExp;
      init?.(this);
   }

   /**
    * @param {string} key 
    * @param {object} obj 
    * @returns {GamepadProfile}
    * @throws {ParserError}
    */
   static fromConfiguration(key, obj) {
      let indentifierRegex;
      try {
         indentifierRegex = new RegExp(key, "i");
      } catch (error) {
         throw new ParserError(`The value "${key}" is no valid regex.`);
      }

      try {
         let axisMovement = PU.parseObject(obj, "axisMovement", a => {
            let usedAxisIds = new Set();
            let parseAxisMovement = (/** @type {any} */ h) => {
               let parsedAxis = {
                  index: PU.parseNumber(h, "index"),
                  invert: PU.parseBoolean(h, "invert", false),
               };
               if (usedAxisIds.has(parsedAxis.index)) {
                  throw new ParserError(`The axis index "${parsedAxis.index}" was used more than once.`);
               } else {
                  usedAxisIds.add(parsedAxis.index);
               }
               return parsedAxis;
            };
            let horizontal = PU.parseObject(a, "horizontal", parseAxisMovement, null);
            let vertical = PU.parseObject(a, "vertical", parseAxisMovement, null);
            let scroll = PU.parseObject(a, "scroll", parseAxisMovement, null);
            return { horizontal, vertical, scroll };
         }, null);
         let axisActions = PU.parseStringMap(obj, "axisActions", new Map());
         let buttonActions = PU.parseStringMap(obj, "buttonActions", new Map());
      
         return new GamepadProfile(indentifierRegex, p => {
            p.axisMoveHorizontal = axisMovement?.horizontal?.index ?? null;
            p.invertHorizontal = axisMovement?.horizontal?.invert ?? false;
            p.axisMoveVertical = axisMovement?.vertical?.index ?? null;
            p.invertVertical = axisMovement?.vertical?.invert ?? false;
            p.axisScroll = axisMovement?.scroll?.index ?? null;
            p.invertScroll = axisMovement?.scroll?.invert ?? false;
            p.axisActions = axisActions;
            p.buttonActions = buttonActions;
         });
      } catch (error) {
         throw new ParserError(`The segment "gamepads.${key}" couldn't be parsed: ${error}`);
      }
   }
}