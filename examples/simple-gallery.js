// SPDX-License-Identifier: GPL-3.0-or-later

import { TileValue } from "../src/Components/TileGrid/Shared/TileValue.js";
import { VistavaLayoutType } from "../src/Components/Vistava/VistavaLayoutType.js";
import { VistavaLayoutTypes } from "../src/Components/Vistava/VistavaLayoutTypes.js";
import { VistavaPresenter } from "../src/Components/Vistava/VistavaPresenter.js";
import { VistavaView } from "../src/Components/Vistava/VistavaView.js";
import { MediaTypes } from "../src/Shared/MediaTypes.js";
import { cu } from "../src/Utils/BrowserUtils.js";
import { VU } from "../src/Utils/VectorUtils.js";

// This example collection retriever returns TileValue instances with different labels images.
// In comparison to the "simple-thumbnails" example, the TileView instances here don't have
// "iconName" or "label" properties, but the "mediaUrl" and "mediaType" properties which are used
// by the "gallery" layout type.

/** @type {import("../src/Shared/CachedCollection").CollectionRetrieverConstructor<TileValue>} */
const createCollectionRetriever = () => (offset, count) => {
   const collectionLimit = 10;
   const imageUrls = ["./media/cubic.svg", "./media/landscape.svg", "./media/portrait.svg"];
   let results = [];
   for (let i = 0; i < count; i++) {
      let index = i + offset;
      // Picks one of the three available images with different aspect ratios randomly.
      let imageUrl = imageUrls[Math.round(Math.random() * (imageUrls.length - 1))];
      if (index < collectionLimit) {
         results.push(new TileValue({
            mediaUrl: imageUrl,
            mediaType: MediaTypes.svg
         }));
      }
   }
   return Promise.resolve(results);
};

// The layout types assigned to the presenter and the view must be the same instance.
const layoutTypes = new VistavaLayoutTypes([VistavaLayoutType.gallery]);

// Here, the presenter is initialized and assigned in the "update" callback of the "cu" function - 
// this allows the constructor to access the actual element size. Keep in mind that this requires 
// setting the size properties of the element in the "create" callback of the "cu" function;
// failing to do so can result in "empty" element sizes and errors during presenter initialisation.
cu(null, VistavaView, document.body, (e, s) => {
   // For the "flexGrow" to work, the parent container (body) needs to have 100% width/height - 
   // see the HTML file and the style tag in the header.
   s.flexGrow = "1";
   e.layoutTypes = layoutTypes;
}, (e, s) => {
   e.presenter = new VistavaPresenter(createCollectionRetriever, layoutTypes,
      VU.new(e.clientWidth, e.clientHeight));
});