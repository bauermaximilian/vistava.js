// SPDX-License-Identifier: GPL-3.0-or-later

import { AgentArrival } from "../Shared/Animation/AgentArrival.js";
import { AgentArrivalMomentum } from "../Shared/Animation/AgentArrivalMomentum.js";
import { AgentCollection } from "../Shared/Animation/AgentCollection.js";
import { Assert } from "../../Shared/Assert.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { EventController } from "../../Shared/Event.js";
import { RateLimiter } from "../../Shared/RateLimiter.js";
import { InteractivePresenterView } from "../Shared/InteractivePresenterView.js";
import { InputEventsGroup } from "../Shared/UserInput/InputEventsGroup.js";
import { InputManager } from "../Shared/UserInput/InputManager.js";
import { BrowserUtils, cu } from "../../Utils/BrowserUtils.js";
import { RU } from "../../Utils/RectangleUtils.js";
import { VU } from "../../Utils/VectorUtils.js";
import { TileFlows } from "./Shared/TileFlowType.js";
import { TileFocuses } from "./Shared/TileFocusType.js";
import { TileView } from "./Tile/TileView.js";
import { TileGridPresenter } from "./TileGridPresenter.js";
import { InputDeviceTypes } from "../Shared/UserInput/InputDeviceType.js";

/**
 * @typedef {object} TileGridViewItemUpdatedEventArgs
 * @property {number} tileIndex
 * @property {TileView?} oldView
 * @property {TileView?} newView
 */

/**
 * @typedef {object} TileGridFocusMoveRequestHandledEventArgs
 * @property {number} horizontalTileOffset
 * @property {number} verticalTileOffset
 * @property {boolean} requestHandledSuccessfully
 */

const tagName = "tile-grid";

const allTilesInvalidatedIndex = -1;

/** 
 * @extends {InteractivePresenterView<TileGridPresenter>}
 * @implements {TileGridPresenterAssignable}
 */
export class TileGridView extends InteractivePresenterView {
   static get tagName() { return tagName; }

   get tileViewType() { return this.#tileViewType; }
   set tileViewType(value) {
      if (this.#tileViewType !== value) {
         Assert.classType(value);
         this.#tileViewType = value;
         this.#invalidatedTileIndices.add(allTilesInvalidatedIndex);
      }      
   }

   get loadingIndicatorVisible() { return this.#loadingIndicatorVisible; }
   set loadingIndicatorVisible(value) {
      if (value !== this.#loadingIndicatorVisible) {
         this.#loadingIndicatorVisible = value;
         this.#onLoadingIndicatorVisibilityChanged.trigger();
      }
   }

   get cursorVisible() { return this.#cursorVisible; }

   /** Occurs after the view of a specific tile was added, removed or changed its type. */
   get onTileViewUpdated() { return this.#onTileViewUpdated.event; }

   /** 
    * Occurs after a request to move the focussed tile inside the tile grid was completed,
    * either successfully or not (e.g. when the corners of the grid were reached). 
    */
   get onFocusMoveRequestHandled() { return this.#onFocusMoveRequestHandled.event; }

   get onLoadingIndicatorVisibilityChanged() { return this.#onLoadingIndicatorVisibilityChanged.event; }

   get onCursorVisibilityChangeRequested() { return this.#onCursorVisibilityChangeRequested.event; }

   /**
    * @typedef {object} TileGridViewProperties
    * @property {number} gridStart
    * @property {number} gridEnd
    * @property {number} gridWidth
    * @property {number} totalLength
    * @property {number} visibleLength
    * @property {boolean} movementLocked
    * @property {TileFlow} tileFlow
    */

   /** @typedef {import("./TileGridPresenter.js").TileGridPresenterAssignable} TileGridPresenterAssignable */
   /** @typedef {import("./Shared/TileFlowType").TileFlow} TileFlow */
   /** @template T @typedef {import("../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
   /** @template T @typedef {import("../../Shared/Event").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
   /** @typedef {import("../../Utils/RectangleUtils.js").Rectangle} Rectangle */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ScrollStartEventArgs} ScrollStartEventArgs */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ScrollEventArgs} ScrollEventArgs */
   /** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").ScrollEndEventArgs} ScrollEndEventArgs */
	/** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").MoveEventArgs} MoveEventArgs */
	/** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").MoveEndEventArgs} MoveEndEventArgs */
	/** @typedef {import("../Shared/UserInput/InputEventsGroupController.js").MoveStartEventArgs} MoveStartEventArgs */
   /** @template T @typedef {import("../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {ClassType<TileView>?} */
   #tileViewType = null;

   /** @type {Rectangle?} */
   #bounds = null;
   /** @type {boolean} */
   #tileUpdateAnimationEnabled = false;
   /** @type {Set<number>} */
   #invalidatedTileIndices = new Set();
   /** @type {number?} */
   #animationHandle = null;
   /** @type {boolean} */
   #moveFocusIntoViewOnNextMount = false;

   /** @type {boolean} */
   #loadingIndicatorVisible = false;

   /** @type {boolean} */
   #cursorVisible = true;

   /** @readonly @type {TileGridViewMovementController} */
   #movementController;
   /** @readonly @type {ResizeObserver} */
   #resizeObserver;
   /** @readonly @type {RateLimiter} */
   #resizeLimiter = new RateLimiter(500, 1);

   /** @type {EventController<TileGridViewItemUpdatedEventArgs>} */
   #onTileViewUpdated = new EventController();
   /** @type {EventController<TileGridFocusMoveRequestHandledEventArgs>} */
   #onFocusMoveRequestHandled = new EventController();
   /** @type {EventController<void>} */
   #onLoadingIndicatorVisibilityChanged = new EventController();
   /** @type {EventController<void>} */
   #onCursorVisibilityChangeRequested = new EventController();

   /** @readonly @type {Map<number,TileView>} */
   #tilesByModelIndices = new Map();
   
   constructor() {
      super(TileGridPresenter);

      this.#resizeObserver = new ResizeObserver(this.#handleOnResized);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
      this.onInputManagerChanged.subscribe(this.#handleOnInputManagerChanged);

      this.#movementController = new TileGridViewMovementController();
      this.#movementController.onFocusMoved.subscribe(this.#handleOnMovementControllerFocusMoveRequest);
      this.#movementController.onGridMoved.subscribe(this.#handleOnMovementControllerGridMoveRequest);
   }

   connectedCallback() {
      this.#resizeObserver.observe(this);
      this.#tryUpdateLayout();
      this.#enableTileUpdateAnimation();
   }

   disconnectedCallback() {
      this.#resizeObserver.unobserve(this);
      this.#tryUpdateLayout();
      this.#disableTileUpdateAnimation();
   }

   /**
    * @package
    * @returns {TileGridViewProperties}
    */
   calculateGridProperties() {
      let gridStart = this.presenter?.layout.startPosition ?? 0;
      let gridEnd = this.presenter?.layout.endPosition ?? 0;
      let hasEmptyColumns = this.presenter?.layout.hasEmptyColumns ?? true;
      let hasLoadingTiles = this.presenter === null ? true :
         (this.presenter.layout.tilesWithDimensionsCount !== this.presenter.layout.tilesCount);

      return {
         gridStart: gridStart,
         gridEnd: gridEnd,
         gridWidth: this.presenter?.layout.columnsWidth ?? 0,
         visibleLength: this.presenter?.layout.containerLength ?? 0,
         totalLength: gridEnd - gridStart,
         tileFlow: this.presenter?.layout.type?.tileFlow ?? TileFlows.vertical,
         movementLocked: (hasEmptyColumns && hasLoadingTiles)
      };
   }

   /**
    * @param {number} tileIndex 
    * @returns {TileView?}
    */
   getTileByIndex(tileIndex) {
      Assert.numberPositiveOrZero(tileIndex, "tileIndex");
      return this.#tilesByModelIndices.get(tileIndex) ?? null;
   }

   /**
    * This method can be rather expensive and should not be used where performance is critical.
    * @param {import("../../Utils/VectorUtils.js").Vector} clientPosition 
    * @returns {number?}
    */
   getTileIndexByPosition(clientPosition) {
      Assert.vector(clientPosition, "clientPosition");

      let bounds = this.getBoundingClientRect();
      let offset = VU.new(bounds.left, bounds.top);
      let relativePosition = VU.sub(clientPosition, offset);
      let index = this.presenter?.layout.getByPosition(relativePosition) ?? null;

      return index;
   }

   /**
    * @param {boolean} [skipAnimation=false]
    * @returns {boolean}
    */
   moveFocussedTileIntoVisibleArea(skipAnimation=false) {
      if (this.presenter?.focussedTileIndex == null ||
         this.presenter.layout.hasEmptyColumns) {
         return false;
      }

      let currentVisibility = this.presenter.layout.getTileVisibility(this.presenter.focussedTileIndex);
      if (currentVisibility !== null && currentVisibility < 1) {
         let offset = this.presenter.layout.getDistanceToVisibleArea(this.presenter.focussedTileIndex);
         if (offset !== null && offset !== 0) {
            this.#movementController.resetAnimation();
            if (skipAnimation) {
               this.presenter?.move(offset, false);
            } else {
               this.#movementController.animateMovement(offset);
            }
            return true;
         }
      }
      return false;
   }

   #enableTileUpdateAnimation() {
      if (!this.#tileUpdateAnimationEnabled) {
         this.#tileUpdateAnimationEnabled = true;
         if (this.#animationHandle === null) {
            this.#animationHandle = requestAnimationFrame(this.#handleOnTileUpdateAnimationFrameRequested);
         }
      }
   }

   #disableTileUpdateAnimation() {
      this.#tileUpdateAnimationEnabled = false;
   }

   /**
    * @param {DOMRect} [bounds]
    */
   #tryUpdateLayout(bounds) {
      if (this.presenter === null) {
         return;
      }

      if (this.isConnected && this.presenter?.layout.type != null) {
         bounds ??= this.getBoundingClientRect();
         let boundsRectangle = RU.new(bounds);
         if (!RU.equals(boundsRectangle, this.#bounds) && !RU.isEmpty(boundsRectangle)) {
            this.#bounds = boundsRectangle;
            this.presenter.resize(VU.new(boundsRectangle.width, boundsRectangle.height));
         }

         this.moveFocussedTileIntoVisibleArea(true);
         this.#updateMovementController();
      }
   }

   #updateMovementController() {
      if (this.#movementController.isEnabled && this.inputEventsGroup !== null) {
         this.#movementController.tileGridViewProperties = this.calculateGridProperties();
      } else if (!this.#movementController.isEnabled && this.inputEventsGroup !== null &&
         this.presenter !== null) {
         this.#movementController.enable(this.inputEventsGroup, this.calculateGridProperties());
      } else if (this.#movementController.isEnabled && this.inputEventsGroup === null) {
         this.#movementController.disable();
      }
   }

   /**
    * @param {number} tileIndex
    */
   #renderTile(tileIndex) {
      if (this.presenter === null || this.#tileViewType === null) {
         return;
      }

      let currentView = this.#tilesByModelIndices.get(tileIndex) ?? null;
      let presenter = currentView?.presenter ?? this.presenter.getTile(tileIndex) ?? null;
      if (presenter === null) {
         return;
      }

      let updatedView = cu(currentView, this.#tileViewType, this.root, (e, s) => {
         s.visibility = "collapse";
         s.opacity = "0";
         s.display = "block";
         s.position = "absolute";
         s.willChange = "transform, opacity";
         s.transition = `opacity 0.5s ease-in-out`;
         
         e.presenter = presenter;
         e.inputManager = this.inputManager;

         this.#tilesByModelIndices.set(tileIndex, e);
         this.#onTileViewUpdated.trigger({ tileIndex, oldView: null, newView: e });
      }, (e, s) => {
         if (e.presenter?.contentSize != null && location != null) {            
            s.opacity = "1";
            let visibility = this.presenter?.layout.getTileVisibility(tileIndex) ?? 0;
            if (visibility > 0) {
               s.visibility = "visible";
               let location = this.presenter?.layout.getTileLocation(tileIndex);
               if (location != null) {
                  s.width = `${location.width.toFixed(1)}px`;
                  s.height = `${location.height.toFixed(1)}px`;
                  s.transform =
                     `translate(${location.x.toFixed(1)}px, ${location.y.toFixed(1)}px)`;
               }
            } else {
               s.visibility = "collapse";
            }
         } else {
            s.visibility = "collapse";
            s.width = `${this.presenter?.layout.columnWidth.toFixed(1)}px`;
         }
      },);

      if (currentView !== updatedView) {
         this.#tilesByModelIndices.set(tileIndex, updatedView);
         this.#onTileViewUpdated.trigger({
            tileIndex,
            oldView: currentView,
            newView: updatedView
         });
      }
   }

   #tryUpdateLayoutCallback = () => this.#tryUpdateLayout();

   /**
    * @param {number} timestamp 
    */
   #handleOnTileUpdateAnimationFrameRequested = timestamp => {
      if (this.presenter !== null && this.#invalidatedTileIndices.size > 0) {
         if (this.#invalidatedTileIndices.has(allTilesInvalidatedIndex)) {
            for (let tileIndex of this.presenter.model.indices) {
               this.#renderTile(tileIndex);
            }
         } else {
            for (let invalidatedTileIndex of this.#invalidatedTileIndices) {
               this.#renderTile(invalidatedTileIndex);
            }
         }
         this.#invalidatedTileIndices.clear();         
      }

      if (BrowserUtils.isFullscreen &&
         performance.now() - (this.inputManager?.mouse.lastActionTimestamp ?? performance.now()) > 2000) {
         if (this.#cursorVisible !== false) {
            this.#cursorVisible = false;
            this.#onCursorVisibilityChangeRequested.trigger();
         }
      } else {
         if (this.#cursorVisible !== true) {
            this.#cursorVisible = true;
            this.#onCursorVisibilityChangeRequested.trigger();
         }
      }

      this.#animationHandle = requestAnimationFrame(this.#handleOnTileUpdateAnimationFrameRequested);
   };

   /**
    * @param {number?} [tileIndex = null]
    */
   #invalidateTile(tileIndex = null) {
      this.#invalidatedTileIndices.add(tileIndex ?? allTilesInvalidatedIndex);
   }

   /** @type {EventHandler<ValueChangedEventArgs<TileGridPresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onTilesMoved.unsubscribe(this.#handleOnTilesMoved);
      args.oldValue?.onGridResized.unsubscribe(this.#handleOnGridResized);
      args.oldValue?.onFocusUpdated.unsubscribe(this.#handleOnFocusUpdated);
      args.oldValue?.onTileMounted.unsubscribe(this.#handleOnTileMounted);
      args.oldValue?.onTileUnmounted.unsubscribe(this.#handleOnTileUnmounted);
      args.oldValue?.onTilesCleared.unsubscribe(this.#handleOnTilesCleared);

      args.newValue?.onTilesMoved.subscribe(this.#handleOnTilesMoved);
      args.newValue?.onGridResized.subscribe(this.#handleOnGridResized);
      args.newValue?.onFocusUpdated.subscribe(this.#handleOnFocusUpdated);
      args.newValue?.onTileMounted.subscribe(this.#handleOnTileMounted);
      args.newValue?.onTileUnmounted.subscribe(this.#handleOnTileUnmounted);
      args.newValue?.onTilesCleared.subscribe(this.#handleOnTilesCleared);

      this.#tryUpdateLayout();
   };

   /** @type {EventHandler<ValueChangedEventArgs<InputManager>>} */
   #handleOnInputManagerChanged = () => {
      for (let tileView of this.#tilesByModelIndices.values()) {
         tileView.inputManager = this.inputManager;
      }
   };

   #handleOnResized = () => {
      this.#resizeLimiter.executeThrottled(this.#tryUpdateLayoutCallback);
   };

   /** @type {EventHandler<TileGridFocusMoveRequestEventArgs>} */
   #handleOnMovementControllerFocusMoveRequest = (args) => {
      if (this.presenter === null) { return; }

      // Ignore focus movement requests not originated from a user action (e.g. touch swiping) unless
      // the grid has "full-screen-length" tiles and only one column ("gallery mode").
      if ((this.presenter.layout.type.tileLength !== 0 || this.presenter.layout.columnCount !== 1) &&
         !args.originatesFromAction) {
         return;
      }

      /** @type {TileGridFocusMoveRequestHandledEventArgs} */
      let handledEventArgs = { ...args, requestHandledSuccessfully: false };

      if (args.horizontalTileOffset !== null && args.horizontalTileOffset !== 0) {
         handledEventArgs.requestHandledSuccessfully =
            this.presenter.focusMoveHorizontal(args.horizontalTileOffset);
      } else if (args.verticalTileOffset !== null && args.verticalTileOffset !== 0) {
         if (!this.presenter.focusMoveVertical(args.verticalTileOffset)) {
            if (args.verticalTileOffset > 0 &&
               this.presenter.layout.endPosition !== null &&
               (this.presenter.layout.endPosition > this.presenter.layout.containerLength)) {
               let endPosition = this.presenter.layout.endPosition;
               let offsetToEnd = endPosition !== null ?
                  -(endPosition - this.presenter.layout.containerLength) : 0;
               if (Math.abs(offsetToEnd) > 1) {
                  this.#movementController.animateMovement(offsetToEnd);
                  handledEventArgs.requestHandledSuccessfully = true;
               }
            }
         } else {
            handledEventArgs.requestHandledSuccessfully = true;
         }
      }

      this.#onFocusMoveRequestHandled.trigger(handledEventArgs);
   };

   /** @type {EventHandler<TileGridMoveRequestEventArgs>} */
   #handleOnMovementControllerGridMoveRequest = (args) => {
      this.presenter?.move(args.offset, args.originatesFromUser);
   };

   /** @type {EventHandler<import("./TileGridPresenter.js").TileGridItemsUpdatedEventArgs>} */
   #handleOnTilesMoved = (args) => {
      if (this.presenter === null) { return; }

      if (args.tileIndices === null) {
         this.#invalidateTile();
      } else {
         args.tileIndices.forEach(tileIndex => this.#invalidateTile(tileIndex));
      }

      this.#updateMovementController();
   };

   /** @type {EventHandler<import("./TileGridPresenter.js").TileGridItemsUpdatedEventArgs>} */
   #handleOnGridResized = () => {
      this.#invalidateTile();
      this.#updateMovementController();
      if (!this.moveFocussedTileIntoVisibleArea()) {
         this.#movementController.triggerPositionGuard();
      }
   };

   /** @type {EventHandler<import("./TileGridPresenter.js").TileGridFocusUpdatedEventArgs>} */
   #handleOnFocusUpdated = (args) => {
      if (this.presenter === null) { return; }

      if (args.currentFocusType === TileFocuses.visible && args.currentlyFocussedTileIndex !== null) {
         if (!this.presenter.layout.hasEmptyColumns) {
            this.moveFocussedTileIntoVisibleArea();
         } else if (!this.#moveFocusIntoViewOnNextMount) {
            let focussedTileVisibility = this.presenter.layout.getTileVisibility(args.currentlyFocussedTileIndex);
            if (focussedTileVisibility !== null && focussedTileVisibility < 1) {
               this.#moveFocusIntoViewOnNextMount = true;
            }
         }
      }
   };

   /** @type {EventHandler<import("./TileGridPresenter.js").TileGridItemUpdatedEventArgs>} */
   #handleOnTileMounted = (args) => {
      if (this.presenter === null) { return; }

      this.#invalidateTile(args.tileIndex);

      if (!this.presenter.layout.hasEmptyColumns && this.presenter.focussedTileIndex !== null) {
         let focussedTileVisibility = this.presenter.layout.getTileVisibility(this.presenter.focussedTileIndex);
         if (focussedTileVisibility !== null && focussedTileVisibility < 1 && this.#moveFocusIntoViewOnNextMount) {
            this.moveFocussedTileIntoVisibleArea();
            this.#moveFocusIntoViewOnNextMount = false;
         }
      }

      this.#updateMovementController();
   };

   /** @type {EventHandler<import("./TileGridPresenter.js").TileGridItemUpdatedEventArgs>} */
   #handleOnTileUnmounted = (args) => {
      /** @type {TileView?} */
      let tileView = this.#tilesByModelIndices.get(args.tileIndex) ?? null;

      if (tileView !== null) {
         tileView?.remove();
         this.#tilesByModelIndices.delete(args.tileIndex);

         this.#onTileViewUpdated.trigger({
            tileIndex: args.tileIndex,
            oldView: tileView,
            newView: null 
         });
      } else {
         console.warn(`Attempted to unmount tile #${args.tileIndex} that doesn't exist.`);
      }

      this.#updateMovementController();
   };

   /** @type {EventHandler<void>} */
   #handleOnTilesCleared = () => {
      this.#tilesByModelIndices.forEach((tile, tileIndex) => {
         tile.remove();
         this.#onTileViewUpdated.trigger({
            tileIndex,
            oldView: tile,
            newView: null 
         });
      });

      this.#tilesByModelIndices.clear();
      this.#movementController.resetAnimation();
      this.#updateMovementController();
   };
}

class TileGridViewMovementController {
   get isIdle() { return this.#agents.isIdle; }
   get galleryMode() { return this.#galleryMode; }
   set galleryMode(value) { this.#galleryMode = value; }  
   get handleMouseAsTouch() { return this.#handleMouseAsTouch; }
   set handleMouseAsTouch(value) { this.#handleMouseAsTouch = value; }
   get isEnabled() { return this.#runAnimation; }

   get tileGridViewProperties() { return this.#tileGridViewProperties; }
   set tileGridViewProperties(value) { this.#tileGridViewProperties = value; }

   get onFocusMoved() { return this.#onFocusMoved.event; }
   get onGridMoved() { return this.#onGridMoved.event; }
   get onIdleStateChanged() { return this.#agents.onIdleStateChanged; }  

   /**
    * @typedef {object} TileGridFocusMoveRequestEventArgs
    * @property {number} horizontalTileOffset
    * @property {number} verticalTileOffset
    * @property {boolean} originatesFromAction
    */

   /**
    * @typedef {object} TileGridMoveRequestEventArgs
    * @property {number} offset
    * @property {boolean} originatesFromUser
    */

   get #currentMovementIsOrthogonalPull() { 
      return Math.abs(this.#recentMovementAsOrthogonalPull) > 5;
   }
   get #currentMovementIsScroll() { 
      return this.#recentMovementAsScroll !== null && Math.abs(this.#recentMovementAsScroll) > 5;
   }

   /** @type {InputEventsGroup?} */
   #inputEvents = null;
   /** @type {AgentCollection<any>} */
   #agents = new AgentCollection();

   /** @type {EventController<TileGridFocusMoveRequestEventArgs>} */
   #onFocusMoved = new EventController();
   /** @type {EventController<TileGridMoveRequestEventArgs>} */
   #onGridMoved = new EventController();

   /** @type {TileGridViewProperties?} */
   #tileGridViewProperties = null;

   /** @type {AgentArrival} */
   #movementInputOffsetAgent;
   /** @type {AgentArrival} */
   #scrollInputOffsetAgent;
   /** @type {AgentArrival} */
   #orthogonalPullInputOffsetAgent;
   /** @type {AgentArrivalMomentum} */
   #movementInputOffsetMomentumAgent;
   /** Stores momentum built by touch movement, to be used for swipe gesture detection. @type {AgentArrivalMomentum} */
   #movementAsScrollInputOffsetMomentumAgent;
   /** @type {AgentArrivalMomentum} */
   #scrollInputOffsetMomentumAgent;
   /** @type {AgentArrival} */
   #focussedTileOffsetAgent;
   /** @type {AgentArrival} */
   #positionGuardAgent;

   /** @type {boolean} */
   #runAnimation = false;
   /** @type {number?} */
   #lastAnimationHandle = null;
   /** @type {number?} */
   #lastAnimationTimestamp = null;
   /** @type {number} */
   #recentMovementAsOrthogonalPull = 0;
   /** The recent movement as scroll, or null if the recent movement should be ignored. @type {number?} */
   #recentMovementAsScroll = 0;

   /** @type {boolean} */
   #galleryMode = false;
   /** @type {boolean} */
   #handleMouseAsTouch = false;

   constructor() {
      this.#movementInputOffsetAgent = this.#agents.add(
         c => new AgentArrival({ passthrough: true }, c));
      this.#scrollInputOffsetAgent = this.#agents.add(
         c => new AgentArrival({ speed: 350, maximumVelocity: 3000 }, c));
      this.#orthogonalPullInputOffsetAgent = this.#agents.add(
         c => new AgentArrival({ speed: 250, maximumVelocity: 2500 }, c));
      this.#focussedTileOffsetAgent = this.#agents.add(
         c => new AgentArrival({ friction: 30, speed: 500, maximumVelocity: 5000 }, c));
      this.#positionGuardAgent = this.#agents.add(
         c => new AgentArrival({ friction: 30, speed: 500, maximumVelocity: 2500 }, c));
      this.#movementInputOffsetMomentumAgent = this.#agents.add(
         c => new AgentArrivalMomentum({ maximumVelocity: 3500 }, c));
      this.#scrollInputOffsetMomentumAgent = this.#agents.add(
         c => new AgentArrivalMomentum({ maximumVelocity: 2000 }, c));
      this.#movementAsScrollInputOffsetMomentumAgent = this.#agents.add(
         c => new AgentArrivalMomentum({ maximumVelocity: 2000 }, c));
      this.#agents.onIdleStateChanged.subscribe(this.#handleOnAgentsIdleStateChanged);
   }

   /**
    * @param {InputEventsGroup} inputEvents 
    * @param {TileGridViewProperties} initialTileGridViewProperties 
    */
   enable(inputEvents, initialTileGridViewProperties) {
      if (this.#inputEvents !== null) {
         this.disable();
      }
      this.#inputEvents = inputEvents;
      this.#tileGridViewProperties = initialTileGridViewProperties;

      this.#inputEvents.onScrollStart.subscribe(this.#handleOnScrollStart);
      this.#inputEvents.onScroll.subscribe(this.#handleOnScroll);
      this.#inputEvents.onScrollEnd.subscribe(this.#handleOnScrollEnd);
      this.#inputEvents.onMoveStart.subscribe(this.#handleOnMoveStart);
      this.#inputEvents.onMove.subscribe(this.#handleOnMove);
      this.#inputEvents.onMoveEnd.subscribe(this.#handleOnMoveEnd);
      this.#inputEvents.onAction.subscribe(this.#handleOnAction);

      this.#tryQueueNextAnimationFrame(true);
   }

   disable() {
      if (this.#inputEvents !== null) {
         this.#inputEvents.onScrollStart.unsubscribe(this.#handleOnScrollStart);
         this.#inputEvents.onScroll.unsubscribe(this.#handleOnScroll);
         this.#inputEvents.onScrollEnd.unsubscribe(this.#handleOnScrollEnd);
         this.#inputEvents.onMoveStart.unsubscribe(this.#handleOnMoveStart);
         this.#inputEvents.onMove.unsubscribe(this.#handleOnMove);
         this.#inputEvents.onMoveEnd.unsubscribe(this.#handleOnMoveEnd);
         this.#inputEvents.onAction.unsubscribe(this.#handleOnAction);
      }

      if (this.#lastAnimationHandle !== null) {
         cancelAnimationFrame(this.#lastAnimationHandle);
         this.#lastAnimationHandle = null;
      }
      this.#runAnimation = false;
   }

   /**
    * @param {number} offset 
    */
   animateMovement(offset) {
      if (Math.abs(offset) >= 1) {
         this.#movementInputOffsetAgent.stopAtTarget();
         this.#scrollInputOffsetAgent.stopAtTarget();
         this.#movementInputOffsetMomentumAgent.stopAtTarget();
         this.#movementInputOffsetMomentumAgent.resetCharge();
         this.#scrollInputOffsetMomentumAgent.stopAtTarget();
         this.#scrollInputOffsetMomentumAgent.resetCharge();
         this.#focussedTileOffsetAgent.stopAtTarget();
         this.#focussedTileOffsetAgent.currentValue = offset;
      }
   }

   resetAnimation() {
      this.#movementInputOffsetAgent.stopAtTarget();
      this.#scrollInputOffsetAgent.stopAtTarget();
      this.#movementInputOffsetMomentumAgent.stopAtTarget();
      this.#movementInputOffsetMomentumAgent.resetCharge();
      this.#scrollInputOffsetMomentumAgent.stopAtTarget();
      this.#scrollInputOffsetMomentumAgent.resetCharge();
      this.#focussedTileOffsetAgent.stopAtTarget();
      this.#positionGuardAgent.stopAtTarget();
   }

   /**
    * @param {number} deltaTime
    */
   #update(deltaTime) {
      Assert.numberPositiveOrZero(deltaTime, "deltaTime");

      this.#agents.update(deltaTime);
      this.#movementInputOffsetMomentumAgent.attenuateCharge(deltaTime, 4.2);

      // Prevent scrolling from interfering with the position guard.
      let positionGuardOverrideRatio = 
         1 - Math.max(Math.min(Math.abs(this.#positionGuardAgent.currentValue) / 5, 1), 0);
      let insideBoundsRatio = 1 - this.#calculateOutOfBoundsRatio();
   
      let contentCompletelyOutOfBounds = insideBoundsRatio < 0.01;
      let contentPartlyOutOfBounds = insideBoundsRatio < 1;

      if (contentPartlyOutOfBounds) {
         this.#movementInputOffsetMomentumAgent.stopAtTarget();
         this.#scrollInputOffsetMomentumAgent.stopAtTarget();
      }
      if (contentCompletelyOutOfBounds) {
         this.triggerPositionGuard();
      }

      let offsetUser = this.#movementInputOffsetAgent.lastStep +
      this.#scrollInputOffsetAgent.lastStep * positionGuardOverrideRatio +
      this.#movementInputOffsetMomentumAgent.lastStep +
      this.#scrollInputOffsetMomentumAgent.lastStep;
      let offsetInternal = this.#positionGuardAgent.lastStep +
      this.#focussedTileOffsetAgent.lastStep;
      
      // The farther the user tries to move the content out of bounds (or when the position guard 
      // is active), the more all movement besides the position guard is attenuated.
      let movementDampingFactor = Math.min(Math.max(Math.pow(1.6 * insideBoundsRatio - 0.6, 3), 0), 1);
      let offset = movementDampingFactor * offsetUser + offsetInternal;      
      
      if (!(this.tileGridViewProperties?.movementLocked ?? true)) {
         // To prevent an infinite feedback loop or other weird behavior, the tile focus should only be
         // changed with the current offset if the movement does not originate from the 
         // focussedTileOffsetAgent or positionGuardAgent.
         this.#onGridMoved.trigger({
            offset,
            originatesFromUser: Math.abs(offsetUser / offset) > 0.5
         });
      }

      // this.#controller.updateOrthogonalPull(-this.#orthogonalPullInputOffsetAgent.lastStep,
      //    this.#currentMovementIsOrthogonalPull);
   }

   #tryQueueNextAnimationFrame(enableAnimation = false, cancelPreviousAnimationFrame = true) {
      if (this.#lastAnimationHandle !== null) {
         if (cancelPreviousAnimationFrame) {
            cancelAnimationFrame(this.#lastAnimationHandle);
         }
         this.#lastAnimationHandle = null;
      }
      if (enableAnimation) {
         this.#runAnimation = true;
      }
      if (this.#runAnimation && !this.#agents.isIdle) {
         this.#lastAnimationHandle = requestAnimationFrame(this.#handleAnimationFrame);
      } else {
         this.#lastAnimationHandle = null;
      }
   }

   /**
    * Trigger on:
    * - handleOnExpandAndTrimChangedToIdleInitially
    */
   triggerPositionGuard() {
      if (this.#tileGridViewProperties === null) {
         throw new InvalidOperationError();
      }
      
      this.#movementInputOffsetMomentumAgent.stopAtTarget();
      this.#scrollInputOffsetMomentumAgent.stopAtTarget();
      this.#movementInputOffsetAgent.stopAtTarget();
      this.#scrollInputOffsetAgent.stopAtTarget();

      let positionGuardOffset = 0;
      if (this.#tileGridViewProperties.gridStart > 0) {
         positionGuardOffset = -this.#tileGridViewProperties.gridStart;
      }
      if (this.#tileGridViewProperties.gridEnd < this.#tileGridViewProperties.visibleLength &&
         this.#tileGridViewProperties.gridStart < 0) {
         if (this.#tileGridViewProperties.totalLength < this.#tileGridViewProperties.visibleLength) {
            positionGuardOffset = -this.#tileGridViewProperties.gridStart;
         } else {
            positionGuardOffset = this.#tileGridViewProperties.visibleLength - this.#tileGridViewProperties.gridEnd;
         }
      }

      if (positionGuardOffset !== 0 && !(this.tileGridViewProperties?.movementLocked ?? true)) {
         this.#positionGuardAgent.stopAtTarget();
         this.#positionGuardAgent.currentValue = positionGuardOffset;
      }
   }

   /**
    * @returns {number}
    */
   #calculateOutOfBoundsRatio() {
      if (this.#tileGridViewProperties === null) {
         throw new InvalidOperationError();
      }

      let defaultVisibleGridEnd = Math.min(this.#tileGridViewProperties.totalLength,
         this.#tileGridViewProperties.visibleLength);
      if (defaultVisibleGridEnd > 0) {
         let visibleGridEnd = Math.max(Math.min(defaultVisibleGridEnd, this.#tileGridViewProperties.gridEnd), 0);
         let outOfBoundsEndRatio = 1 - (visibleGridEnd / defaultVisibleGridEnd);

         let visibleGridStart = Math.min(Math.max(this.#tileGridViewProperties.gridStart, 0),
            this.#tileGridViewProperties.visibleLength);
         let outOfBoundsStartRatio = visibleGridStart / this.#tileGridViewProperties.visibleLength;

         return Math.max(outOfBoundsStartRatio, outOfBoundsEndRatio);
      } else {
         return 0;
      }
   }

   #handleOnAgentsIdleStateChanged = () => {
      if (!this.#agents.isIdle && this.#runAnimation && this.#lastAnimationHandle === null) {
         this.#tryQueueNextAnimationFrame();
      }
   }

   /**
    * @param {number} timestamp 
    */
   #handleAnimationFrame = timestamp => {
      let deltaTime = Math.max(0, (timestamp - (this.#lastAnimationTimestamp ?? timestamp)) / 1000);
      let dropFrame = deltaTime > 1;
      if (!dropFrame) {
         this.#update(deltaTime);
      }

      this.#lastAnimationTimestamp = timestamp;
      this.#tryQueueNextAnimationFrame(false, false);
   };

   /** @type {EventHandler<ScrollStartEventArgs>} */
   #handleOnScrollStart = () => {
      this.#scrollInputOffsetMomentumAgent.startCharging();
   };

   /** @type {EventHandler<ScrollEventArgs>} */
   #handleOnScroll = (args) => {
      if (!args.noFurtherAction) {
         let gridLength = this.#tileGridViewProperties?.visibleLength ?? 0;
         let scrollDistance = (gridLength * args.factor) - gridLength;
         this.#scrollInputOffsetAgent.addToCurrentValue(scrollDistance);
         this.#scrollInputOffsetMomentumAgent.addCharge(scrollDistance);
      }
   };

   /** @type {EventHandler<ScrollEndEventArgs>} */
   #handleOnScrollEnd = () => {
      // Don't trigger the position guard if another (move) operation is still in progress
      if (!this.#movementInputOffsetMomentumAgent.isCharging) {
         this.triggerPositionGuard();
      }
      this.#scrollInputOffsetMomentumAgent.releaseCharge(10);
   };

   /** @type {EventHandler<MoveStartEventArgs>} */
   #handleOnMoveStart = (args) => {
      if (args.inputDeviceType !== InputDeviceTypes.mouse || this.#handleMouseAsTouch) {
         this.#movementInputOffsetMomentumAgent.startCharging();
         this.#movementAsScrollInputOffsetMomentumAgent.startCharging();
      }

      this.#recentMovementAsOrthogonalPull = 0;
      this.#recentMovementAsScroll = 0;
      
      // Some Android phone users have the "back" functionality mapped to swiping from the left/right screen corner
      // to the middle, and other system-related gestures mapped to swiping from the top/bottom screen corner to the
      // middle - to avoid visual glitches, movements that start very close to these corners are ignored.
      const movementStartTolerance = 30;
      if (args.position !== null && this.#tileGridViewProperties !== null) {
         let tileFlowHorizontal = this.#tileGridViewProperties?.tileFlow === TileFlows.horizontal;
         if (tileFlowHorizontal && (args.position.x < movementStartTolerance ||
            args.position.x > (this.#tileGridViewProperties.visibleLength - movementStartTolerance))) {
            this.#recentMovementAsScroll = null;
         } else if (!tileFlowHorizontal && (args.position.y < movementStartTolerance ||
            args.position.y > (this.#tileGridViewProperties.visibleLength - movementStartTolerance))) {
            this.#recentMovementAsScroll = null;
         }
      }
   };

   /** @type {EventHandler<MoveEventArgs>} */
   #handleOnMove = (args) => {
      if ((args.inputDeviceType !== InputDeviceTypes.mouse  || this.#handleMouseAsTouch) && 
         !args.noFurtherAction) {
         let scrollDistance = null;
         let orthogonalPullDistance = null;

         if (this.#tileGridViewProperties?.tileFlow === TileFlows.vertical) {
            scrollDistance = args.offset.y;
            orthogonalPullDistance = args.offset.x;
         } else {
            scrollDistance = args.offset.x;
            orthogonalPullDistance = args.offset.y;
         }

         if (!this.#currentMovementIsOrthogonalPull && this.#recentMovementAsScroll !== null) {
            this.#movementInputOffsetAgent.addToCurrentValue(scrollDistance);
            this.#movementInputOffsetMomentumAgent.addCharge(scrollDistance);
            this.#recentMovementAsScroll += scrollDistance;
            this.#movementAsScrollInputOffsetMomentumAgent.addCharge(scrollDistance);
         }
         
         if (!this.#currentMovementIsScroll) {
            this.#orthogonalPullInputOffsetAgent.targetValue += orthogonalPullDistance;
            this.#recentMovementAsOrthogonalPull += orthogonalPullDistance;
         } else {
            this.#orthogonalPullInputOffsetAgent.targetValue = 0;
         }
      }
   };

   /** @type {EventHandler<MoveEndEventArgs>} */
   #handleOnMoveEnd = (args) => {
      if (args.inputDeviceType !== InputDeviceTypes.mouse || this.#handleMouseAsTouch) {
         this.triggerPositionGuard();

         this.#movementInputOffsetMomentumAgent.releaseCharge(200);

         this.#recentMovementAsOrthogonalPull = 0;
         this.#recentMovementAsScroll = 0;

         this.#orthogonalPullInputOffsetAgent.targetValue = 0;

         // If a touch swipe is detected (by rapid movement interpreted as scrolling), the focus will be moved to the
         // previous/next tile (which will also override the previously started animation elsewhere to scroll back to 
         // have the currently focussed tile on screen).
         let movementScrollMomentum = this.#movementAsScrollInputOffsetMomentumAgent.releaseCharge(150);
         if (movementScrollMomentum !== 0) {
            let moveFocusTreshold = (this.#tileGridViewProperties?.gridWidth ?? 0) / 4;
            let tileFlowHorizontal = this.#tileGridViewProperties?.tileFlow === TileFlows.horizontal;
            if (movementScrollMomentum < -moveFocusTreshold) {
               this.#onFocusMoved.trigger({
                  horizontalTileOffset: tileFlowHorizontal ? 1 : 0,
                  verticalTileOffset: tileFlowHorizontal ? 0 : -1,
                  originatesFromAction: false
               });
            } else if (movementScrollMomentum > moveFocusTreshold) {
               this.#onFocusMoved.trigger({
                  horizontalTileOffset: tileFlowHorizontal ? -1 : 0,
                  verticalTileOffset: tileFlowHorizontal ? 0 : 1,
                  originatesFromAction: false
               });
            }
         }
      }
   };

   /** @type {EventHandler<ActionEventArgs>} */
   #handleOnAction = (args) => {
      if (args.noFurtherAction) {
         return;
      }

      let horizontalTileOffset = 0;
      if (args.action === "right") {
         horizontalTileOffset = 1;
      } else if (args.action === "left") {
         horizontalTileOffset = -1;
      }

      let verticalTileOffset = 0;
      if (args.action === "up") {
         verticalTileOffset = -1;
      } else if (args.action === "down") {
         verticalTileOffset = 1;
      }

      if (horizontalTileOffset != 0 || verticalTileOffset != 0) {
         this.#onFocusMoved.trigger({ horizontalTileOffset, verticalTileOffset, originatesFromAction: true });
      }
   };
}