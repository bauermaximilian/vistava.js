// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { EventController } from "../../Shared/Event.js";
import { PresenterView } from "../Shared/PresenterView.js";
import { InputManager } from "../Shared/UserInput/InputManager.js";
import { AsyncUtils } from "../../Utils/AsyncUtils.js";
import { cu } from "../../Utils/BrowserUtils.js";
import { GalleryTileGridControlsView } from "../TileGrid/Controls/GalleryTileGridControlsView.js";
import { ThumbnailTileGridControlsView } from "../TileGrid/Controls/ThumbnailTileGridControlsView.js";
import { TileGridControlsView } from "../TileGrid/Controls/TileGridControlsView.js";
import { TileView } from "../TileGrid/Tile/TileView.js";
import { TileGridView } from "../TileGrid/TileGridView.js";
import { VistavaPresenter } from "./VistavaPresenter.js";
import { VistavaLayoutTypes } from "./VistavaLayoutTypes.js";

const tagName = "vistava-viewer";

/**
 * @typedef {object} TileActionEventArgs
 * @property {TileView} tile
 */

/**
 * @typedef {object} VistavaQueryChangeRequestedEventArgs
 * @property {string} query
 */

/** @extends {PresenterView<VistavaPresenter>} */
export class VistavaView extends PresenterView {
   static get tagName() { return tagName; }   

   get layoutTypes() { return this.#layoutTypes; }
   set layoutTypes(value) { 
      Assert.class(value, VistavaLayoutTypes);
      this.#layoutTypes = value;
      this.#tryApplyViewTypes();
   }

   get onTilePrimaryAction() { return this.#onTilePrimaryAction.event; }
   get onTileSecondaryAction() { return this.#onTileSecondaryAction.event; }
   get onQueryChangeRequested() { return this.#onQueryChangeRequested.event; }
   get onBack() { return this.#onBack.event; }

   get inputManager() { return this.#inputManager; }

   /** @template T @typedef {import("../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
   /** @template T @typedef {import("../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */
   /** @typedef {import("../Shared/UserInput/InputManager.js").TargetElementDetacher} TargetElementDetacher */

   /** @type {EventController<TileActionEventArgs>} */
   #onTilePrimaryAction = new EventController();
   /** @type {EventController<TileActionEventArgs>} */
   #onTileSecondaryAction = new EventController();
   /** @type {EventController<void>} */
   #onBack = new EventController();
   /** @type {EventController<VistavaQueryChangeRequestedEventArgs>} */
   #onQueryChangeRequested = new EventController();
   
   /** @type {VistavaLayoutTypes?} */
   #layoutTypes = null;
   /** @type {HTMLDivElement?} */
   #container = null;
   /** @type {TileGridView?} */
   #gridView = null;
   /** @type {TileGridControlsView?} */
   #gridControlsView = null;
   /** @type {InputManager} */
   #inputManager = new InputManager();

   /** @type {ClassType<TileView>?} */
   #tileViewType = null;
   /** @type {ClassType<TileGridControlsView>?} */
   #tileGridControlsViewType = null;

   /** @type {Promise<void>?} */
   #trimOrExtendPromise = null;
   /** @type {boolean} */
   #shouldRunTrimOrExtendPromise = false;
   /** @type {TargetElementDetacher?} */
   #inputManagerDetacher = null;
   /** @type {number} */
   #lastGridModifiedTimestamp = 0;

   constructor() {
      super(VistavaPresenter, true);

      this.#inputManager.registerInputEventGroup(TileGridControlsView, 2);
      this.#inputManager.registerInputEventGroup(TileView, 3);
      this.#inputManager.registerInputEventGroup(TileGridView, 4);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);      
   } 

   connectedCallback() {
      this.#inputManager.attach(document.body);
      this.#startTrimAndExtend();
      this.#render();
   }

   disconnectedCallback() {
      this.#inputManagerDetacher?.();
      this.#stopTrimAndExtend();
      this.#gridView?.onCursorVisibilityChangeRequested.unsubscribe(this.#handleOnCursorVisibilityChangeRequested);
      super.disconnectedCallback();
   }

   /**
    * @param {number} tileIndex 
    * @returns {TileView?}
    */
   getTileByIndex(tileIndex) {
      return this.#gridView?.getTileByIndex(tileIndex) ?? null;
   }

   #startTrimAndExtend() {
      if (!this.#shouldRunTrimOrExtendPromise) {
         this.#shouldRunTrimOrExtendPromise = true;
         this.#trimOrExtendPromise ??= this.#runTrimAndExtendAsync();
      }
   }

   #stopTrimAndExtend() {
      this.#shouldRunTrimOrExtendPromise = false;
      this.#trimOrExtendPromise = null;
   }

   async #runTrimAndExtendAsync() {
      const cycleWaitDefault = 5;
      const cycleWaitSleep = 500;
      const cycleSleepTreshold = 2000;

      while (this.#shouldRunTrimOrExtendPromise) {
         let gridModified = false;
         if (this.#gridView !== null && this.presenter !== null) {
            gridModified = await this.presenter?.trimOrExtendGridAsync();
         }
         if (gridModified) {
            this.#lastGridModifiedTimestamp = performance.now();
         }
         let cycleWait = ((performance.now() - this.#lastGridModifiedTimestamp) < cycleSleepTreshold) ?
            cycleWaitDefault : cycleWaitSleep;
         await AsyncUtils.sleep(cycleWait);
      }
   }

   #render() {
      if (this.#tileViewType === null || this.presenter === null) { return; }
      
      this.#container = cu(this.#container, HTMLDivElement, this.root, (e, s) => {
         s.display = "flex";
         s.flexDirection = "column";
         s.width = "100%";
         s.height = "100%";
         s.overflow = "hidden";
         s.position = "relative";
      });

      this.#gridView = cu(this.#gridView, TileGridView, this.#container, (e, s) => {
         s.display = "block";
         s.flexGrow = "1";
         s.zIndex = "1";
         s.position = "relative";
         s.overflow = "hidden";

         e.onCursorVisibilityChangeRequested.subscribe(this.#handleOnCursorVisibilityChangeRequested);
      }, (e, s) => {
         this.presenter?.bindBaseTileGrid(e);
         e.tileViewType = this.#tileViewType;
         e.inputManager ??= this.#inputManager;
         this.#applyCursorVisibility();
      });

      let disposeView = (/** @type {TileGridControlsView} */ e) => {
         e.tileGridView = null;
         e.inputManager = null;
      
         if (e instanceof ThumbnailTileGridControlsView) {
            e.onTileActivated.unsubscribe(this.#handleOnTileActivated);
            e.onBack.unsubscribe(this.#handleOnBack);
         } else if (e instanceof GalleryTileGridControlsView) {
            e.onBack.unsubscribe(this.#handleOnBack);
         }
      };
      if (this.#tileGridControlsViewType !== null) {
         this.#gridControlsView = cu(this.#gridControlsView, this.#tileGridControlsViewType, this.#container, (e, s) => {
            s.display = "block";
            e.tileGridView = this.#gridView;
         
            if (e instanceof ThumbnailTileGridControlsView) {
               e.onTileActivated.subscribe(this.#handleOnTileActivated);
               e.onBack.subscribe(this.#handleOnBack);
            } else if (e instanceof GalleryTileGridControlsView) {
               e.onBack.subscribe(this.#handleOnBack);
            }
         }, (e, s) => {
            e.inputManager ??= this.#inputManager;
            this.#applyCursorVisibility();
         }, disposeView);
      } else if (this.#gridControlsView !== null) {
         disposeView(this.#gridControlsView);
         this.#gridControlsView = null;
      }
   }

   #tryApplyViewTypes() {
      if (this.#layoutTypes === null || this.presenter === null) { return; }

      let newViewType = this.presenter.state.view != null ?
         this.#layoutTypes.getViewType(this.presenter.state.view) :
         this.#layoutTypes.defaultViewType;
      
      if (newViewType === null) {
         throw new InvalidOperationError("The specified layout type was not associated with any view types.");
      }

      this.#tileViewType = newViewType.tileViewType;
      this.#tileGridControlsViewType = newViewType.controlsType;

      this.#render();
   }

   #applyCursorVisibility() {
      if (this.#gridView !== null) {
         this.#gridView.style.cursor = this.#gridView.cursorVisible ? "default" : "none";
         if (this.#gridControlsView !== null) {
            this.#gridControlsView.style.cursor = this.#gridView.style.cursor;
         }
      }
   }

   /** @type {EventHandler<ValueChangedEventArgs<VistavaPresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onStateUpdated.unsubscribe(this.#handleOnPresenterStateUpdated);
      args.oldValue?.onExtendStateUpdated.unsubscribe(this.#handleOnPresenterExtendStateUpdated);

      args.newValue?.onStateUpdated.subscribe(this.#handleOnPresenterStateUpdated);
      args.newValue?.onExtendStateUpdated.subscribe(this.#handleOnPresenterExtendStateUpdated);

      if (this.#gridView !== null) {
         this.presenter?.bindBaseTileGrid(this.#gridView);
      }

      if (args.newValue != null && this.#layoutTypes !== null) {
         args.newValue.layoutTypes = this.#layoutTypes;
      }

      if (args.newValue?.state?.view != null && this.#layoutTypes !== null) {
         this.#tryApplyViewTypes();
      }
   };

   #handleOnPresenterExtendStateUpdated = () => {
      if (this.presenter !== null && this.#gridView !== null) {
         this.#gridView.loadingIndicatorVisible = this.presenter.isExtending;
      }
   };

   /** @type {EventHandler<import("./VistavaPresenter.js").VistavaPresenterStateUpdatedEventArgs>} */
   #handleOnPresenterStateUpdated = () => {      
      this.#tryApplyViewTypes();
   };

   /** @type {EventHandler<{tileIndex:number}>} */
   #handleOnTileActivated = (args) => {
      let tile = this.#gridView?.getTileByIndex(args.tileIndex) ?? null;
      if (tile !== null) {
         this.#onTilePrimaryAction.trigger({ tile });
      }
   };

   #handleOnBack = () => {
      this.#onBack.trigger();
   };

   #handleOnCursorVisibilityChangeRequested = () => {
      this.#applyCursorVisibility();
   };
}