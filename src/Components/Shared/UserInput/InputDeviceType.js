// SPDX-License-Identifier: GPL-3.0-or-later

import { EnumItem, EnumType } from "../../../Shared/EnumType.js";

export class InputDeviceType extends EnumType {
   static #enum = new InputDeviceType();
   static get enum() { return InputDeviceType.#enum; }

   get unknown() { return this.getItem(0, "unknown"); }
   get keyboard() { return this.getItem(1, "keyboard"); }
   get mouse() { return this.getItem(2, "mouse"); }
   get touch() { return this.getItem(3, "touch"); }
   get gamepad() { return this.getItem(4, "gamepad"); }
}

export const InputDeviceTypes = InputDeviceType.enum;

/** @typedef {EnumItem<InputDeviceType>} InputDevice */