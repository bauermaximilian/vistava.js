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

   static get wasJustClosed() { return ContextMenu.#contextMenuPresenter.wasJustClosed(); }
   static get wasJustOpened() { return ContextMenu.#contextMenuPresenter.wasJustOpened(); }
   
   static get preferAlignmentAbove() { return ContextMenu.#preferAlignmentAbove; }
   static set preferAlignmentAbove(value) { ContextMenu.#preferAlignmentAbove = value; }
   static get preferAlignmentLeft() { return ContextMenu.#preferAlignmentLeft; }
   static set preferAlignmentLeft(value) { ContextMenu.#preferAlignmentLeft = value; }

   /**
    * 
    * @param {ContextMenuEntryPresenter[]} entries 
    * @param {import("../../Utils/RectangleUtils.js").Rectangle?} sourceBounds 
    * @param {boolean} [focusFirstEntry = false]
    */
   static open(entries, sourceBounds, focusFirstEntry = false) {
      ContextMenu.#render();
      ContextMenu.#contextMenuPresenter.open(entries, sourceBounds, focusFirstEntry);
   }

   static #render() {
      ContextMenu.#contextMenuView = cu(ContextMenu.#contextMenuView, ContextMenuView, document.body, (e, s) => {
         InputManager.default.registerInputEventGroup(ContextMenuView, 2);
         e.inputManager = InputManager.default;
         e.presenter = ContextMenu.#contextMenuPresenter;
      }, (e, s) => {
         e.preferAlignmentAbove = ContextMenu.#preferAlignmentAbove;
         e.preferAlignmentLeft = ContextMenu.#preferAlignmentLeft;
      });
   }   
}