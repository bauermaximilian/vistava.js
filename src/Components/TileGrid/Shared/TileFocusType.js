// SPDX-License-Identifier: GPL-3.0-or-later

import { EnumItem, EnumType } from "../../../Shared/EnumType.js";

export class TileFocusType extends EnumType {
   static #enum = new TileFocusType();
   static get enum() { return this.#enum; }

   /** @type {TileFocus} */
   get none() { return this.getItem(0, "none"); }
   /** @type {TileFocus} */
   get invisible() { return this.getItem(1, "invisible"); }
   /** @type {TileFocus} */
   get visible() { return this.getItem(2, "visible"); }
}

export const TileFocuses = TileFocusType.enum;

/** @typedef {EnumItem<TileFocusType>} TileFocus */