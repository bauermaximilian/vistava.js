// SPDX-License-Identifier: GPL-3.0-or-later

import { MediaTypes } from "../../../Shared/MediaTypes.js";

/**
 * @typedef {object} TileValueInitializer
 * @property {string?} [label]
 * @property {string?} [mediaUrl]
 * @property {string?} [mediaType]
 * @property {number?} [mediaDuration]
 * @property {string?} [mediaPreviewUrl]
 * @property {string?} [mediaPreviewType]
 * @property {string?} [thumbnailUrl]
 * @property {string?} [thumbnailType]
 * @property {string?} [iconName]
 * @property {string?} [queryTarget]
 * @property {string?} [sourceUrl]
 */

export class TileValue {
   /** @type {string?} */
   #label;
   /** @type {string?} */
   #mediaUrl;
   /** @type {string?} */
   #mediaType;
   /** @type {number?} */
   #mediaDuration;
   /** @type {string?} */
   #mediaPreviewUrl;
   /** @type {string?} */
   #mediaPreviewType;
   /** @type {string?} */
   #thumbnailUrl;
   /** @type {string?} */
   #thumbnailType;
   /** @type {string?} */
   #iconName;
   /** @type {string?} */
   #queryTarget;
   /** @type {string?} */
   #sourceUrl;
   
   get label() { return this.#label; }   
   get mediaUrl() { return this.#mediaUrl; }
   get mediaType() { return this.#mediaType; }   
   get mediaDuration() { return this.#mediaDuration; }   
   get thumbnailUrl() { return this.#thumbnailUrl; }   
   get thumbnailType() { return this.#thumbnailType; }
   get mediaPreviewUrl() { return this.#mediaPreviewUrl; }
   get mediaPreviewType() { return this.#mediaPreviewType; }
   get iconName() { return this.#iconName; }
   get queryTarget() { return this.#queryTarget; }
   get sourceUrl() { return this.#sourceUrl; }

   get hasMedia() {
      return this.hasImageMedia || this.hasVideoMedia;
   }

   get hasImageMedia() {
      if (typeof(this.#mediaUrl) === "string" && typeof(this.#mediaType) === "string") {
         return this.#mediaUrl.trim().length > 0 && 
            MediaTypes.isSupportedImageType(this.#mediaType);
      } else {
         return false;
      }
   }

   get hasImageMediaPreview() {
      if (typeof(this.#mediaPreviewUrl) === "string" && 
         typeof(this.#mediaPreviewType) === "string") {
         return this.#mediaPreviewUrl.trim().length > 0 && 
            MediaTypes.isSupportedImageType(this.#mediaPreviewType);
      } else {
         return false;
      }
   }

   get hasVideoMedia() {
      if (typeof(this.#mediaUrl) === "string" && typeof(this.#mediaType) === "string") {
         return this.#mediaUrl.trim().length > 0 && 
            MediaTypes.isSupportedVideoType(this.#mediaType);
      } else {
         return false;
      }
   }

   get hasThumbnailImage() {
      if (typeof(this.#thumbnailType) === "string" && typeof(this.#thumbnailUrl) === "string") {
         return this.#thumbnailUrl.trim().length > 0 && 
            MediaTypes.isSupportedImageType(this.#thumbnailType);
      } else {
         return false;
      }
   }

   get hasIconName() {
      return typeof(this.#iconName) === "string" && this.#iconName.trim().length > 0;
   }

   get hasQueryTarget() {
      return typeof(this.#queryTarget) === "string";
   }

   get hasLabel() {
      return typeof(this.#label) === "string" && this.#label.trim().length > 0;
   }

   /**
    * @param {TileValueInitializer} [initializer]
    */
   constructor(initializer) {
      this.#label = TileValue.#getStringOrNull(initializer?.label);
      this.#mediaUrl = TileValue.#getStringOrNull(initializer?.mediaUrl);
      this.#mediaType = TileValue.#getStringOrNull(initializer?.mediaType);
      this.#mediaDuration = TileValue.#getNumberOrNull(initializer?.mediaDuration);
      this.#mediaPreviewUrl = TileValue.#getStringOrNull(initializer?.mediaPreviewUrl);
      this.#mediaPreviewType = TileValue.#getStringOrNull(initializer?.mediaPreviewType);
      this.#thumbnailUrl = TileValue.#getStringOrNull(initializer?.thumbnailUrl);
      this.#thumbnailType = TileValue.#getStringOrNull(initializer?.thumbnailType);
      this.#iconName = TileValue.#getStringOrNull(initializer?.iconName);
      this.#queryTarget = TileValue.#getStringOrNull(initializer?.queryTarget);
      this.#sourceUrl = TileValue.#getStringOrNull(initializer?.sourceUrl);
   }

   /**
    * @param {any} value 
    * @returns {string?}
    */
   static #getStringOrNull(value) {
      if (typeof(value) === "string") {
         return value;
      } else {
         return null;
      }
   }

   /**
    * @param {any} value 
    * @returns {number?}
    */
   static #getNumberOrNull(value) {
      if (typeof(value) === "number") {
         return value;
      } else {
         return null;
      }
   }
}