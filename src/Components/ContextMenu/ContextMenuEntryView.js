// SPDX-License-Identifier: GPL-3.0-or-later

import { cu } from "../../Utils/BrowserUtils.js";
import { PresenterView } from "../Shared/PresenterView.js";
import { GuiIconPresenter } from "../GuiIcon/GuiIconPresenter.js";
import { GuiIconView } from "../GuiIcon/GuiIconView.js";
import { ContextMenuEntryModel } from "./ContextMenuEntryModel.js";
import { ContextMenuEntryPresenter } from "./ContextMenuEntryPresenter.js";

const tagName = "context-menu-entry";

/** @extends {PresenterView<ContextMenuEntryPresenter>} */
export class ContextMenuEntryView extends PresenterView {
   static get tagName() { return tagName; }

   /** 
    * @template TEventArgs
    * @typedef {import("../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs> 
    */

   /** @readonly @type {HTMLLIElement} */
   #element;
   /** @type {HTMLSpanElement?} */
   #elementLabel = null;
   /** @type {HTMLElement?} */
   #elementIcon = null;
   /** @type {HTMLHRElement?} */
   #elementSeparator = null;
   
   constructor() {
      super(ContextMenuEntryPresenter);

      this.#element = cu(null, HTMLLIElement, this.root, (e, s) => {
         s.userSelect = "none";
         s.display = "flex";
         s.fontSize = "18px";
         s.borderBottom = "1px solid #181818";
      });

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
   }

   /** @type {EventHandler<import("../../Shared/Event.js").ValueChangedEventArgs<ContextMenuEntryPresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onFocusChanged.unsubscribe(this.#handleOnFocusChanged);
      args.oldValue?.model.onUpdated.unsubscribe(this.#handleOnModelUpdated);

      args.newValue?.onFocusChanged.subscribe(this.#handleOnFocusChanged);
      args.newValue?.model.onUpdated.subscribe(this.#handleOnModelUpdated);

      if (args.newValue !== null) {
         this.#updateIconElement();
         this.#updateLabelElement();
         this.#updateSeparatorElement();
         this.#updateMainElement();
      }
   };

   /** @type {EventHandler<import("./ContextMenuEntryPresenter.js").ContextMenuEntryFocusChangedEventArgs>} */
   #handleOnFocusChanged = () => {
      this.#updateMainElement();
   };

   /** @type {EventHandler<import("../../Shared/Event.js").FieldsChangedEventArgs<ContextMenuEntryModel>>} */
   #handleOnModelUpdated = (args) => {
      let labelUpdated = args.keys.includes("label");
      let iconUpdated = args.keys.includes("iconLabel") || args.keys.includes("iconName") ||
         args.keys.includes("iconUrl");
      let elementUpdated = args.keys.includes("disabled");
      
      if (labelUpdated || iconUpdated || elementUpdated) {
         this.#updateIconElement();
         this.#updateLabelElement();
         this.#updateSeparatorElement();
         this.#updateMainElement();
      }
   };

   #updateLabelElement() {
      const labelMarginForWithIcon = "0";
      const labelMarginForWithoutIcon = "1.25em";
      const label = this.presenter?.model.label ?? null;
      const hasIcon = this.presenter?.hasIcon ?? null;

      if (label !== null && hasIcon !== null) {
         this.#elementLabel = cu(this.#elementLabel, HTMLSpanElement, this.#element, (e, s) => {
            e.innerText = label;
         }, (e, s) => {
            s.marginLeft = hasIcon ? labelMarginForWithIcon : labelMarginForWithoutIcon;
         });
      } else {
         this.#elementLabel?.remove();
         this.#elementLabel = null;
      }
   }

   #updateIconElement() {
      const iconUrl = this.presenter?.model.iconUrl ?? null;
      const iconName = this.presenter?.model.iconName ?? null;
      const iconLabel = this.presenter?.model.iconLabel ?? null;

      if (iconUrl !== null) {
         this.#elementIcon = cu(this.#elementIcon, HTMLImageElement, this.#element, (e, s) => {
            e.src = iconUrl;
            s.width = "1em";
            s.marginRight = "0.25em";
         }, null, null, true);
      } else if (iconName !== null) {
         this.#elementIcon = cu(this.#elementIcon, GuiIconView, this.#element, (e, s) => {
            e.presenter ??= new GuiIconPresenter();
            e.presenter.model.icon = iconName;
            s.width = "1em";
            s.marginRight = "0.25em";
         }, null, null, true);
      } else if (iconLabel !== null) {
         this.#elementIcon = cu(this.#elementIcon, HTMLSpanElement, this.#element, (e, s) => {
            s.width = "1em";
            s.marginRight = "0.25em";
            e.textContent = iconLabel;
         }, null, null, true);
      } else {
         this.#elementIcon?.remove();
         this.#elementIcon = null;
      }
   }

   #updateSeparatorElement() {
      if (this.presenter?.isSeparator) {
         this.#elementSeparator = cu(this.#elementSeparator, HTMLHRElement, this.#element, (e, s) => {
            s.width = "100%";
            s.border = "1pt solid black";
            s.margin = "0";
         });
      } else {
         this.#elementSeparator?.remove();
         this.#elementSeparator = null;
      }
   }

   #updateMainElement() {
      const disabledPointerStyle = "initial";
      const enabledPointerStyle = "pointer";
      const disabledLabelOpacity = "50%";
      const enabledLabelOpacity = "100%";
      const normalStylePadding = "0.5em 1.75em 0.5em 0.5em";
      const separatorStylePadding = "0.25em 0.25em 0.25em 0.25em";
      const normalBackgroundColor = "initial";
      const focussedBackgroundColor = "#2b2b2b";
      const isDisabledNotSeparator = this.presenter?.isSeparator && this.presenter?.model.disabled === true;

      if (this.#elementLabel !== null) {
         this.#elementLabel.style.opacity = isDisabledNotSeparator ?
            disabledLabelOpacity : enabledLabelOpacity;
      }
      this.#element.style.cursor = isDisabledNotSeparator ?
         disabledPointerStyle : enabledPointerStyle;
      this.#element.style.padding = this.presenter?.isSeparator ?
         separatorStylePadding : normalStylePadding;
      this.#element.style.backgroundColor = this.presenter?.focussed ?
         focussedBackgroundColor : normalBackgroundColor;
   }
}