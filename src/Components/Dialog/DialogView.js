// SPDX-License-Identifier: GPL-3.0-or-later

import { cu } from "../../Utils/BrowserUtils.js";
import { RU } from "../../Utils/RectangleUtils.js";
import { InteractivePresenterView } from "../Shared/InteractivePresenterView.js";
import { InputDeviceTypes } from "../Shared/UserInput/InputDeviceType.js";
import { InputEventsGroup } from "../Shared/UserInput/InputEventsGroup.js";
import { DialogPresenter } from "./DialogPresenter.js";
import { DialogRequestModel } from "./DialogRequestModel.js";

const tagName = "dialog-modal";

/** @extends {InteractivePresenterView<DialogPresenter>} */
export class DialogView extends InteractivePresenterView {
   static get tagName() { return tagName; }

   /** @type {HTMLDivElement?} */
   #overlayElement = null;
   /** @type {HTMLDivElement?} */
   #modalElement = null;
   /** @type {HTMLHeadingElement?} */
   #modalHeaderElement = null;
   /** @type {HTMLDivElement?} */
   #modalContentElement = null;
   /** @type {HTMLParagraphElement?} */
   #modalContentTextElement = null;
   /** @type {HTMLInputElement?} */
   #modalContentInputElement = null;
   /** @type {HTMLButtonElement[]} */
   #modalButtonElements = [];

   /** @type {DialogRequestModel?} */
   #currentRequest = null;

   /**
    * @template TEventArgs
    * @typedef {import("../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs> 
    */
   
   /** @template T @typedef {import("../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */

   constructor() {
      super(DialogPresenter);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
      this.onInputEventsGroupChanged.subscribe(this.#handleOnInputEventsGroupChanged);
   }

   connectedCallback() {
      let styleSheet = new CSSStyleSheet();
      styleSheet.insertRule(`button {
            appearance: none;
            background-color: rgb(20, 20, 20);
            border: 1px solid rgba(27, 27, 27, 0.15);
            border-radius: 6px;
            box-sizing: border-box;
            color: rgb(182, 181, 181);
            cursor: pointer;
            font-size: medium;
            font-weight: 500;
            line-height: 1.5em;
            padding: 6px 16px;
            transition: background-color 0.2s;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
         }`);
      
      styleSheet.insertRule(`button:hover {
            background-color: rgb(26, 26, 26);
            text-decoration: none;
            transition-duration: 0.1s;
         }`);

      styleSheet.insertRule(`button:active {
            background-color: rgb(33, 33, 33);
            transition: none 0s;
         }`);

      styleSheet.insertRule(`button:focus {
            outline: 1px transparent;
         }`);

      styleSheet.insertRule(`button:before {
            display: none;
         }`);
      
      this.root.adoptedStyleSheets.push(styleSheet);

      this.#render();
   }

   #render() {
      this.#overlayElement = cu(this.#overlayElement, HTMLDivElement, this.root, (e, s) => {
         s.position = "absolute";
         s.top = "0";
         s.zIndex = "100";
         s.width = "100vw";
         s.height = "100vh";
         s.display = "flex";
         s.justifyContent = "center";
         s.alignItems = "center";
         s.flexDirection = "column";
         s.color = "#b7b7b7";
         s.fontFamily = "-apple-system, \"Segoe UI\", Roboto, sans-serif";
      }, (e, s) => {
         s.display = this.#currentRequest !== null ? "flex" : "none";
      });

      this.#modalElement = cu(this.#modalElement, HTMLDivElement, this.#overlayElement, (e, s) => {
         s.display = "flex";
         s.flexDirection = "column";
         s.boxShadow = "0px 0px 10px 1px rgba(0,0,0,0.69)";
         s.borderRadius = "6px";
         s.border = "1px solid rgb(69 69 69)";
         s.width = "80vw";
         s.overflow = "clip";
      });

      this.#modalHeaderElement = cu(this.#modalHeaderElement, HTMLHeadingElement, this.#modalElement, (e, s) => {
         s.backgroundColor = "rgb(20,20,20)";
         s.margin = "0";
         s.padding = "5px 20px 5px";
         s.textAlign = "center";
         s.fontWeight = "600";
         s.fontSize = "larger";
         s.lineHeight = "1.5em";
      }, (e, s) => {
         e.innerText = this.#currentRequest?.title ?? "";
      });

      this.#modalContentElement = cu(this.#modalContentElement, HTMLDivElement, this.#modalElement, (e, s) => {
         s.backgroundColor = "#1e1e1e";
         s.margin = "0";
         s.padding = "0px 20px 20px 20px";
      });

      this.#modalContentTextElement = cu(this.#modalContentTextElement, HTMLParagraphElement, this.#modalContentElement,
         (e, s) => {
         }, (e, s) => {
            e.innerText = this.#currentRequest?.description ?? "";
      });

      this.#modalContentInputElement = cu(this.#modalContentInputElement, HTMLInputElement, this.#modalContentElement,
         (e, s) => {
            s.display = "block";
            s.width = "100%";
            s.boxSizing = "border-box";
            s.minHeight = "40px";
            s.lineHeight = "20px";
            s.marginBottom = "1em";
            s.padding = "8px";
            s.borderRadius = "6px";
            s.marginBottom = "1em";
            s.minHeight = "2em";
            s.border = "1px solid rgb(182, 181, 181)";
            s.backgroundColor = "inherit";
            s.color = "inherit";
            s.fontSize = "medium";
            e.name = "userInput";
         }, (e, s) => {
            e.value = "";
            s.display = this.#currentRequest?.hasTextInput === true ? "block" : "none";
      });
      
      let buttonsCount = (this.#currentRequest?.buttons?.length ?? 0);
      if (buttonsCount > 0) {
         for (let i = 0; i < buttonsCount; i++) {
            this.#modalButtonElements[i] = cu(this.#modalButtonElements[i], HTMLButtonElement,
               this.#modalContentElement, (e, s) => { 
                  s.float = "right";
                  s.marginLeft = "1em";
               }, (e, s) => {
                  e.innerText = this.#currentRequest?.buttons[i] ?? "";
               });
         }
      } else if (this.#modalButtonElements.length > 0) {
         for (let modalButtonElement of this.#modalButtonElements) {
            modalButtonElement.remove();
         }
      }
   }

   /**
    * @param {number?} buttonIndex 
    */
   #submitDialog(buttonIndex) {
      this.#currentRequest?.resolve(buttonIndex, this.#modalContentInputElement?.value ?? null);
      this.#currentRequest = null;
      this.#render();
   }

   /** @type {EventHandler<ValueChangedEventArgs<InputEventsGroup>>} */
   #handleOnInputEventsGroupChanged = (args) => {
      args.oldValue?.onAction.unsubscribe(this.#handleOnInputAction);
      args.oldValue?.onClick.unsubscribe(this.#handleOnClick);
      args.oldValue?.onClickSecondary.unsubscribe(this.#handleOnInputEvent);
      args.oldValue?.onClickTertiary.unsubscribe(this.#handleOnInputEvent);
      args.oldValue?.onDoubleClick.unsubscribe(this.#handleOnInputEvent);
      args.oldValue?.onMove.unsubscribe(this.#handleOnInputEvent);
      args.oldValue?.onScroll.unsubscribe(this.#handleOnInputEvent);

      args.newValue?.onAction.subscribe(this.#handleOnInputAction);
      args.newValue?.onClick.subscribe(this.#handleOnClick);
      args.newValue?.onClickSecondary.subscribe(this.#handleOnInputEvent);
      args.newValue?.onClickTertiary.subscribe(this.#handleOnInputEvent);
      args.newValue?.onDoubleClick.subscribe(this.#handleOnInputEvent);
      args.newValue?.onMove.subscribe(this.#handleOnInputEvent);
      args.newValue?.onScroll.subscribe(this.#handleOnInputEvent);
   };

   /** @type {EventHandler<import("../../Shared/Event.js").ValueChangedEventArgs<DialogPresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onDialogCreated.unsubscribe(this.#handleOnDialogCreated);
      args.newValue?.onDialogCreated.subscribe(this.#handleOnDialogCreated);
   };

   /** @type {EventHandler<import("./DialogRequestModel.js").DialogCreatedEventArgs>} */
   #handleOnDialogCreated = (args) => {
      this.#currentRequest = args.request;
      this.#render();
   };

   /** @type {EventHandler<import("../Shared/UserInput/InputEventsGroupController.js").ClickEventArgs>} */
   #handleOnClick = (args) => {
      if (this.#currentRequest !== null) {
         for (let i = 0; i < this.#modalButtonElements.length; i++) {
            let button = this.#modalButtonElements[i];
            let buttonRect = RU.new(button.getBoundingClientRect());
            if (RU.contains(buttonRect, args.position)) {
               this.#submitDialog(i);
               args.noFurtherAction = true;
               return;
            }
         }

         if (this.#modalContentInputElement !== null) {
            if (RU.contains(RU.new(this.#modalContentInputElement.getBoundingClientRect()), args.position)) {
               this.#modalContentInputElement.focus();
               args.noFurtherAction = true;
               return;
            }
         }
      }
   };

   #handleOnInputAction = (/** @type{import("../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} */ args) => {
      if (this.#currentRequest !== null) {
         args.noFurtherAction = true;
         if (args.action == "confirm") {
            this.#submitDialog(0);
         } else if (args.action == "back" && args.inputDeviceType !== InputDeviceTypes.keyboard) {
            this.#submitDialog(1);            
         }
      }
   };

   #handleOnInputEvent = (/** @type{{noFurtherAction:boolean}} */ args) => {
      if (this.#currentRequest !== null) {
         args.noFurtherAction = true;
      }
   };
}