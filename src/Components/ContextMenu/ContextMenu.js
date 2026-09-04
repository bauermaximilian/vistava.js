// SPDX-License-Identifier: GPL-3.0-or-later

import { cu } from "../../Utils/BrowserUtils.js";
import { InputManager } from "../Shared/UserInput/InputManager.js";
import { ContextMenuEntryPresenter } from "./ContextMenuEntryPresenter.js";
import { ContextMenuPresenter } from "./ContextMenuPresenter.js";
import { ContextMenuView } from "./ContextMenuView.js";

export class ContextMenu {
   /** @type {ContextMenuView?} */
   static #contextMenuView = null;
   static #contextMenuPresenter = new ContextMenuPresenter();
   /** @type {boolean} */
   static #preferAlignmentAbove;
   /** @type {boolean} */
   static #preferAlignmentLeft;

   static get wasJustClosed() { return this.#contextMenuPresenter.wasJustClosed(); }
   static get wasJustOpened() { return this.#contextMenuPresenter.wasJustOpened(); }
   
   static get preferAlignmentAbove() { return this.#preferAlignmentAbove; }
   static set preferAlignmentAbove(value) { this.#preferAlignmentAbove = value; }
   static get preferAlignmentLeft() { return this.#preferAlignmentLeft; }
   static set preferAlignmentLeft(value) { this.#preferAlignmentLeft = value; }

   /**
    * 
    * @param {ContextMenuEntryPresenter[]} entries 
    * @param {import("../../Utils/RectangleUtils.js").Rectangle?} sourceBounds 
    * @param {boolean} [focusFirstEntry = false]
    */
   static open(entries, sourceBounds, focusFirstEntry = false) {
      this.#render();
      this.#contextMenuPresenter.open(entries, sourceBounds, focusFirstEntry);
   }

   static #render() {
      this.#contextMenuView = cu(this.#contextMenuView, ContextMenuView, document.body, (e, s) => {
         InputManager.default.registerInputEventGroup(ContextMenuView, 2);
         e.inputManager = InputManager.default;
         e.presenter = this.#contextMenuPresenter;
      }, (e, s) => {
         e.preferAlignmentAbove = this.#preferAlignmentAbove;
         e.preferAlignmentLeft = this.#preferAlignmentLeft;
      });
   }   
}