// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { EventSubject } from "../../Shared/Event.js";
import { ObservableStorage } from "../../Shared/ObservableStorage.js";

export class ContextMenuEntryModel {
   /** @type {boolean} */
   get disabled() { return this.#storage.get("disabled", false); }
   set disabled(value) { this.#storage.set("disabled", value, Assert.boolean); }
   /** @type {string?} */
   get label() { return this.#storage.get("label", null) };
   set label(value) { this.#storage.set("label", value, Assert.stringOrNull); }
   /** @type {string?} */
   get iconName() { return this.#storage.get("iconName", null); }
   set iconName(value) { this.#storage.set("iconName", value, Assert.stringOrNull); }
   /** @type {string?} */
   get iconLabel() { return this.#storage.get("iconLabel", null); }
   set iconLabel(value) { this.#storage.set("iconLabel", value, Assert.stringOrNull); }
   /** @type {string?} */
   get iconUrl() { return this.#storage.get("iconUrl", null); }
   set iconUrl(value) { this.#storage.set("iconUrl", value, Assert.stringOrNull); }

   /** @type {EventSubject<import("../../Shared/Event.js").FieldsChangedEventArgs<ContextMenuEntryModel>>} */
   get onUpdated() { return this.#storage.onUpdated; }

   /** @type {ObservableStorage<ContextMenuEntryModel>} */
   #storage = new ObservableStorage();
}