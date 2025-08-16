// SPDX-License-Identifier: GPL-3.0-or-later

import { GuiIconModel } from "./GuiIconModel.js";

export class GuiIconPresenter {
   #model = new GuiIconModel();
   
   get model() { return this.#model; }

   /**
    * @param {import("./GuiIconModel.js").GuiIconModelInit} [init]
    */
   constructor(init) {
      if (init != null) {
         this.#model.apply(init);
      }
   }

   /**
    * Parses a SVG document and returns a new JSON object string where every key-value-pair is equal to the ID
    * attribute of every group in the SVG document with the class "layer".
    * @param {string?} [svgUrl] The URL of the SVG to be loaded. If undefined or null, the
    * default icon SVG url will be used.
    * @returns Promise<string>
    */
   static async getAvailableIconNamesAsync(svgUrl = null) {
      if (svgUrl == null) {
         let url = new URL(import.meta.url);
         let urlPathComponents = url.pathname.split('/');
         urlPathComponents[urlPathComponents.length - 1] = "GuiIconResources.svg";
         url.pathname = urlPathComponents.join('/');
         svgUrl = url.toString();
      }

      let response = await fetch(svgUrl);
      let responseString = await response.text();
      let parser = new DOMParser();
      let svgDocument = parser.parseFromString(responseString, "image/svg+xml");
      /** @type {Object.<string,any>} */
      let iconNames = {};
      svgDocument.querySelectorAll(`g[class="layer"]`).forEach(
         e => iconNames[e.id] = e.id);
      return JSON.stringify(iconNames, null, 3);
   }

   // static {
   //    if (Assert.isActive) {
   //       GuiIconPresenter.getAvailableIconNamesAsync()
   //          .then(iconNamesJson => {
   //             let iconNames = JSON.parse(iconNamesJson);
   //             console.log("Available Icon Names:");
   //             console.log(iconNames);
   //          })
   //          .catch(error => {
   //             console.error("Error fetching or parsing SVG:", error);
   //          });
   //    }
   // }
}