// SPDX-License-Identifier: GPL-3.0-or-later

import { EnumItem, EnumType } from "../../../Shared/EnumType.js";

export class ZoomModeType extends EnumType {
   static #enum = new ZoomModeType();
   static get enum() { return ZoomModeType.#enum; }

   /** @type {ZoomMode} */
   get original() { return this.getItem(1, "original"); }
   /** @type {ZoomMode} */
   get smallest() { return this.getItem(2, "smallest"); }
   /** @type {ZoomMode} */
   get fitContent() { return this.getItem(3, "fitContent"); }
   /** @type {ZoomMode} */
   get fitContainer() { return this.getItem(4, "fitContainer"); }
}

export const ZoomModes = ZoomModeType.enum;

/** @typedef {EnumItem<ZoomModeType>} ZoomMode */