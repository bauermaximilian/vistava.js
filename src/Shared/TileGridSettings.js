// SPDX-License-Identifier: GPL-3.0-or-later

import { PU } from "../Utils/ParseUtils.js";
import { Assert } from "./Assert.js";

export class TileGridSettings {   
   get thumbnailSettings() { return this.#thumbnailSettings; }   
   get gallerySettings() { return this.#gallerySettings; }
   
   /** @type {ThumbnailSettings} */
   #thumbnailSettings = new ThumbnailSettings();
   /** @type {GallerySettings} */
   #gallerySettings = new GallerySettings();

   /**
    * @param {object} obj 
    * @returns {TileGridSettings}
    * @throws {ParserError}
    */
   static fromConfiguration(obj) {
      let settings = new TileGridSettings();

      let thumbnailsConfig = PU.parseObject(obj, "thumbnails", t => ({
         showVideoLabels: PU.parseBoolean(t, "showVideoLabels", null),
         showImageLabels: PU.parseBoolean(t, "showImageLabels", null)
      }));

      settings.thumbnailSettings.showVideoLabels = thumbnailsConfig.showVideoLabels ??
         settings.thumbnailSettings.showVideoLabels;
      settings.thumbnailSettings.showImageLabels = thumbnailsConfig.showImageLabels ??
         settings.thumbnailSettings.showImageLabels;

      let galleryConfig = PU.parseObject(obj, "gallery", g => ({
         muteVideosByDefault: PU.parseBoolean(g, "muteVideosByDefault", null),
         loopVideos: PU.parseBoolean(g, "loopVideos", null),
         zoomToTop: PU.parseBoolean(g, "zoomToTop", null),
         doubleClickZooms: PU.parseBoolean(g, "doubleClickZooms", null)
      }));

      settings.gallerySettings.muteVideosByDefault = galleryConfig.muteVideosByDefault ??
         settings.gallerySettings.muteVideosByDefault;
      settings.gallerySettings.loopVideos = galleryConfig.loopVideos ??
         settings.gallerySettings.loopVideos;
      settings.gallerySettings.zoomToTop = galleryConfig.zoomToTop ??
         settings.gallerySettings.zoomToTop;
      settings.gallerySettings.doubleClickZooms = galleryConfig.doubleClickZooms ??
         settings.gallerySettings.doubleClickZooms;
      
      return settings;
   }
}

class ThumbnailSettings {   
   get showImageLabels() { return this.#showImageLabels; }
   set showImageLabels(value) {
      Assert.boolean(value, undefined, true);
      this.#showImageLabels = value;
   }
   
   get showVideoLabels() { return this.#showVideoLabels; }
   set showVideoLabels(value) {
      Assert.boolean(value, undefined, true);
      this.#showVideoLabels = value;
   }

   /** @type {boolean} */
   #showImageLabels = true;
   /** @type {boolean} */
   #showVideoLabels = true;
}

class GallerySettings {
   get muteVideosByDefault() { return this.#muteVideosByDefault; }
   set muteVideosByDefault(value) {
      Assert.boolean(value, undefined, true);
      this.#muteVideosByDefault = value;
   }

   get loopVideos() { return this.#loopVideos; }
   set loopVideos(value) {
      Assert.boolean(value, undefined, true);
      this.#loopVideos = value;
   }

   get zoomToTop() { return this.#zoomToTop; }
   set zoomToTop(value) {
      Assert.boolean(value, undefined, true);
      this.#zoomToTop = value;
   }

   get doubleClickZooms() { return this.#doubleClickZooms; }
   set doubleClickZooms(value) {
      Assert.boolean(value, undefined, true);
      this.#doubleClickZooms = value;
   }

   /** @type {boolean} */
   #muteVideosByDefault = false;
   /** @type {boolean} */
   #loopVideos = true;
   /** @type {boolean} */
   #zoomToTop = true;
   /** @type {boolean} */
   #doubleClickZooms = false;
}