// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { TileGridLayoutType } from "../TileGrid/Shared/TileGridLayoutType.js";
import { GalleryTileGridControlsView } from "../TileGrid/Controls/GalleryTileGridControlsView.js";
import { ThumbnailTileGridControlsView } from "../TileGrid/Controls/ThumbnailTileGridControlsView.js";
import { TileGridControlsView } from "../TileGrid/Controls/TileGridControlsView.js";
import { GalleryTileView } from "../TileGrid/Tile/GalleryTileView.js";
import { ThumbnailTileView } from "../TileGrid/Tile/ThumbnailTileView.js";
import { TileView } from "../TileGrid/Tile/TileView.js";

export class VistavaLayoutType {
   static get gallery() { return this.#gallery; }
   static get thumbnails() { return this.#thumbnails; }

   get identifier() { return this.#layoutConfiguration.identifier; }
   get tileViewType() { return this.#tileViewType; }
   get controlsType() { return this.#controlsType; }
   get layoutConfiguration() { return this.#layoutConfiguration; }
   
   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   static #gallery = new VistavaLayoutType(TileGridLayoutType.gallery,
      GalleryTileView, GalleryTileGridControlsView);
   static #thumbnails = new VistavaLayoutType(TileGridLayoutType.thumbnails,
      ThumbnailTileView, ThumbnailTileGridControlsView);

   /** @type {ClassType<TileView>} */
   #tileViewType;
   /** @type {ClassType<TileGridControlsView>} */
   #controlsType;
   /** @type {TileGridLayoutType} */
   #layoutConfiguration;

   /**
    * @param {TileGridLayoutType} layoutConfiguration 
    * @param {ClassType<TileView>} tileViewType 
    * @param {ClassType<TileGridControlsView>} controlsType 
    */
   constructor(layoutConfiguration, tileViewType, controlsType) {
      Assert.class(layoutConfiguration, TileGridLayoutType, "layoutConfiguration");
      Assert.classType(tileViewType, "tileViewType");
      Assert.classType(controlsType, "controlsType");

      this.#layoutConfiguration = layoutConfiguration;
      this.#tileViewType = tileViewType;
      this.#controlsType = controlsType;
   }
}