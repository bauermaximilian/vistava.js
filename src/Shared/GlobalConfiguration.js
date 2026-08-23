// SPDX-License-Identifier: GPL-3.0-or-later

import { GamepadInputManagerSettings } from "../Components/Shared/UserInput/Gamepad/GamepadInputManagerSettings.js";
import { KeyboardInputManagerSettings } from "../Components/Shared/UserInput/KeyboardInputManagerSettings.js";
import { Assert } from "./Assert.js";
import defaultKeyboardConfiguration from "./Configurations/keyboard.json" with { type: "json" };
import defaultGamepadConfiguration from "./Configurations/gamepad.json" with { type: "json" };

export class GlobalConfiguration {    
   static get gamepadSettings() { return this.#gamepadSettings; }
   static set gamepadSettings(value) {
      if (value !== this.#gamepadSettings) {
         Assert.class(value, GamepadInputManagerSettings, undefined, true);
         this.#gamepadSettings = value;
      }
   }
   
   static get keyboardSettings() { return this.#keyboardSettings; }
   static set keyboardSettings(value) {
      if (value !== this.#keyboardSettings) {
         Assert.class(value, KeyboardInputManagerSettings, undefined, true);
         this.#keyboardSettings = value;
      }
   }

   /** @type {KeyboardInputManagerSettings} */
   static #keyboardSettings = KeyboardInputManagerSettings.fromConfiguration(defaultKeyboardConfiguration);
   /** @type {GamepadInputManagerSettings} */
   static #gamepadSettings = GamepadInputManagerSettings.fromConfiguration(defaultGamepadConfiguration);
}