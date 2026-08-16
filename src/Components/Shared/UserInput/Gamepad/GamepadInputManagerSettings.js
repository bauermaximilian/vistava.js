// SPDX-License-Identifier: GPL-3.0-or-later

import { ParserError } from "../../../../Errors/ParserError.js";
import { Assert } from "../../../../Shared/Assert.js";
import { PU } from "../../../../Utils/ParseUtils.js";
import { GamepadProfile } from "./GamepadProfile.js";

export class GamepadInputManagerSettings {
   /** @type {readonly GamepadProfile[]} */
   #profiles = [];
   /** @type {number} */
   #scrollSpeed = 1;
   /** @type {number} */
   #movementSpeed = 300;
   /** @type {number} */
   #movementSpeedupByFactor = 2;
   /** @type {number} */
   #movementSpeedupTimeSeconds = 3;

   get profiles() { return this.#profiles; }
   set profiles(value) {
      Assert.array(value, "value");
      this.#profiles = value;
   }

   get scrollSpeed() { return this.#scrollSpeed; }
   set scrollSpeed(value) {
      Assert.numberPositive(value, "value");
      this.#scrollSpeed = value;
   }

   get movementSpeed() { return this.#movementSpeed; }
   set movementSpeed(value) {
      Assert.numberPositive(value, "value");
      this.#movementSpeed = value;
   }

   get movementSpeedupByFactor() { return this.#movementSpeedupByFactor; }
   set movementSpeedupByFactor(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#movementSpeedupByFactor = value;
   }

   get movementSpeedupTimeSeconds() { return this.#movementSpeedupTimeSeconds; }
   set movementSpeedupTimeSeconds(value) {
      Assert.numberPositiveOrZero(value, "value");
      this.#movementSpeedupTimeSeconds = value;
   }

   /**
    * @param {object} obj 
    * @returns {GamepadInputManagerSettings}
    * @throws {ParserError}
    */
   static fromConfiguration(obj) {
      let settings = new GamepadInputManagerSettings();
      settings.scrollSpeed = PU.parseNumberPositive(obj, "scrollSpeed", false, null) ??
         settings.scrollSpeed;
      settings.movementSpeed = PU.parseNumberPositive(obj, "movementSpeed", false, null) ??
         settings.movementSpeed;
      settings.movementSpeedupByFactor = PU.parseNumberPositive(obj, "movementSpeedupFactor", true, null) ??
         settings.movementSpeedupByFactor;
      settings.movementSpeedupTimeSeconds = PU.parseNumberPositive(obj, "movementSpeedupTime", true, null) ??
         settings.movementSpeedupTimeSeconds;
      let gamepadsConfig = obj["gamepads"];
      if (gamepadsConfig != null) {
         if (typeof (gamepadsConfig) !== "object") {
            throw ParserError.newInvalidTypeError("gamepads", "object");
         }
         let profiles = [];
         for (let key of Object.keys(gamepadsConfig)) {
            profiles.push(GamepadProfile.fromConfiguration(key, gamepadsConfig[key]));
         }
         settings.profiles = profiles;
      }
      return settings;
   }
}