// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { AbstractMemberNotImplementedError } from "../../../Errors/AbstractMemberNotImplementedError.js";
import { EventController } from "../../../Shared/Event.js";
import { InteractiveView } from "../../Shared/InteractiveView.js";
import { TileView } from "../Tile/TileView.js";
import { TileGridPresenter } from "../TileGridPresenter.js";
import { TileGridView } from "../TileGridView.js";

/**
 * @typedef {object} FocussedTileUpdatedEventArgs
 * @property {TileView?} oldTileView
 * @property {TileView?} newTileView
 * @property {boolean} viewChanged
 * @property {boolean} focusTypeChanged
 * @property {boolean} mediaContentStatusChanged
 */

/**
 * @abstract Must override static string getter {@link tagName}.
 * Provides virtual base implementation for {@link disconnectedCallback} that unassigns any currently 
 * assigned {@link inputManager}.
 * Provides closed {@link ShadowRoot} with protected getter {@link root} and {@link inputManager} 
 * getter/setter and {@link inputEventsGroup} getter with event trigger on value change.
 * @extends {InteractiveView}
 */
export class TileGridControlsView extends InteractiveView {
   /** @type {ClassType<TileView>} */
   static get tileViewType() { throw new AbstractMemberNotImplementedError("static tileViewType"); }

   get tileGridView() { return this.#tileGridView; }
   set tileGridView(value) {
      if (value !== this.#tileGridView) {
         Assert.ifDefined(value, () => Assert.class(value, TileGridView));

         let oldValue = this.#tileGridView;
         this.#detatchTileGridView();

         this.#tileGridView = value ?? null;
         this.#attachTileGridView();

         this.#onTileGridViewChanged.trigger({ oldValue, newValue: value });
      }
   }

   get focussedTile() { return this.#focussedTileView; }

   get onFocussedTileViewUpdated() { return this.#onFocussedTileViewUpdated.event; }
   get onTileGridViewChanged() { return this.#onTileGridViewChanged.event; } 
   
   /** @template T @typedef {import("../../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
   /** @template T @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
   /** @typedef {import("../TileGridPresenter.js").TileGridFocusUpdatedEventArgs} TileGridFocusUpdatedEventArgs */
   /** @template T @typedef {import("../../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {EventController<ValueChangedEventArgs<TileGridView?>>} */
   #onTileGridViewChanged = new EventController();
   /** @type {EventController<FocussedTileUpdatedEventArgs>} */
   #onFocussedTileViewUpdated = new EventController();

   /** @type {TileGridView?} */
   #tileGridView = null;
   /** @type {TileView?} */
   #focussedTileView = null;

   /**
    * @param {ClassType<HTMLElement>} [inputEventsGroupTargetType] Gets the type which is used to retrieve the 
    * correct {@link inputEventsGroup} from the assigned {@link inputManager}. If unspecified, the class
    * type of the {@link TileGridControlsView} class is used.
    * @param {boolean} [openShadowRoot=false] 
    */
   constructor(inputEventsGroupTargetType, openShadowRoot = false) {
      super(inputEventsGroupTargetType ?? TileGridControlsView, openShadowRoot);
   } 

   #attachTileGridView() {
      if (this.#tileGridView === null) { return; }

      this.#tileGridView.onPresenterChanged.subscribe(this.#handleOnTileGridViewPresenterChanged);
      if (this.#tileGridView.presenter !== null) {
         this.#handleOnTileGridViewPresenterChanged({
            oldValue: null,
            newValue: this.#tileGridView.presenter
         });      
      }

      this.tileGridView?.onTileViewUpdated.subscribe(this.#handleOnTileGridTileViewUpdated);
   }

   #detatchTileGridView() {
      if (this.#tileGridView === null) { return; }

      this.#tileGridView.onPresenterChanged.unsubscribe(this.#handleOnTileGridViewPresenterChanged);
      if (this.#tileGridView.presenter !== null) {
         this.#handleOnTileGridViewPresenterChanged({
            oldValue: this.#tileGridView.presenter,
            newValue: null
         });
      }

      this.tileGridView?.onTileViewUpdated.unsubscribe(this.#handleOnTileGridTileViewUpdated);
   }

   /** @type {EventHandler<ValueChangedEventArgs<TileGridPresenter>>} */
   #handleOnTileGridViewPresenterChanged = (args) => {
      args.oldValue?.onFocusUpdated.unsubscribe(this.#handleOnTileGridFocusUpdated);
      
      args.newValue?.onFocusUpdated.subscribe(this.#handleOnTileGridFocusUpdated);
   };

   /** @type {EventHandler<import("../TileGridView.js").TileGridViewItemUpdatedEventArgs>} */
   #handleOnTileGridTileViewUpdated = (args) => {
      if (this.#tileGridView?.presenter?.focussedTileIndex === args.tileIndex) {
         this.#focussedTileView = args.newView;

         args.oldView?.presenter?.onContentUpdated.unsubscribe(this.#handleOnTileMediaContentUpdated);
         args.newView?.presenter?.onContentUpdated.subscribe(this.#handleOnTileMediaContentUpdated);

         this.#onFocussedTileViewUpdated.trigger({
            focusTypeChanged: true,
            mediaContentStatusChanged: true,
            viewChanged: true,
            oldTileView: args.oldView,
            newTileView: args.newView
         });
      }
   };

   /** @type {EventHandler<TileGridFocusUpdatedEventArgs>} */
   #handleOnTileGridFocusUpdated = (args) => {
      if (this.#tileGridView === null) { return; }
      
      let oldTileView = this.#focussedTileView;
      let newTileView = null;
      let viewChanged = args.currentlyFocussedTileIndex !== args.previouslyFocussedTileIndex;
      let focusTypeChanged = args.currentFocusType !== args.previousFocusType;
      if (viewChanged) {
         this.#focussedTileView?.onMediaContentUpdated.unsubscribe(this.#handleOnTileMediaContentUpdated);

         newTileView = this.#focussedTileView = args.currentlyFocussedTileIndex !== null ?
            this.#tileGridView.getTileByIndex(args.currentlyFocussedTileIndex) : null;
         this.#focussedTileView?.onMediaContentUpdated.subscribe(this.#handleOnTileMediaContentUpdated);
      }

      if (viewChanged || focusTypeChanged) {
         this.#onFocussedTileViewUpdated.trigger({
            focusTypeChanged, viewChanged, oldTileView, newTileView, mediaContentStatusChanged: false
         });
      }
   };

   #handleOnTileMediaContentUpdated = () => {
      this.#onFocussedTileViewUpdated.trigger({
         oldTileView: this.#focussedTileView,
         newTileView: this.#focussedTileView,
         focusTypeChanged: false,
         viewChanged: false,
         mediaContentStatusChanged: true
      });
   };
}