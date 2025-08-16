// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { ObservableStorage } from "../../Shared/ObservableStorage.js";
import { ContextMenuEntryModel } from "./ContextMenuEntryModel.js";

export class ContextMenuModel {
   
   /** @type {ContextMenuEntryModel[]} */
   get entries() { return this.#storage.get("entries", Object.freeze([])); }
   set entries(value) {
      this.#storage.set("entries", Object.freeze(value),
      () => Assert.arrayOfClass(value, ContextMenuEntryModel));
   }
   
   /** @type {Rectangle?} */
   get sourceBounds() { return this.#storage.get("sourceBounds", null); }
   set sourceBounds(value) {
      this.#storage.set("sourceBounds", value, () => Assert.ifDefined(value, () => Assert.rectangle));
   }
   
   get onUpdated() { return this.#storage.onUpdated; }
   
   /** @typedef {import("../../Utils/RectangleUtils.js").Rectangle} Rectangle */

   /** @type {ObservableStorage<ContextMenuModel>} */
   #storage = new ObservableStorage();

   /**
    * @param {Object.<keyof(ContextMenuModel), any>} object 
    */
   apply(object) {
      ObservableStorage.apply(object, this, this.#storage);
   }
}