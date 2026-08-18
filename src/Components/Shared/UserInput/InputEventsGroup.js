// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { InputEventsGroupController } from "./InputEventsGroupController.js";

export class InputEventsGroup {
   /** @type {InputEventsGroupController} */
   #controller;
 
   get onMoveStart() { return this.#controller.onMoveStart.event; }
   get onMove() { return this.#controller.onMove.event; }
   get onMoveEnd() { return this.#controller.onMoveEnd.event; }
   get onClick() { return this.#controller.onClick.event; }
   get onDoubleClick() { return this.#controller.onDoubleClick.event; }
   get onClickSecondary() { return this.#controller.onClickSecondary.event; }
   get onClickTertiary() { return this.#controller.onClickTertiary.event; }
   get onScrollStart() { return this.#controller.onScrollStart.event; }
   get onScroll() { return this.#controller.onScroll.event; }
   get onScrollEnd() { return this.#controller.onScrollEnd.event; }   
   get onAction() { return this.#controller.onAction.event; }
 
   get inputManager() { return this.#controller.inputManager; }
   get targetType() { return this.#controller.targetType; }
 
   /**
    * @param {InputEventsGroupController} inputEventsController
    */
   constructor(inputEventsController) {
      Assert.class(inputEventsController, InputEventsGroupController, "inputEventsController");
      this.#controller = inputEventsController;
   }
}