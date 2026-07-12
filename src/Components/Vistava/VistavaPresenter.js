// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { ArgumentError } from "../../Errors/ArgumentError.js";
import { EventController } from "../../Shared/Event.js";
import { TileGridLayoutTypes } from "../TileGrid/Shared/TileGridLayoutTypes.js";
import { TileGridPresenter } from "../TileGrid/TileGridPresenter.js";
import { VistavaModel } from "./VistavaModel.js";

/**
 * @typedef {object} VistavaPresenterState
 * @property {string} query The query which specifies the collection content.
 * @property {number} index The current (or starting) index within the collection content.
 * @property {string} view The identifier of the used layout configuration.
 */

/**
 * @typedef {object} VistavaPresenterStateInit 
 * @property {string} [query] The query which specifies the collection content.
 * @property {number} [index] The current (or starting) index within the collection content.
 * @property {string} [view] The identifier of the used layout configuration.
 */

/**
 * @typedef {object} VistavaPresenterStateUpdatedEventArgs
 * @property {string} [newQuery] The query which specifies the collection content.
 * @property {number} [newIndex] The current (or starting) index within the collection content.
 * @property {string} [newView] The identifier of the used layout configuration.
 */

/**
 * @typedef {object} VistavaPresenterExtendStateUpdatedEventArgs
 * @property {boolean} isExtending
 */

export class VistavaPresenter {
   /** @type {VistavaPresenterState} */
   get state() {
      return {
         query: this.#model.query,
         index: this.#grid.focussedTileIndex ?? this.#startIndex,
         view: this.#grid.layout?.type.identifier ??
            this.#layoutTypes.defaultLayoutType.identifier
      };
   }   

   get layout() { return this.#grid.layout; }

   get layoutTypes() { return this.#layoutTypes; }
   set layoutTypes(value) {
      Assert.class(value, TileGridLayoutTypes);
      if (value !== this.#layoutTypes) {
         this.#layoutTypes = value;
         let currentLayoutIdentifier = this.#grid.layout.type.identifier;
         let updatedLayoutType = this.#layoutTypes.getLayoutType(currentLayoutIdentifier) ??
            this.#layoutTypes.defaultLayoutType;
         if (!this.#grid.layout.type.equals(updatedLayoutType)) {
            this.#grid.reset(updatedLayoutType);
         }
      }
   }

   get isExtending() { return this.#isExtending; }

   get focussedTileIndex() { return this.#grid.focussedTileIndex; }

   get onStateUpdated() { return this.#onStateUpdated.event; }
   get onExtendStateUpdated() { return this.#onExtendStateUpdated.event; }
   get onFocusUpdated() { return this.#grid.onFocusUpdated; }

   /** 
    * @template T
    * @typedef {import("../../Shared/CachedCollection.js")
    * .CollectionRetrieverConstructor<T>} CollectionRetrieverConstructor<T>
    */
   /** @typedef {import("../../Utils/VectorUtils.js").Vector} Vector */
   /** @readonly @type {TileGridPresenter} */
   #grid;
   /** @readonly @type {VistavaModel} */
   #model;

   /** @type {TileGridLayoutTypes} */
   #layoutTypes;

   /** @type {Map<string, import("../TileGrid/Shared/TileGridLayout.js").TileGridLayoutSnapshot>} */
   #layoutCache = new Map();

   /** @type {EventController<VistavaPresenterStateUpdatedEventArgs>} */
   #onStateUpdated = new EventController();
   /** @type {EventController<VistavaPresenterExtendStateUpdatedEventArgs>} */
   #onExtendStateUpdated = new EventController();

   /** @type {boolean} */
   #isExtending = false;
   /** @type {number} */
   #startIndex;

   /**
    * @param {CollectionRetrieverConstructor<object>} collectionFactory
    * @param {TileGridLayoutTypes} layoutTypes 
    * @param {Vector} gridSize
    * @param {VistavaPresenterStateInit} [initialState]
    */
   constructor(collectionFactory, layoutTypes, gridSize, initialState) {
      Assert.function(collectionFactory, "collectionFactory");
      Assert.class(layoutTypes, TileGridLayoutTypes, "layoutTypes");
      Assert.vectorPositive(gridSize, "gridSize");
      VistavaPresenter.#assertStateValid(initialState);

      this.#layoutTypes = layoutTypes;
      let layoutType;
      if (initialState?.view != null) {
         layoutType = layoutTypes.getLayoutType(initialState.view);
      }
      layoutType ??= layoutTypes.defaultLayoutType;

      this.#startIndex = initialState?.index ?? 0;

      this.#grid = new TileGridPresenter(layoutType, gridSize);
      this.#model = new VistavaModel(collectionFactory, this.#grid.model);
      if (initialState?.query != null) {
         this.#model.query = initialState.query;
      }

      this.#subscribeEvents();
   }

   reset() {
      this.#unsubscribeEvents();

      this.#layoutCache.clear();
      this.#grid.unsetReferenceLayout();
      this.#grid.reset(undefined, this.#grid.layout.size, undefined);
      this.#model.reset(true);
      this.#startIndex = 0;
      this.#onStateUpdated.trigger({ newIndex: 0, newQuery: "", newView: this.layoutTypes.defaultLayoutType.identifier });

      this.#subscribeEvents();
   }

   /**
    * @param {VistavaPresenterStateInit} state
    */
   updateState(state) {
      VistavaPresenter.#assertStateValid(state);

      this.#unsubscribeEvents();

      try {
         /** @type {VistavaPresenterStateUpdatedEventArgs} */
         let eventArgs = {};

         let stateBeforeUpdate = this.state;
         let stateAfterUpdate = { ...this.state, ...state };
         let cachedReferenceLayout = this.#getCachedLayout(stateAfterUpdate);
         let layoutBeforeUpdate = this.#grid.getReferenceLayout();
         let newLayoutType = state.view != null ? this.#layoutTypes.getLayoutType(state.view) : null;
         let layoutUpdated = false;

         if (state.query !== undefined && this.#model.query !== state.query) {
            eventArgs.newQuery = this.#model.query = state.query;
            if (cachedReferenceLayout !== null &&
               this.#layoutTypes.getLayoutType(stateBeforeUpdate.view)?.restoreLayout && (state?.index ?? 0) > 0) {
               this.#grid.setReferenceLayout(cachedReferenceLayout);
            } else {
               this.#grid.unsetReferenceLayout();
            }
         }

         if (state.view !== undefined && this.#grid.layout?.type !== newLayoutType) {            
            if (newLayoutType === null) {
               throw new ArgumentError("The layout type specified in the state doesn't exist.");
            }

            if (this.#grid.focussedTileIndex !== null) {
               this.#startIndex = this.#grid.focussedTileIndex
            }
            
            this.#grid.reset(newLayoutType, this.#grid.layout.size, cachedReferenceLayout ?? undefined);
            layoutUpdated = true;

            eventArgs.newView = newLayoutType.identifier;
         }

         if (state.index !== undefined && this.#grid.focussedTileIndex !== state.index) {
            if (this.#model.grid.has(state.index)) {
               this.#grid.focus(state.index);
            } else {
               this.#startIndex = state.index;
               this.#model.grid.clear();
               layoutUpdated = true;
            }
            eventArgs.newIndex = state.index;
         }

         if (layoutUpdated && this.#layoutTypes.getLayoutType(stateBeforeUpdate.view)?.restoreLayout) {
            this.#cacheLayout(stateBeforeUpdate, layoutBeforeUpdate);
         }

         this.#onStateUpdated.trigger(eventArgs);
      } finally {
         this.#subscribeEvents();
      }      
   }

   /**
    * Call this method in regular intervals to ensure the visible area of the base tile grid is populated with content
    * while the offscreen content is disposed.
    * @returns {Promise<boolean>} true whether the grid was trimmed or extended, false otherwise.
    */
   async trimOrExtendGridAsync() {
      let trimmedGrid = false, extendedGrid = false;

      if (this.#model.grid.count === 0) {
         this.#updateExtendingStatus(true);
         extendedGrid = await this.#model.addAsync(this.#startIndex ?? 0);
         if (!extendedGrid) {
            this.#updateExtendingStatus(false);
         }
      } else {
         let recommendations = this.#grid.getAddAndTrimRecommendations();
         if (recommendations.tileIndexToRemove !== null) {
            this.#model.remove(recommendations.tileIndexToRemove);
            trimmedGrid = true;
            this.#updateExtendingStatus(false);
         } else {
            if ((this.#grid.layout.tilesCount - this.#grid.layout.tilesWithDimensionsCount) < 3) {
               extendedGrid = recommendations.tileIndexToAddPrimary !== null &&
                  await this.#model.addAsync(recommendations.tileIndexToAddPrimary);
               if (extendedGrid) {
                  this.#updateExtendingStatus(true);
               }
               else if (recommendations.tileIndexToAddSecondary !== null) {
                  extendedGrid = await this.#model.addAsync(recommendations.tileIndexToAddSecondary);
                  if (extendedGrid) {
                     this.#updateExtendingStatus(true);
                  }
               } else {
                  this.#updateExtendingStatus(false);
               }
            } else {
               this.#updateExtendingStatus(true);
            }
         }
      }

      return trimmedGrid || extendedGrid;
   }

   /**
    * @param {import("../TileGrid/TileGridPresenter.js").TileGridPresenterAssignable} target 
    * @package This method should only be used by the view using this instance.
    */
   bindBaseTileGrid(target) {
      Assert.defined(target, "target");
      if (target.presenter === undefined) {
         throw new ArgumentError();
      }

      if (target.presenter !== this.#grid) {
         target.presenter = this.#grid;
      }
   }

   /**
    * @param {boolean} isExtending 
    */
   #updateExtendingStatus(isExtending) {
      if (this.#isExtending !== isExtending) {
         this.#isExtending = isExtending;
         this.#onExtendStateUpdated.trigger({ isExtending: this.#isExtending });
      }
   }

   /**
    * 
    * @param {VistavaPresenterState} state 
    * @param {import("../TileGrid/Shared/TileGridLayout.js").TileGridLayoutSnapshot} layout 
    */
   #cacheLayout(state, layout) {
      let key = this.#getCachedLayoutStateKey(state);
      this.#layoutCache.set(key, layout);
   }

   /**
    * @param {VistavaPresenterStateInit} state 
    * @returns {import("../TileGrid/Shared/TileGridLayout.js").TileGridLayoutSnapshot?}
    */
   #getCachedLayout(state) {
      let key = this.#getCachedLayoutStateKey(state);
      let layout = this.#layoutCache.get(key);
      if (state.index != null && layout?.tiles[state.index]?.tilePosition != null) {
         return layout;
      } else {
         return null;
      }
   }

   /**
    * @param {any} state 
    * @returns {string}
    */
   #getCachedLayoutStateKey(state) {
      return `${encodeURIComponent(state.view)}&${encodeURIComponent(state.query)}`;
   }

   #subscribeEvents() {
      this.#grid.onFocusUpdated.subscribe(this.#handleOnPresenterFocusUpdated)
      this.#model.onQueryUpdated.subscribe(this.#handleOnModelQueryUpdated);
      this.#grid.onConfigurationChanged.subscribe(this.#handleOnPresenterConfigurationChanged);
      this.#grid.onTileMounted.subscribe(this.#handleOnPresenterTileMounted);
   }

   #unsubscribeEvents() {
      this.#grid.onFocusUpdated.unsubscribe(this.#handleOnPresenterFocusUpdated)
      this.#model.onQueryUpdated.unsubscribe(this.#handleOnModelQueryUpdated);
      this.#grid.onConfigurationChanged.unsubscribe(this.#handleOnPresenterConfigurationChanged);
      this.#grid.onTileMounted.unsubscribe(this.#handleOnPresenterTileMounted);
   }

   /**
    * @param {VistavaPresenterStateInit} [state]
    */
   static #assertStateValid(state) {
      if (state == null) { return; }
      if (state.query !== undefined) { Assert.string(state.query, "state.query"); }
      if (state.index !== undefined) { Assert.numberIntegerPositiveOrZero(state.index, "state.index"); }
      if (state.view !== undefined) { Assert.string(state.view, "state.view"); }
   }

   #handleOnPresenterFocusUpdated = () =>
      this.#onStateUpdated.trigger({ newIndex: this.#grid.focussedTileIndex ?? this.#startIndex });

   #handleOnModelQueryUpdated = () =>
      this.#onStateUpdated.trigger({ newQuery: this.#model.query });

   #handleOnPresenterConfigurationChanged = () =>
      this.#onStateUpdated.trigger({ newView: this.#grid.layout?.type.identifier });

   /** @type {import("../../Shared/Event.js").EventHandler<import("../TileGrid/TileGridPresenter.js").TileGridItemUpdatedEventArgs>} */
   #handleOnPresenterTileMounted = (args) => {
      if (this.#grid.focussedTileIndex === null && this.state.index === args.tileIndex) {
         this.#grid.focus(args.tileIndex, false);
      }
   };
}