
// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { DialogRequestModel } from "./DialogRequestModel.js";

export class DialogResponseModel {
   get parentRequest() { return this.#parentRequest; }
   get buttonIndex() { return this.#buttonIndex; }
   get textInput() { return this.#textInput; }

   /** @type {DialogRequestModel} */
   #parentRequest;
   /** @type {number?} */
   #buttonIndex;
   /** @type {string?} */
   #textInput;

   /**
    * @param {DialogRequestModel} parentRequest 
    * @param {number?} buttonIndex
    * @param {string?} textInput 
    */
   constructor(parentRequest, buttonIndex, textInput) {
      Assert.class(parentRequest, DialogRequestModel, "parentRequest", true);
      Assert.ifDefined(buttonIndex,
         () => Assert.numberIntegerPositiveOrZero(buttonIndex, "buttonIndex", true), true);
      Assert.ifDefined(textInput,
         () => Assert.string(textInput, "textInput", true), true);

      this.#parentRequest = parentRequest;
      this.#buttonIndex = buttonIndex ?? null;
      this.#textInput = textInput ?? null;
   }
}