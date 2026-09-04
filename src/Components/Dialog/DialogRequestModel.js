// SPDX-License-Identifier: GPL-3.0-or-later

import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { Assert } from "../../Shared/Assert.js";
import { EventController } from "../../Shared/Event.js";
import { DialogResponseModel } from "./DialogResponseModel.js";

/**
 * @typedef {object} DialogCreatedEventArgs
 * @property {DialogRequestModel} request
 */

/**
 * @typedef {object} DialogResolvedEventArgs
 * @property {DialogResponseModel} response
 */

export class DialogRequestModel {
   get title() { return this.#title; }
   get description() { return this.#description; }
   get buttons() { return this.#buttons; }
   get isErrorType() { return this.#isErrorType; }
   get hasTextInput() { return this.#hasTextInput; }

   get response() { return this.#response; }

   get onDialogResolved() { return this.#onDialogResolved.event; }

   /** @type {string} */
   #title;
   /** @type {string} */
   #description;
   /** @type {string[]} */
   #buttons;
   /** @type {boolean} */
   #isErrorType;
   /** @type {boolean} */
   #hasTextInput;

   /** @type {DialogResponseModel?} */
   #response = null;

   /** @type {EventController<DialogResolvedEventArgs>} */
   #onDialogResolved = new EventController();

   /**
    * 
    * @param {string} description 
    * @param {string} [title]
    * @param {string[]} [buttons]
    * @param {boolean} [isErrorType=false]
    * @param {boolean} [hasTextInput=false]
    */
   constructor(description, title, buttons, isErrorType, hasTextInput) {
      Assert.string(description, "description", true);

      this.#description = description;

      this.#title = title ?? "Dialog";
      this.#buttons = buttons ?? ["OK"];
      this.#hasTextInput = hasTextInput ?? false;
      this.#isErrorType = isErrorType ?? false;
   }

   /**
    * @param {number?} buttonIndex
    * @param {string?} textInput 
    * @throws {InvalidOperationError}
    */
   resolve(buttonIndex, textInput) {
      if (this.#response == null) {
         this.#response = new DialogResponseModel(this, buttonIndex, textInput);
         this.#onDialogResolved.trigger({ response: this.#response });
      } else {
         throw new InvalidOperationError("The current dialog was already resolved.");
      }
   }
}