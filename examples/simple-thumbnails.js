// SPDX-License-Identifier: GPL-3.0-or-later

// For this example, the required classes and components are imported directly from the original
// source files and not the bundled library - the code would work the same when including the 
// dependencies from the bundle file though:
// import { 
//    GuiIconNames, TileValue, VistavaLayoutType, VistavaLayoutTypes, VistavaPresenter, 
//    VistavaView, cu, VU 
// } from "../bundle/vistava.js";

import { GuiIconNames } from "../src/Components/GuiIcon/GuiIconModel.js";
import { TileValue } from "../src/Components/TileGrid/Shared/TileValue.js";
import { VistavaLayoutType } from "../src/Components/Vistava/VistavaLayoutType.js";
import { VistavaLayoutTypes } from "../src/Components/Vistava/VistavaLayoutTypes.js";
import { VistavaPresenter } from "../src/Components/Vistava/VistavaPresenter.js";
import { VistavaView } from "../src/Components/Vistava/VistavaView.js";
import { cu } from "../src/Utils/BrowserUtils.js";
import { VU } from "../src/Utils/VectorUtils.js";

// The Vistava components are written using a variation of the model-view-presenter pattern:
// - ColllectionRetriever: Provides the VistavaModel with the content to be displayed
// - VistavaModel: Automatically created part of the VistavaPresenter ("model" property)
// - VistavaPresenter: The application logic, assigned to the "presenter" property of VistavaView
// - VistavaView: A custom HTMLElement, inserted into the DOM

// This example collection retriever returns TileValue instances with different labels, but the
// same "folder" icon for every item in the list. There's no "hard limit" for collection lengths -
// in this example, a limit of 200 was put in place.

/** @type {import("../src/Shared/CachedCollection").CollectionRetrieverConstructor<TileValue>} */
const createCollectionRetriever = (query) => (offset, count) => {
   const collectionLimit = 200;
   let results = [];
   for (let i = 0; i < count; i++) {
      let index = i + offset;
      if (index < collectionLimit) {
         results.push(new TileValue({
            label: `${query} #${index}`,
            iconName: GuiIconNames["folder-outline"]
         }));
      }
   }
   return Promise.resolve(results);
};

// The layout types assigned to the presenter and the view must be the same instance.
const layoutTypes = new VistavaLayoutTypes([VistavaLayoutType.thumbnails]);

// The presenter must be initialized manually with a collection retriever and an 
// initial (non-empty) size. The initial query is optional and defaults to an empty string.
const vistavaPresenter = new VistavaPresenter(
   createCollectionRetriever,
   layoutTypes,
   VU.new(document.body.clientWidth, document.body.clientHeight),
   { query: "My Folder" } );

// "cu" is a helper function used throughout the library, handling creation and updating of 
// DOM elements and registering any custom components (implementing ViewBase) on their first use.
// Alternatively, the VistavaView component can be registered manually using "customElements.define", 
// created using "document.createElement" and appended to the document using "document.body.append".
cu(null, VistavaView, document.body, (e, s) => {
   // For the "flexGrow" to work, the parent container (body) needs to have 100% width/height - 
   // see the HTML file and the style tag in the header.
   s.flexGrow = "1";
   e.layoutTypes = layoutTypes;
   e.presenter = vistavaPresenter;
});