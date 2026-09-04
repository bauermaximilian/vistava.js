// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { ObservableStorage } from "../../Shared/ObservableStorage.js";

/**
 * @typedef {object} GuiIconModelInit
 * @property {number} [clipTopPx]
 * @property {number} [clipRightPx]
 * @property {number} [clipBottomPx]
 * @property {number} [clipLeftPx]
 * @property {string} [source]
 * @property {string} [sourceAbsolute]
 * @property {string} [icon]
 * @property {boolean} [isInteractive]
 */

export class GuiIconModel {
   /** @type {number} */
   get clipTopPx() { return this.#storage.get("clipTopPx", 0); }
   set clipTopPx(value) { this.#storage.set("clipTopPx", value, Assert.numberPositiveOrZero); }

   /** @type {number} */
   get clipRightPx() { return this.#storage.get("clipRightPx", 0); }
   set clipRightPx(value) { this.#storage.set("clipRightPx", value, Assert.numberPositiveOrZero); }

   /** @type {number} */
   get clipBottomPx() { return this.#storage.get("clipBottomPx", 0); }
   set clipBottomPx(value) { this.#storage.set("clipBottomPx", value, Assert.numberPositiveOrZero); }

   /** @type {number} */
   get clipLeftPx() { return this.#storage.get("clipLeftPx", 0); }
   set clipLeftPx(value) { this.#storage.set("clipLeftPx", value, Assert.numberPositiveOrZero); }

   /** @type {string} */
   get source() { return this.#storage.get("source", "GuiIconResources.svg"); }
   set source(value) { this.#storage.set("source", value, Assert.stringNotEmptyOrWhitespacesOnly); }

   /** @type {string} */
   get sourceAbsolute() { return new URL(this.source, import.meta.url).toString(); }

   /** 
    * @type {string} See {@link GuiIconName} for available values.
    */
   get icon() { return this.#storage.get("icon", "default"); }
   set icon(value) { this.#storage.set("icon", value, Assert.stringNotEmptyOrWhitespacesOnly); }

   /** @type {boolean} */
   get isInteractive() { return this.#storage.get("isInteractive", false); }
   set isInteractive(value) { this.#storage.set("isInteractive", value, Assert.boolean); }

   get onUpdated() { return this.#storage.onUpdated; }

   /** @type {ObservableStorage<GuiIconModel>} */
   #storage = new ObservableStorage();

   /**
    * @param {GuiIconModelInit} object 
    */
   apply(object) {
      ObservableStorage.apply(object, this, this.#storage);
   }
}

/** @typedef {keyof(GuiIconNames)} GuiIconName */
export const GuiIconNames = Object.freeze({
   "extension": "extension",
   "documentation": "documentation",
   "collection-play": "collection-play",
   "collection-list": "collection-list",
   "collection-link": "collection-link",
   "collection-up": "collection-up",
   "collection-3": "collection-3",
   "collection-2": "collection-2",
   "collection": "collection",
   "previousHeavy": "previousHeavy",
   "previous": "previous",
   "nextHeavy": "nextHeavy",
   "next": "next",
   "upwards": "upwards",
   "downwards": "downwards",
   "compress": "compress",
   "expand": "expand",
   "expandLeft": "expandLeft",
   "expandRight": "expandRight",
   "expandUp": "expandUp",
   "expandDown": "expandDown",
   "fullscreen": "fullscreen",
   "maximize": "maximize",
   "play": "play",
   "pause": "pause",
   "stop": "stop",
   "overview": "overview",
   "ellipsis": "ellipsis",
   "hamburger": "hamburger",
   "back": "back",
   "up": "up",
   "forward": "forward",
   "fastForward": "fastForward",
   "rewind": "rewind",
   "volume0-5": "volume0-5",
   "volume1-5": "volume1-5",
   "volume2-5": "volume2-5",
   "volume3-5": "volume3-5",
   "volume4-5": "volume4-5",
   "volume5-5": "volume5-5",
   "volumeOn": "volumeOn",
   "volumeOff": "volumeOff",
   "volumeDown": "volumeDown",
   "volumeUp": "volumeUp",
   "zoom": "zoom",
   "search": "search",
   "filter": "filter",
   "bookmark": "bookmark",
   "bookmarkSolid": "bookmarkSolid",
   "loading": "loading",
   "exclamation": "exclamation",
   "cross": "cross",
   "cross-circle": "cross-circle",
   "cross-box": "cross-box",
   "check": "check",
   "plus": "plus",
   "minus": "minus",
   "hashtag": "hashtag",
   "folder-outline": "folder-outline",
   "folder-link-outline": "folder-link-outline",
   "playlist-outline": "playlist-outline",
   "folder-up-outline": "folder-up-outline",
   "cross-outline": "cross-outline",
   "logo": "logo",
   "default": "default"
});