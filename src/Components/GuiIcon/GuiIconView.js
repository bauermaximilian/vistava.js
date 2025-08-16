// SPDX-License-Identifier: GPL-3.0-or-later

import { PresenterView } from "../Shared/PresenterView.js";
import { cu } from "../../Utils/BrowserUtils.js";
import { GuiIconModel } from "./GuiIconModel.js";
import { GuiIconPresenter } from "./GuiIconPresenter.js";

const tagName = "gui-icon";

/** @extends {PresenterView<GuiIconPresenter>} */
export class GuiIconView extends PresenterView {
   static get tagName() { return tagName; }

   /** @type {HTMLImageElement?} */
   #iconImageElement = null;
   /** @type {HTMLDivElement?} */
   #iconContainerElement = null;

   constructor() {
      super(GuiIconPresenter);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
   }

   #render() {
      if (this.presenter === null) { return; }

      let clipTopPx = this.presenter.model.clipTopPx;
      let clipRightPx = this.presenter.model.clipRightPx;
      let clipBottomPx = this.presenter.model.clipBottomPx;
      let clipLeftPx = this.presenter.model.clipLeftPx;
      let iconSrc = `${this.presenter.model.sourceAbsolute}#${this.presenter.model.icon}`;
      let isInteractive = this.presenter.model.isInteractive;

      this.#iconContainerElement = cu(this.#iconContainerElement, HTMLDivElement, this.root, (e, s) => {
         s.background = "currentColor";
         s.maskClip = "padding-box";
         s.transition = "filter 0.25s";
         s.aspectRatio = "1";
         s.height = "100%";
      }, (e, s) => {
         s.mask = `url(${iconSrc})`;
         s.padding = `${-clipTopPx}px ${-clipRightPx}px ${-clipBottomPx}px ${-clipLeftPx}px`;

         if (isInteractive) {
            e.role = "button";
            s.cursor = "pointer";
         } else {
            e.role = null;
            s.cursor = "";
         }
      });

      this.#iconImageElement = cu(this.#iconImageElement, HTMLImageElement, this.#iconContainerElement, (e, s) => { 
         e.addEventListener("load", this.#handleOnLoaded, { once: true });
         s.opacity = "0";
         s.height = "100%";
         s.display = "block";
      }, (e, s) => {
         e.src = iconSrc;         
         s.margin = `${-clipTopPx}px ${-clipRightPx}px ${-clipBottomPx}px ${-clipLeftPx}px`;
      });
   }

   /** 
    * @type {import("../../Shared/Event").EventHandler<import("../../Shared/Event")
    *    .ValueChangedEventArgs<GuiIconPresenter>>} 
    */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.model.onUpdated.unsubscribe(this.#handleOnModelUpdated);
      args.newValue?.model.onUpdated.subscribe(this.#handleOnModelUpdated);

      this.#render();
   };

   #handleOnLoaded = () => {
      this.root.dispatchEvent(new Event("load", { composed: true, bubbles: true }));
      this.#render();
   }

   /** 
    * @type {import("../../Shared/Event").EventHandler<import("../../Shared/Event")
    *    .FieldsChangedEventArgs<GuiIconModel>>} 
    */
   #handleOnModelUpdated = () => {
      this.#render();
   };
}