// SPDX-License-Identifier: GPL-3.0-or-later

import { EventController } from "../../../Shared/Event.js";
import { InputEventsGroup } from "../../Shared/UserInput/InputEventsGroup.js";
import { BrowserUtils } from "../../../Utils/BrowserUtils.js";
import { TileGridView } from "../TileGridView.js";
import { TileGridControlsView } from "./TileGridControlsView.js";

const tagName = "thumbnail-grid-controls";

export class ThumbnailTileGridControlsView extends TileGridControlsView {
   static get tagName() { return tagName; }

   get onTileActivated() { return this.#onTileActivated.event; }
   get onBack() { return this.#onBack.event; }

   /** @template T @typedef {import("../../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
   /** @template T @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
   /** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ClickEventArgs} ClickEventArgs */

   /** @type {EventController<{tileIndex:number}>} */
   #onTileActivated = new EventController();
   /** @type {EventController<void>} */
   #onBack = new EventController();

   constructor() {
      super();     

      this.onInputEventsGroupChanged.subscribe(this.#handleOnInputEventsGroupChanged);
      this.onTileGridViewChanged.subscribe(this.#handleOnTileGridViewChanged);
   }

   /**
    * @param {import("../../../Utils/VectorUtils.js").Vector} position 
    * @returns {number?}
    */
   #updateFocusToPosition(position) {
      if (this.tileGridView?.presenter == null) { return null; }

      let index = this.tileGridView?.getTileIndexByPosition(position) ?? null;
      if (index === null && this.tileGridView.presenter.focussedTileIndex !== null) {
         this.tileGridView.presenter.focusHide();
      } else if (index !== null) {
         this.tileGridView.presenter.focus(index, false);
      }
      return index;
   }

   /** @type {EventHandler<ValueChangedEventArgs<InputEventsGroup>>} */
   #handleOnInputEventsGroupChanged = (args) => {
      args.oldValue?.onClick.unsubscribe(this.#handleOnClick);
      args.oldValue?.onClickSecondary.unsubscribe(this.#handleOnClickSecondary);
      args.oldValue?.onAction.unsubscribe(this.#handleOnAction);

      args.newValue?.onClick.subscribe(this.#handleOnClick);
      args.newValue?.onClickSecondary.subscribe(this.#handleOnClickSecondary);
      args.newValue?.onAction.subscribe(this.#handleOnAction);
   };

   /** @type {EventHandler<ValueChangedEventArgs<TileGridView?>>} */
   #handleOnTileGridViewChanged = (args) => {
      args.oldValue?.onLoadingIndicatorVisibilityChanged.unsubscribe(this.#handleOnLoadingIndicatorVisibilityChanged);

      args.newValue?.onLoadingIndicatorVisibilityChanged.subscribe(this.#handleOnLoadingIndicatorVisibilityChanged);
   };

   #handleOnLoadingIndicatorVisibilityChanged = () => {
      // if (this.tileGridView !== null && this.#queryBarView !== null) {
      //    this.#queryBarView.isLoading = this.tileGridView.loadingIndicatorVisible;
      // }
   };

   /** @type {EventHandler<ClickEventArgs>} */
   #handleOnClick = (args) => {
      if (this.tileGridView?.presenter == null) { return; }

      if (args.noFurtherAction || !this.tileGridView.isWithinBounds(args.position)) { return; }

      let focussedTileIndex = this.#updateFocusToPosition(args.position);
      if (focussedTileIndex !== null) {
         this.#onTileActivated.trigger({ tileIndex: focussedTileIndex });
         args.noFurtherAction = true;
      }
   };

   /** @type {EventHandler<ClickEventArgs>} */
   #handleOnClickSecondary = (args) => {
      if (this.tileGridView?.presenter == null) { return; }

      if (args.noFurtherAction || !this.tileGridView.isWithinBounds(args.position)) { return; }

      this.#updateFocusToPosition(args.position);

      args.noFurtherAction = true;
   }

   /** @type {EventHandler<ActionEventArgs>} */
   #handleOnAction = (args) => {
      if (this.tileGridView?.presenter == null) { return; }

      if (args.noFurtherAction) { return; }

      if (args.action === "confirm" && this.tileGridView.presenter.focussedTileIndex !== null) {
         if (!this.tileGridView.presenter.focusVisible) {
            this.tileGridView.presenter.focus(this.tileGridView.presenter.focussedTileIndex, false);
         } else {
            this.#onTileActivated.trigger({ tileIndex: this.tileGridView.presenter.focussedTileIndex });
         }
         args.noFurtherAction = true;
      } else if (args.action === "back") {
         this.#onBack.trigger();
      } else if (args.action === "fullscreen") {
         BrowserUtils.toggleFullscreen();
      }
   }
}