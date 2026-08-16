// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { PU } from "../../../Utils/ParseUtils.js";

export class KeyboardInputManagerSettings {
   /** @type {number} */
   #movementSpeed = 350;
   /** @type {number} */
   #movementSpeedupDuration = 0.5;
   /** @type {number} */
   #movementSpeedupStart = 0.1;
   /** @type {string} */
   #moveUpKey = "ArrowUp";
   /** @type {string} */
   #moveRightKey = "ArrowRight";
   /** @type {string} */
   #moveDownKey = "ArrowDown";
   /** @type {string} */
   #moveLeftKey = "ArrowLeft";
   /** @type {Map<string, string>} */
   #keyActions = new Map();

   get movementSpeed() { return this.#movementSpeed; }
   set movementSpeed(value) {
      Assert.numberPositive(value, "value");
      this.#movementSpeed = value;
   }

   get movementSpeedupDuration() { return this.#movementSpeedupDuration; }
   set movementSpeedupDuration(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#movementSpeedupDuration = value;
   }

   get movementSpeedupStart() { return this.#movementSpeedupStart; }
   set movementSpeedupStart(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#movementSpeedupStart = value;
   }

   get moveUpKey() { return this.#moveUpKey; }
   set moveUpKey(value) {
      Assert.string(value, "value");
      this.#moveUpKey = value;
   }

   get moveRightKey() { return this.#moveRightKey; }
   set moveRightKey(value) {
      Assert.string(value, "value");
      this.#moveRightKey = value;
   }

   get moveDownKey() { return this.#moveDownKey; }
   set moveDownKey(value) {
      Assert.string(value, "value");
      this.#moveDownKey = value;
   }

   get moveLeftKey() { return this.#moveLeftKey; }
   set moveLeftKey(value) {
      Assert.string(value, "value");
      this.#moveLeftKey = value;
   }

   get keyActions() { return this.#keyActions; }
   set keyActions(value) {
      Assert.class(value, Map, "value");
      this.#keyActions = value;
   }

   /**
    * @param {object} obj 
    * @returns {KeyboardInputManagerSettings}
    * @throws {ParserError}
    */
   static fromConfiguration(obj) {
      let settings = new KeyboardInputManagerSettings();

      let movementConfig = PU.parseObject(obj, "movement", m => ({
         speed: PU.parseNumberPositive(m, "speed", false, null),
         speedupDuration: PU.parseNumberPositive(m, "speedupDuration", true, null),
         speedupStart: PU.parseNumberPositive(m, "speedupStart", true, null),
         upKey: PU.parseString(m, "upKey", null),
         rightKey: PU.parseString(m, "rightKey", null),
         downKey: PU.parseString(m, "downKey", null),
         leftKey: PU.parseString(m, "leftKey", null)
      }), null);

      settings.movementSpeed = movementConfig?.speed ?? settings.movementSpeed;
      settings.movementSpeedupDuration = movementConfig?.speedupDuration ?? settings.movementSpeedupDuration;
      settings.movementSpeedupStart = movementConfig?.speedupStart ?? settings.movementSpeedupStart;
      settings.moveUpKey = movementConfig?.upKey ?? settings.moveUpKey;
      settings.moveRightKey = movementConfig?.rightKey ?? settings.moveRightKey;
      settings.moveDownKey = movementConfig?.downKey ?? settings.moveDownKey;
      settings.moveLeftKey = movementConfig?.leftKey ?? settings.moveLeftKey;
      
      settings.keyActions = PU.parseStringMap(obj, "actions", settings.keyActions);

      return settings;
   }
}