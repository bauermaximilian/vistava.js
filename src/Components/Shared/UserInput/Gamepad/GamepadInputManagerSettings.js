// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../../Shared/Assert.js";
import { GamepadProfile } from "./GamepadProfile.js";
import { GamepadProfiles } from "./GamepadProfiles.js";

export class GamepadInputManagerSettings {
   /** @type {readonly GamepadProfile[]} */
   #profiles = GamepadProfiles;
   /** @type {number} */
   #scrollSpeed = 0.25;
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
}