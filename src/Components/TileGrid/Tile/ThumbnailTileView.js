// SPDX-License-Identifier: GPL-3.0-or-later

import { cu } from "../../../Utils/BrowserUtils.js";
import { VU } from "../../../Utils/VectorUtils.js";
import { GuiIconPresenter } from "../../GuiIcon/GuiIconPresenter.js";
import { GuiIconView } from "../../GuiIcon/GuiIconView.js";
import { TileFocuses } from "../Shared/TileFocusType.js";
import { TileDataField } from "./TileDataField.js";
import { TilePresenter } from "./TilePresenter.js";
import { TileView } from "./TileView.js";

const tagName = "thumbnail-tile-view";

/** @extends {TileView<HTMLImageElement|GuiIconView>} */
export class ThumbnailTileView extends TileView {
   static get tagName() { return tagName; }

   get mediaContent() { return this.#thumbnailElement; }

   /** @type {HTMLImageElement|GuiIconView|null} */
   #thumbnailElement = null;
   /** @type {HTMLParagraphElement?} */
   #labelElement = null;
   /** @type {HTMLDivElement?} */
   #overlayElement = null;
   /** @type {GuiIconView?} */
   #overlayIconElement = null;
   /** @type {HTMLParagraphElement?} */
   #overlayTextElement = null;

   /** @type {GuiIconPresenter?} */
   #thumbnailIconPresenter = null;
   /** @type {GuiIconPresenter?} */
   #overlayIconPresenter = null;
   
   /** @type {boolean} */
   #loadingFailed = false;

   /**
    * @template {any} TEventArgs
    * @typedef {import("../../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs>
    */

   /** 
    * @template TValue
    * @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<TValue>} ValueChangedEventArgs<TValue>
    */

   constructor() {
      super();

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
   }

   connectedCallback() {
      this.#render();
   }

   #render() {
      this.role = "button";
      this.style.cursor = "pointer";

      this.#renderOverlay();
      this.#renderThumbnailElement();
      this.#renderLabel(this.#thumbnailElement instanceof GuiIconView);
   }

   #renderThumbnailElement() {
      if (this.presenter === null) { return; }

      let hasFocus = this.presenter.focus !== TileFocuses.none;
      let hasVisibleFocus = this.presenter.focus === TileFocuses.visible;
      let transitionTime = this.presenter.focus === TileFocuses.visible ? "0s" : "0.125s";   
      
      let thumbnailType = this.presenter?.model.getDataAsString(TileDataField.thumbnailType) ?? null;
      let thumbnailUrl = this.presenter?.model.getDataAsString(TileDataField.thumbnailUrl) ?? null;
      let iconName = this.presenter?.model.getDataAsString(TileDataField.iconName) ?? "cross";

      /** @param {CSSStyleDeclaration} s */
      let initializeSharedStyles = s => {
         s.setProperty("-webkit-user-select", "none");
         s.userSelect = "none";
         s.borderRadius = "16px";
         s.boxSizing = "border-box";
         s.display = "block";
         s.transition = `filter ${transitionTime} ease-in, color ${transitionTime} ease-in`;
      };
      /** @param {CSSStyleDeclaration} s @param {number} visibleFocusOpacity @param {number} invisibleFocusOpacity */
      let updateSharedStyles = (s, visibleFocusOpacity, invisibleFocusOpacity) => {
         if (this.presenter === null) { return; }
         let focusOpacity = hasFocus ? (
            hasVisibleFocus ? visibleFocusOpacity : invisibleFocusOpacity) : 0;
         let focusBlur = 12 * focusOpacity;
         s.filter = `drop-shadow(0px 0px ${focusBlur}px rgba(216,216,216,${focusOpacity}))`;         
      };

      let disposeThumbnailElement = (/** @type {HTMLImageElement | GuiIconView | null} */ e) => {
         e?.removeEventListener("load", this.#handleOnContentLoadingSucceeded);
         e?.removeEventListener("error", this.#handleOnContentLoadingFailed);
      };

      if (thumbnailType?.startsWith("image") && thumbnailUrl !== null && !this.#loadingFailed) {
         this.#thumbnailElement = cu(this.#thumbnailElement, HTMLImageElement, this.root, (e, s) => {
            initializeSharedStyles(s);
            e.addEventListener("load", this.#handleOnContentLoadingSucceeded, { once: true });
            e.addEventListener("error", this.#handleOnContentLoadingFailed, { once: true });
            e.src = thumbnailUrl;
            s.width = "100%";
            s.objectFit = "cover";
         }, (e, s) => {
            updateSharedStyles(s, 1, 0.4);
         }, disposeThumbnailElement, true);
      } else if (iconName !== null && iconName.trim().length > 0) {
         this.#thumbnailElement = cu(this.#thumbnailElement, GuiIconView, this.root, (e, s) => {
            initializeSharedStyles(s);
            e.addEventListener("load", this.#handleOnContentLoadingSucceeded, { once: true });
            e.addEventListener("error", this.#handleOnContentLoadingFailed, { once: true });
            e.presenter = this.#thumbnailIconPresenter ??= new GuiIconPresenter();
            e.presenter.model.icon = iconName;
         }, (e, s) => {            
            updateSharedStyles(s, 1, 0.4);
            s.color = hasFocus ? "#d8d8d8" : "#b7b7b7"
         }, disposeThumbnailElement, true);
      } else {
         disposeThumbnailElement(this.#thumbnailElement);
         this.#thumbnailElement?.remove();
         this.#thumbnailElement = null;
      }
   }

   #renderOverlay() {
      let mediaType = this.presenter?.model.getDataAsString(TileDataField.mediaType) ?? null;
      if (mediaType?.startsWith("video")) {
         this.#overlayElement = cu(this.#overlayElement, HTMLDivElement, this.root, (e, s) => {
            let duration = this.presenter?.model.getDataAsNumber(TileDataField.mediaDuration);
            if (duration != null) {
               this.#overlayTextElement = cu(this.#overlayTextElement, HTMLParagraphElement, e, (e, s) => {
                  let minutes = Math.floor(duration / 60).toLocaleString(undefined, { minimumIntegerDigits: 2 });
                  let seconds = Math.round(duration % 60).toLocaleString(undefined, { minimumIntegerDigits: 2 });
                  e.innerText = `${minutes}:${seconds}`;

                  s.fontFamily = "-apple-system, \"Segoe UI\", Roboto, sans-serif";
                  s.fontSize = "14px";
                  s.fontWeight = "600";
                  s.setProperty("-webkit-user-select", "none");
                  s.userSelect = "none";
                  s.margin = "0";
               });
            }

            this.#overlayIconElement = cu(this.#overlayIconElement, GuiIconView, e, (e, s) => {
               e.presenter = this.#overlayIconPresenter ??= new GuiIconPresenter();
               e.presenter.model.icon = "play";
               s.width = "20px";
               s.height = "20px";               
            });

            s.color = "#d8d8d8";
            s.position = "absolute";
            s.display = "flex";
            s.alignItems = "center";
            s.right = "8px";
            s.transform = "translateY(-22px)";
            s.filter = "drop-shadow(0px 0px 1px black)";
         }, null, null, true);
      } else {
         this.#overlayElement?.remove();
         this.#overlayElement = null;
         this.#overlayIconElement = null;
         this.#overlayTextElement = null;
      }
   }

   /**
    * @param {boolean} reserveLabelSpace 
    */
   #renderLabel(reserveLabelSpace) {
      const paddingTop = 8;
      const paddingRight = 12;
      const paddingBottom = 0;
      const paddingLeft = 12;

      let labelText = this.presenter?.model.getDataAsString(TileDataField.label, false) ?? null;
      if ((labelText === null || labelText.trim().length === 0) && reserveLabelSpace) {
         labelText = "\u00a0";
      }

      if (labelText !== null) {
         this.#labelElement = cu(this.#labelElement, HTMLParagraphElement, this.root, (e, s) => {
            s.fontFamily = "-apple-system, \"Segoe UI\", Roboto, sans-serif";
            s.fontSize = "14px";
            s.fontWeight = "600";
            s.color = "#b7b7b7";
            s.setProperty("-webkit-user-select", "none");
            s.userSelect = "none";
            s.paddingTop =  `${paddingTop}px`;
            s.paddingRight =  `${paddingRight}px`;
            s.paddingBottom =  `${paddingBottom}px`;
            s.paddingLeft =  `${paddingLeft}px`;
            s.margin = "0";
            s.textRendering = "optimizeSpeed";
            s.textOverflow = "ellipsis";
            s.overflow = "hidden";
            s.textAlign = "center"
            e.innerText = labelText;
         });
      } else {
         this.#labelElement?.remove();
         this.#labelElement = null;
      }
   }

   #handleOnContentLoadingSucceeded = () => {
      if (this.presenter === null) { return; }

      let bounds = this.getBoundingClientRect();
      if (bounds !== null && bounds.width > 0 && bounds.height > 0) {
         this.presenter.contentSize = VU.new(bounds.width, bounds.height);
      }
   };

   #handleOnContentLoadingFailed = () => {
      if (this.presenter === null) { return; }

      this.#loadingFailed = true;
      this.#renderThumbnailElement();
      let bounds = this.getBoundingClientRect();
      this.presenter.contentError = new Error("The resource couldn't be loaded.");
      this.presenter.contentSize = VU.new(bounds.width, bounds.height);
   };

   /** @type {EventHandler<ValueChangedEventArgs<import("../Shared/TileFocusType.js").TileFocus>>} */
   #handleOnFocusTypeChanged = () => {
      this.#render();
   };

   /** @type {EventHandler<ValueChangedEventArgs<TilePresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onFocusUpdated.unsubscribe(this.#handleOnFocusTypeChanged);
      args.newValue?.onFocusUpdated.subscribe(this.#handleOnFocusTypeChanged);
   };
}