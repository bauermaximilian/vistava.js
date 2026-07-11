// SPDX-License-Identifier: GPL-3.0-or-later

import { InputEventsGroup } from "../Shared/UserInput/InputEventsGroup.js";
import { cu, e } from "../../Utils/BrowserUtils.js";
import { RU } from "../../Utils/RectangleUtils.js";
import { VU } from "../../Utils/VectorUtils.js";
import { ContextMenuPresenter } from "./ContextMenuPresenter.js";
import { ContextMenuEntryModel } from "./ContextMenuEntryModel.js";
import { ContextMenuEntryView } from "./ContextMenuEntryView.js";
import { InteractivePresenterView } from "../Shared/InteractivePresenterView.js";

const tagName = "context-menu";

/** @extends {InteractivePresenterView<ContextMenuPresenter>} */
export class ContextMenuView extends InteractivePresenterView {
   /** @typedef {import("../../Utils/VectorUtils.js").Vector} Vector */

   /** @typedef {import("../../Utils/RectangleUtils.js").Rectangle} Rectangle */

   /**
    * @template TEventArgs
    * @typedef {import("../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs> 
    */
   
   /** @template T @typedef {import("../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ClickEventArgs} ClickEventArgs */   
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").MoveEndEventArgs} MoveEndEventArgs */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ScrollEventArgs} ScrollEventArgs */
   
   /** @type {boolean} */
   #preferAlignmentLeft = false;
   /** @type {boolean} */
   #preferAlignmentAbove = false;

   /** @type {HTMLElement} */
   #menuElement;
   /** @type {Map<ContextMenuEntryModel, ContextMenuEntryView>} */
   #menuEntries = new Map();
   
   static get tagName() { return tagName; }
   
   get preferAlignmentLeft() { return this.#preferAlignmentLeft; }
   set preferAlignmentLeft(value) { this.#preferAlignmentLeft = value; }
   get preferAlignmentAbove() { return this.#preferAlignmentAbove; }
   set preferAlignmentAbove(value) { this.#preferAlignmentAbove = value; }

   constructor() {
      super(ContextMenuPresenter);

      this.#menuElement = cu(null, HTMLMenuElement, this.root, (e, s) => {
         s.backgroundColor = "#1e1e1e";
         s.listStyleType = "none";
         s.padding = "0";
         s.position = "fixed";
         s.color = "#b7b7b7";
         s.fontFamily = "-apple-system, 'Segoe UI', Roboto, sans-serif";
         s.boxSizing = "border-box";
         s.width = "max-content";
         s.zIndex = "20";
         s.boxShadow = "0px 0px 10px 1px rgba(0,0,0,0.69)";
         s.visibility = "hidden";
         s.margin = "1px";
         s.borderRadius = "8px";
         s.border = "1px solid rgb(69 69 69)";
         s.overflow = "hidden";
      });

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
      this.onInputEventsGroupChanged.subscribe(this.#handleOnInputEventsGroupChanged);
   }

   /**
    * @param {Rectangle?} sourceBounds
    * @param {Vector} menuSizeNatural 
    * @param {Rectangle} parentContainerBounds
    * @returns {Rectangle}
    */
   #calculateMenuBounds(sourceBounds, menuSizeNatural, parentContainerBounds) {
      let sourceIsElement = (sourceBounds != null && sourceBounds.width > 0 && sourceBounds.height > 0);
      let menuSizeAdjusted = sourceIsElement ?
         VU.new(Math.max(sourceBounds?.width ?? 0, menuSizeNatural.x), menuSizeNatural.y) : menuSizeNatural;

      let verticalAlignX = sourceBounds?.x ?? 0;
      let verticalAlignAboveTargetY = (sourceBounds?.y ?? 0) - menuSizeNatural.y - (sourceBounds?.height ?? 0);
      let verticalAlignBelowTargetY = (sourceBounds?.y ?? 0) + (sourceBounds?.height ?? 0);
      let horizontalAlignLeftOfTargetX = (sourceBounds?.x ?? 0) - menuSizeNatural.x + (sourceBounds?.width ?? 0);

      let menuBoundsBelowLeft = RU.new(horizontalAlignLeftOfTargetX, verticalAlignBelowTargetY,
         menuSizeAdjusted.x, menuSizeAdjusted.y);
      let menuBoundsBelowRight = RU.new(verticalAlignX, verticalAlignBelowTargetY,
         menuSizeAdjusted.x, menuSizeAdjusted.y);
      let menuBoundsAboveLeft = RU.new(horizontalAlignLeftOfTargetX, verticalAlignAboveTargetY,
         menuSizeAdjusted.x, menuSizeAdjusted.y);
      let menuBoundsAboveRight = RU.new(verticalAlignX, verticalAlignAboveTargetY,
         menuSizeAdjusted.x, menuSizeAdjusted.y);
         
      let candidates = [];
      if (this.#preferAlignmentLeft) {
         if (this.#preferAlignmentAbove) {
            candidates.push(menuBoundsAboveLeft);
            candidates.push(menuBoundsAboveRight);
         } else {
            candidates.push(menuBoundsBelowLeft);
            candidates.push(menuBoundsBelowRight);            
         }
      } else {
         if (this.#preferAlignmentAbove) {
            candidates.push(menuBoundsAboveRight);
            candidates.push(menuBoundsAboveLeft);
         } else {
            candidates.push(menuBoundsBelowRight);            
            candidates.push(menuBoundsBelowLeft);
         }
      }

      for (let candidate of candidates) {
         if (RU.contains(parentContainerBounds, candidate)) {
            return candidate;
         }
      }
      return candidates[0];
   }

   /** @type {EventHandler<import("../../Shared/Event.js").ValueChangedEventArgs<ContextMenuPresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onMenuElementsChanged.unsubscribe(this.#handleOnMenuElementsChanged);
      args.oldValue?.onMenuLocationChanged.unsubscribe(this.#handleOnMenuLocationChanged);
      args.newValue?.onMenuElementsChanged.subscribe(this.#handleOnMenuElementsChanged);
      args.newValue?.onMenuLocationChanged.subscribe(this.#handleOnMenuLocationChanged);
   };

   /** @type {EventHandler<void>} */
   #handleOnMenuElementsChanged = () => {
      while (this.#menuElement.hasChildNodes()) {
         let menuEntryView = this.#menuElement.lastChild;
         if (menuEntryView instanceof ContextMenuEntryView) {
            if (menuEntryView.presenter != null) {
               menuEntryView.presenter.parentPresenter = null;
               menuEntryView.presenter = null;
            }
         }
         menuEntryView?.remove();
      }
      this.#menuEntries.clear();

      if (this.presenter != null) {
         for (let menuEntryPresenter of this.presenter.entries) {
            let menuEntryView = e(ContextMenuEntryView, (e, s) => {
               e.presenter = menuEntryPresenter;
            });
            this.#menuEntries.set(menuEntryPresenter.model, menuEntryView);
            this.#menuElement.appendChild(menuEntryView);
         }
      }

      this.#menuElement.style.visibility = this.#menuEntries.size > 0 ? "visible" : "hidden";
   };

   /** @type {EventHandler<void>} */
   #handleOnMenuLocationChanged = () => {
      this.#menuElement.style.width = "max-content";

      let menuBoundsNatural = this.#menuElement.getBoundingClientRect();
      let menuSizeNatural = VU.new(menuBoundsNatural.width, menuBoundsNatural.height);

      let newMenuBounds = this.#calculateMenuBounds(this.presenter?.model.sourceBounds ?? null,
         menuSizeNatural, RU.new(0, 0, window.innerWidth, window.innerHeight));
      
      this.#menuElement.style.left = `${newMenuBounds.x}px`;
      this.#menuElement.style.top = `${newMenuBounds.y}px`;
      this.#menuElement.style.width =  `${newMenuBounds.width}px`;
   };

   /** @type {EventHandler<ValueChangedEventArgs<InputEventsGroup>>} */
   #handleOnInputEventsGroupChanged = (args) => {
      args.oldValue?.onClick.unsubscribe(this.#handleOnClick);
      args.oldValue?.onAction.unsubscribe(this.#handleOnAction);
      args.oldValue?.onMove.unsubscribe(this.#handleOnCloseContextMenu);
      args.oldValue?.onScroll.unsubscribe(this.#handleOnCloseContextMenu);

      args.newValue?.onClick.subscribe(this.#handleOnClick);   
      args.newValue?.onAction.subscribe(this.#handleOnAction); 
      args.newValue?.onMove.subscribe(this.#handleOnCloseContextMenu);  
      args.newValue?.onScroll.subscribe(this.#handleOnCloseContextMenu);   
   };

   /**
    * 
    * @param {MoveEndEventArgs|ScrollEventArgs} args 
    */
   #handleOnCloseContextMenu = (args) => {
      if (this.presenter?.model.entries != null && this.presenter.model.entries.length > 0 &&
         (!("duration" in args && typeof(args.duration) === "number") || (args.duration > 0.25))) {
         this.presenter.close();
      }
   };

   /** @type {EventHandler<ClickEventArgs>} */
   #handleOnClick = (args) => {
      if (this.presenter === null) return;

      let targetEntry = null;
      for (let entry of this.#menuElement.children) {
         if (entry instanceof ContextMenuEntryView) {
            let entryBounds = entry.getBoundingClientRect();
            if (args.position.x < entryBounds.right && args.position.x > entryBounds.left &&
               args.position.y < entryBounds.bottom && args.position.y > entryBounds.top) {
               targetEntry = entry;
               break;
            }
         }
      }

      if (targetEntry?.presenter != null) {
         args.noFurtherAction = true;
         this.presenter.activateEntry(targetEntry.presenter.model);
      } else if (this.presenter.isCurrentlyOpen) {
         args.noFurtherAction = true;
         this.presenter.close();
      }
   };

   /** @type {EventHandler<ActionEventArgs>} */
   #handleOnAction = (args) => {
      if (this.presenter === null) { return; }

      if (this.presenter.isCurrentlyOpen) {
         args.noFurtherAction = true;
         if (args.action === "up") {
            this.presenter.moveFocus(-1);
         } else if (args.action === "down") {
            this.presenter.moveFocus(1);
         } else if (args.action === "confirm" && 
            this.presenter.focussedEntry !== null) {
            this.presenter.activateEntry(this.presenter.focussedEntry.model);
         } else {
            this.presenter.close();
         }
      }
   };
}