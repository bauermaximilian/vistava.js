// SPDX-License-Identifier: GPL-3.0-or-later

import { cu } from "../../Utils/BrowserUtils.js";
import { InputManager } from "../Shared/UserInput/InputManager.js";
import { DialogPresenter } from "./DialogPresenter.js";
import { DialogResponseModel } from "./DialogResponseModel.js";
import { DialogView } from "./DialogView.js";

export class Dialog {
   /** @type {DialogView?} */
   static #dialogView = null;
   static #dialogPresenter = new DialogPresenter();

   /**
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   static async showInputDialogAsync(description, title, buttons) {
      Dialog.#render();
      return await Dialog.#dialogPresenter.showInputDialogAsync(description, title, buttons);
   }

   /**
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   static async showInfoAsync(description, title, buttons) {
      Dialog.#render();
      return await Dialog.#dialogPresenter.showInfoAsync(description, title, buttons);
   }

   /**
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   static async showErrorAsync(description, title, buttons) {
      Dialog.#render();
      return await Dialog.#dialogPresenter.showErrorAsync(description, title, buttons);
   }

   static #render() {
      Dialog.#dialogView = cu(Dialog.#dialogView, DialogView, document.body, (e, s) => {
         InputManager.default.registerInputEventGroup(DialogView, 1);
         e.inputManager = InputManager.default;
         e.presenter = Dialog.#dialogPresenter;
      });
   }
}