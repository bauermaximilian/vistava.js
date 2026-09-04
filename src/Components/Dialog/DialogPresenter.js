// SPDX-License-Identifier: GPL-3.0-or-later

import { EventController } from "../../Shared/Event.js";
import { DialogRequestModel } from "./DialogRequestModel.js";
import { DialogResponseModel } from "./DialogResponseModel.js";

export class DialogPresenter {
   get onDialogCreated() { return this.#onDialogCreated.event; }

   /** @type {EventController<import("./DialogRequestModel").DialogCreatedEventArgs>} */
   #onDialogCreated = new EventController();

   /** @type {DialogRequestModel?} */
   #currentRequest = null;

   /**
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   async showInputDialogAsync(description, title, buttons) {
      return await this.#showDialogAsync(new DialogRequestModel(description, title,
         buttons ?? ["OK", "Cancel"], false, true));
   }

   /**
    * 
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   async showErrorAsync(description, title, buttons) {
      return await this.#showDialogAsync(new DialogRequestModel(description, title,
         buttons ?? ["OK"], false, false));
   }

   /**
    * 
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @returns {Promise<DialogResponseModel>}
    */
   async showInfoAsync(description, title, buttons) {
      return await this.#showDialogAsync(new DialogRequestModel(description, title,
         buttons ?? ["OK"], false, false));
   }

   /**
    * @param {DialogRequestModel} request 
    * @returns {Promise<DialogResponseModel>}
    */
   async #showDialogAsync(request) {
      if (this.#currentRequest !== null) {
         this.#currentRequest.resolve(null, null);
      }

      this.#currentRequest = request;
      this.#onDialogCreated.trigger({ request });

      return new Promise(resolve => {
         /** @type {import("../../Shared/Event").EventHandler<import("./DialogRequestModel").DialogResolvedEventArgs>} */
         let handleOnDialogResolved = (args) => {
            request.onDialogResolved.unsubscribe(handleOnDialogResolved);
            this.#currentRequest = null;
            resolve(args.response);
         };
         request.onDialogResolved.subscribe(handleOnDialogResolved);
      });
   }
}