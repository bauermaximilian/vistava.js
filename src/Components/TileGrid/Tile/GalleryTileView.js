// SPDX-License-Identifier: GPL-3.0-or-later

import { AgentArrival } from "../../Shared/Animation/AgentArrival.js";
import { AgentArrivalVector } from "../../Shared/Animation/AgentArrivalVector.js";
import { AgentArrivalMomentum } from "../../Shared/Animation/AgentArrivalMomentum.js";
import { AgentArrivalMomentumVector } from "../../Shared/Animation/AgentArrivalMomentumVector.js";
import { Assert } from "../../../Shared/Assert.js";
import { VectorUtils as VU } from "../../../Utils/VectorUtils.js";
import { ArrayUtils } from "../../../Utils/ArrayUtils.js";
import { AgentCollection } from "../../Shared/Animation/AgentCollection.js";
import { TileView } from "./TileView.js";
import { InputEventsGroup } from "../../Shared/UserInput/InputEventsGroup.js";
import { ZoomModes } from "../Shared/ZoomModeType.js";
import { TileFlows, TileFlowType } from "../Shared/TileFlowType.js";
import { EventController } from "../../../Shared/Event.js";
import { BrowserUtils, cu } from "../../../Utils/BrowserUtils.js";
import { TileDataField } from "./TileDataField.js";
import { NotSupportedError } from "../../../Errors/NotSupportedError.js";
import { TilePresenter } from "./TilePresenter.js";
import { TileFocuses } from "../Shared/TileFocusType.js";
import { RU } from "../../../Utils/RectangleUtils.js";
import { RateLimiter } from "../../../Shared/RateLimiter.js";
import { GuiIconView } from "../../GuiIcon/GuiIconView.js";
import { GuiIconPresenter } from "../../GuiIcon/GuiIconPresenter.js";
import { InputDeviceTypes } from "../../Shared/UserInput/InputDeviceType.js";

const tagName = "gallery-tile-view";

/** @extends {TileView<HTMLImageElement|HTMLVideoElement|GuiIconView>} */
export class GalleryTileView extends TileView {
   static get tagName() { return tagName; }

   get mediaContent() { return this.#mediaElement; }

   /** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */
   /** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ScrollStartEventArgs} ScrollStartEventArgs */
   /** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ScrollEventArgs} ScrollEventArgs */
   /** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ScrollEndEventArgs} ScrollEndEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").DoubleClickEventArgs} DoubleClickEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveEventArgs} MoveEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveEndEventArgs} MoveEndEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveStartEventArgs} MoveStartEventArgs */
   
   /** @typedef {import("./TileDataField.js").TileListEntryType} TileListEntryType */

   /** @readonly @type {GalleryTileViewMovementController} */
   #movementController;
   
   /** @type {HTMLDivElement?} */
   #containerElement = null;
   /** @type {ResizeObserver} */
   #containerResizeObserver;
   /** @readonly @type {RateLimiter} */
   #resizeLimiter = new RateLimiter(50, 1);
   /** @type {HTMLImageElement|HTMLVideoElement|GuiIconView|null} */
   #mediaElement = null;

   /** @type {boolean} */
   #loadingFailed = false;

   constructor() {
      super();

      this.#movementController = new GalleryTileViewMovementController();
      this.#movementController.onOffsetOrScaleChanged.subscribe(this.#handleOnOffsetOrScaleChanged);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
      this.onInputEventsGroupChanged.subscribe(this.#handleOnInputEventsGroupChanged);

      this.#containerResizeObserver = new ResizeObserver(this.#handleOnContainerSizeChanged);
   }

   connectedCallback() {
      super.connectedCallback();

      this.#render();
      this.#updateMovementController();
   }

   disconnectedCallback() {
      super.disconnectedCallback();

      this.#containerResizeObserver.disconnect();
      this.#updateMovementController();
   }

   #updateMovementController() {
      let containerSize = this.#containerElement !== null ?
         VU.new(this.#containerElement.clientWidth, this.#containerElement.clientHeight) : VU.new(0, 0);
      let contentSize = this.presenter?.contentSize ?? VU.new(0, 0);

      if (!VU.hasZero(containerSize) && !VU.equals(containerSize, this.#movementController)) {
         this.#movementController.containerSize = containerSize;
      } 

      if (!VU.hasZero(contentSize) && !VU.equals(contentSize, this.#movementController)) {
         this.#movementController.contentSize = contentSize;
      } 

      if (this.#movementController.containerSize !== null && this.#movementController.contentSize !== null &&
         this.inputEventsGroup !== null && !this.#movementController.isEnabled) {
         this.#movementController.enable(this.inputEventsGroup);
      }

      if (this.#movementController.isEnabled && this.inputEventsGroup === null) {
         this.#movementController.disable();
      } 
   }

   #updateMovementControllerFocus() {
      if (this.presenter !== null) {
         this.#movementController.hasFocus = this.presenter.focus !== TileFocuses.none;
      }
   }

   #render() {
      const mediaType = this.presenter?.model.getDataAsString(TileDataField.mediaType) ?? "";
      const mediaUrl = this.presenter?.model.getDataAsString(TileDataField.mediaUrl) ?? "";
      /** @type {TileListEntryType} */ //@ts-ignore
      const type = this.presenter?.model.getDataAsString(TileDataField.type) ?? "Media";
      const isDisplayableInDetail = type === "Media";
      
      let transform = `translateX(${this.#movementController.offset.x}px) ` +
         `translateY(${this.#movementController.offset.y}px) ` +
         `scale(${this.#movementController.zoom})`;
      
      this.#containerElement = cu(this.#containerElement, HTMLDivElement, this.root, (e, s) => {
         s.width = "100%";
         s.height = "100%";
         s.padding = "0";
         s.margin = "0";
         s.position = "absolute";
         s.display = "flex";
         s.alignItems = "center";
         s.justifyContent = "center";
         s.overflow = "hidden";
         this.#containerResizeObserver.observe(e);
      });

      if (mediaType.startsWith("image") && !this.#loadingFailed) {
         this.#mediaElement = cu(this.#mediaElement, HTMLImageElement, this.#containerElement, (e, s) => {
            e.addEventListener("load", this.#handleOnContentLoadingSucceeded, { once: true });
            e.addEventListener("error", this.#handleOnContentLoadingFailed, { once: true });

            e.src = mediaUrl;
            e.draggable = false;
            
            s.setProperty("-webkit-user-select", "none");
            s.userSelect = "none";
            s.objectFit = "none";
         }, (e, s) => {
            s.transform = transform;
         });
      } else if (mediaType.startsWith("video") && !this.#loadingFailed) {
         const mediaPreviewType = this.presenter?.model.getDataAsString(TileDataField.mediaPreviewType) ?? null;
         const mediaPreviewUrl = (mediaPreviewType?.startsWith("image") === true) ?
            (this.presenter?.model.getDataAsString(TileDataField.mediaUrl) ?? null) : null;

         this.#mediaElement = cu(this.#mediaElement, HTMLVideoElement, this.#containerElement, (e, s) => {
            e.addEventListener("loadedmetadata", this.#handleOnContentLoadingSucceeded, { once: true });
            e.addEventListener("error", this.#handleOnContentLoadingFailed, { once: true });
            e.addEventListener("keydown", args => args.preventDefault());

            e.playsInline = true;
            e.controls = false;
            if (mediaPreviewUrl !== null) {
               e.poster = mediaPreviewUrl;
            }
            cu(null, HTMLSourceElement, e, (e, s) => {
               e.type = mediaType;
               e.src = mediaUrl;
               e.addEventListener("error", this.#handleOnContentLoadingFailed, { once: true });
            });
         }, (e, s) => {
            s.transform = transform;
         });
      } else {
         this.#mediaElement = cu(this.#mediaElement, GuiIconView, this.#containerElement, (e, s) => {
            s.width = "5em";
            s.color = "#b7b7b7";
            e.presenter = new GuiIconPresenter();
            e.presenter.model.icon = "cross";
         }, (e, s) => {
            s.transform = transform;
         });

         if (this.presenter !== null) {
            if (!isDisplayableInDetail) {
               this.presenter.contentError = new NotSupportedError(
                  "The specified content type is not supported by the current view.");
            }
         }
      }
   }

   #tryUpdateMovementController = () => this.#updateMovementController();

   #handleOnContainerSizeChanged = () => {
      this.#resizeLimiter.executeThrottled(this.#tryUpdateMovementController);
   };

   #handleOnOffsetOrScaleChanged = () => {
      this.#render();
   };

   /** @type {EventHandler<ValueChangedEventArgs<TilePresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onContentUpdated.unsubscribe(this.#handleOnContentUpdated);
      args.oldValue?.onFocusUpdated.unsubscribe(this.#handleOnFocusUpdated);
      args.newValue?.onContentUpdated.subscribe(this.#handleOnContentUpdated);
      args.newValue?.onFocusUpdated.subscribe(this.#handleOnFocusUpdated);
      
      this.#updateMovementControllerFocus();
      this.#updateMovementController();
   };

   /** @type {EventHandler<ValueChangedEventArgs<import("../Shared/TileFocusType.js").TileFocus>>} */
   #handleOnFocusUpdated = () => {
      this.#updateMovementControllerFocus();
   };

   #handleOnInputEventsGroupChanged = () => {
      this.#updateMovementController();
   };

   #handleOnContentUpdated = () => {
      this.#updateMovementController();
   };

   #handleOnContentLoadingSucceeded = () => {
      if (this.presenter === null) { return; }

      let mediaElement = this.#mediaElement;
      let mediaBounds;
      if (mediaElement instanceof HTMLImageElement) {
         mediaBounds = VU.new(mediaElement.naturalWidth, mediaElement.naturalHeight);
      } else if (mediaElement instanceof HTMLVideoElement) {
         mediaBounds = VU.new(mediaElement.videoWidth, mediaElement.videoHeight);
      } else {
         mediaBounds = VU.new(0, 0);
      }

      if (!VU.hasZero(mediaBounds)) {
         this.presenter.contentSize = mediaBounds;
      }
   };

   #handleOnContentLoadingFailed = () => {
      if (this.presenter === null) { return; }

      this.#loadingFailed = true;
      this.presenter.contentSize = VU.new(200, 200);
      this.presenter.contentError = new Error("The content couldn't be loaded.");

      this.#render();
   }
}

class GalleryTileViewMovementController {
   get isIdle() { return this.#agents.isIdle; }

   get defaultZoomMode() { return this.#defaultZoomMode; }
   set defaultZoomMode(value) {
      Assert.enumType(value, ZoomModes);
      if (value !== this.#defaultZoomMode) {
         this.#defaultZoomMode = value;
         this.#resetScaleToDefault();
      }      
   }

   get defaultZoomModeFullscreen() { return this.#defaultZoomModeFullscreen; }
   set defaultZoomModeFullscreen(value) {
      Assert.enumType(value, ZoomModes);
      if (value !== this.#defaultZoomModeFullscreen) {
         this.#defaultZoomModeFullscreen = value;
         this.#resetScaleToDefault();
      }      
   }

   get offset() { return VU.new(this.#offset); }
   get zoom() { return this.#zoomAgent.currentValue; }

   get contentSize() { return this.#contentSize; }
   set contentSize(value) {
      if (value === null) {
         if (this.#contentSize !== null) {
            this.#contentSize = null;
            this.#initializeScaleParameters(true);
         }
      } else {
         Assert.vectorPositive(value);
         if (!VU.equals(value, this.#contentSize)) {
            this.#contentSize = VU.new(value);
            this.#initializeScaleParameters(true);
         }
      }
   }

   get containerSize() { return this.#containerSize; }
   set containerSize(value) {
      let resetScale = (this.#containerSize === null && value !== null) ||
         (this.#containerSize !== null && value === null);
      if (value === null) {
         if (this.#containerSize !== null) {
            this.#containerSize = null;
            this.#initializeScaleParameters(resetScale);
         }
      } else {
         Assert.vectorPositive(value);
         if (!VU.equals(value, this.#containerSize)) {
            this.#containerSize = VU.new(value);
            this.#initializeScaleParameters(resetScale);
         }
      }
   }
   
   get pointerInputOffset() { return this.#pointerInputOffset; }
   set pointerInputOffset(value) {
      Assert.vector(value);
      this.#pointerInputOffset = value;
   }
   
   get tileFlow() { return this.#tileFlow; }
   set tileFlow(value) {
      Assert.enumType(value, TileFlows);
      this.#tileFlow = value;
   }

   get hasFocus() { return this.#hasFocus; }
   set hasFocus(value) {
      Assert.boolean(value);
      this.#hasFocus = value;
   }

   get isEnabled() { return this.#runAnimation; }

   get onIdleStateChanged() { return this.#agents.onIdleStateChanged; }
   get onOffsetOrScaleChanged() { return this.#onOffsetOrScaleChanged.event; }

   /** @readonly @type {AgentCollection<any>} */
   #agents = new AgentCollection();
   /** @readonly @type {AgentArrivalVector} */
   #movementInputAgent;
   /** @readonly @type {AgentArrivalMomentumVector} */
   #movementMomentumAgent;
   /** @readonly @type {AgentArrivalVector} */
   #positionGuardAgent;
   /** @readonly @type {AgentArrival} */
   #zoomAgent;
   /** @readonly @type {AgentArrival} */
   #zoomInputAgent;
   /** @readonly @type {AgentArrivalMomentum} */
   #zoomMomentumAgent;
   /** @type {EventController<void>} */
   #onOffsetOrScaleChanged = new EventController();

   /** @type {Vector} */
   #offset = VU.new(0, 0);
   /** @type {ZoomStep[]} */
   #zoomSteps = [{ type: ZoomModes.original, value: 1 }];
   /** @type {boolean} */
   #zoomStepsForFullscreen = false;
   /** @type {ZoomMode} */
   #defaultZoomMode = ZoomModes.smallest;
   /** @type {ZoomMode} */
   #defaultZoomModeFullscreen = ZoomModes.fitContent;

   /** @type {Vector?} */
   #contentSize = null;
   /** @type {Vector?} */
   #containerSize = null;
   /** @type {Vector} */
   #pointerInputOffset = VU.new(0, 0);
   /** @type {InputEventsGroup?} */
   #inputEvents = null;
   /** @type {boolean} */
   #hasFocus = false;
   /** @type {import("../Shared/TileFlowType.js").TileFlow} */
   #tileFlow = TileFlows.horizontal;

   /** @type {boolean} */
   #runAnimation = false;
   /** @type {number?} */
   #lastAnimationHandle = null;
   /** @type {number?} */
   #lastAnimationTimestamp = null;

   #rawTouchPinchFactor = 1;

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("../../../Utils/RectangleUtils.js").Rectangle} Rectangle */
   /** @typedef {import("../Shared/ZoomModeType.js").ZoomMode} ZoomMode */
   /**
    * @template {any} TEventArgs
    * @typedef {import("../../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs>
    */
   /** 
    * @template TValue
    * @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<TValue>} ValueChangedEventArgs<TValue>
    */

   /**
    * @typedef {Object} ZoomStep
    * @property {ZoomMode} type
    * @property {number} value
    */

   constructor() {
      this.#movementInputAgent = this.#agents.add(
         c => new AgentArrivalVector({ passthrough: true}, c));
      this.#movementMomentumAgent = this.#agents.add(
         c => new AgentArrivalMomentumVector({ maximumVelocity: 2000 }, c));
      this.#positionGuardAgent = this.#agents.add(
         c => new AgentArrivalVector({}, c));
      this.#zoomAgent = this.#agents.add(
         c => new AgentArrival({ currentValue: 1, targetValue: 1, passthrough: true }, c));
      this.#zoomInputAgent = this.#agents.add(
         c => new AgentArrival({}, c));
      this.#zoomMomentumAgent = this.#agents.add(
         c => new AgentArrivalMomentum({}, c));
      this.#agents.onIdleStateChanged.subscribe(this.#handleOnAgentsIdleStateChanged);
   }

   /**
    * @param {InputEventsGroup} inputEvents 
    */
   enable(inputEvents) {
      if (this.#inputEvents !== null) {
         this.disable();
      }
      this.#inputEvents = inputEvents;

      this.#inputEvents.onScrollStart.subscribe(this.#handleOnScrollStart);
      this.#inputEvents.onScroll.subscribe(this.#handleOnScroll);
      this.#inputEvents.onScrollEnd.subscribe(this.#handleOnScrollEnd);
      this.#inputEvents.onMoveStart.subscribe(this.#handleOnMoveStart);
      this.#inputEvents.onMove.subscribe(this.#handleOnMove);
      this.#inputEvents.onMoveEnd.subscribe(this.#handleOnMoveEnd);
      this.#inputEvents.onDoubleClick.subscribe(this.#handleOnDoubleClick);
      this.#inputEvents.onAction.subscribe(this.#handleOnAction);

      if (this.#contentSize !== null && this.#containerSize !== null) {
         this.#initializeScaleParameters(true);
         this.#tryQueueNextAnimationFrame(true);
      }
   }

   disable() {
      if (this.#inputEvents !== null) {
         this.#inputEvents.onScrollStart.unsubscribe(this.#handleOnScrollStart);
         this.#inputEvents.onScroll.unsubscribe(this.#handleOnScroll);
         this.#inputEvents.onScrollEnd.unsubscribe(this.#handleOnScrollEnd);
         this.#inputEvents.onMoveStart.unsubscribe(this.#handleOnMoveStart);
         this.#inputEvents.onMove.unsubscribe(this.#handleOnMove);
         this.#inputEvents.onMoveEnd.unsubscribe(this.#handleOnMoveEnd);
         this.#inputEvents.onDoubleClick.unsubscribe(this.#handleOnDoubleClick);
         this.#inputEvents.onAction.unsubscribe(this.#handleOnAction);
         this.#inputEvents = null;
      }

      if (this.#lastAnimationHandle !== null) {
         cancelAnimationFrame(this.#lastAnimationHandle);
         this.#lastAnimationHandle = null;
      }
      this.#runAnimation = false;
   }

   toggleNextScaleStep() {
      if (this.#hasFocus) {
         this.#zoomInputAgent.currentValue = 
            this.#calculateNextScaleFactorStep().value - this.#zoomAgent.currentValue;
         let contentBounds = this.#calculateContentBounds(this.#offset, 
            this.#zoomAgent.currentValue);
         if (contentBounds !== null) {
            //let contentIsInPortraitMode = (contentBounds.width) / (contentBounds.height) < 0.8;
            //let contentOverflowsVisibleArea = (contentBounds.left < 0 || contentBounds.top < 0);
            if (/* contentIsInPortraitMode && */ this.#zoomInputAgent.currentValue > 0) {
               // HACK: Zooms into the top of the image
               this.#movementMomentumAgent.addToCurrentValue(
                  VU.new(0, ((this.#contentSize?.y ?? 0) * this.#zoomAgent.currentValue)));
            }
         }
      }
   }

   /**
    * @param {number} deltaTime 
    */
   #update(deltaTime) {
      let previousOffset = this.#offset;
      let previousZoom = this.#zoomAgent.currentValue;

      this.#agents.update(deltaTime);

      this.#movementMomentumAgent.attenuateCharge(deltaTime, 8.4);
      this.#zoomMomentumAgent.attenuateCharge(deltaTime, 4.2);

      if (this.#hasFocus) {
         let currentPositionGuardOffset = this.#calculatePositionGuardOffset(
            this.#offset, this.#zoomAgent.currentValue);
         
         if (this.#rawTouchPinchFactor !== 1) {
            this.#zoomAgent.targetValue *= this.#rawTouchPinchFactor;
            this.#rawTouchPinchFactor = 1;
         }
         this.#zoomAgent.targetValue = this.#calculateLimitedScale(this.#zoomAgent.targetValue +
            this.#zoomInputAgent.lastStep + this.#zoomMomentumAgent.lastStep);

         if (VU.isZero(this.#positionGuardAgent.lastStep)) {
            let nextOffset = VU.add(VU.add(this.#offset, this.#movementInputAgent.lastStep),
               this.#movementMomentumAgent.lastStep);
            let nextPositionGuardOffset =
               this.#calculatePositionGuardOffset(nextOffset, this.#zoomAgent.currentValue);
            this.#offset = VU.add(nextOffset, nextPositionGuardOffset);
         } else {
            this.#positionGuardAgent.currentValue = currentPositionGuardOffset;
            this.#offset = VU.add(this.#offset, this.#positionGuardAgent.lastStep);
         }
      }
      
      let offsetDistance = VU.len(VU.sub(previousOffset, this.#offset));
      let zoomDistance = Math.abs(previousZoom - this.zoom);
      if (offsetDistance >= 1 || zoomDistance >= 0.0001 || this.#agents.isIdle) {
         this.#onOffsetOrScaleChanged.trigger();
      }
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
    * @param {boolean} resetScaleToDefault
    */
   #initializeScaleParameters(resetScaleToDefault) {
      let baseScale = 1;
      let contentBounds = this.#calculateContentBounds(VU.zero, baseScale);
      if (this.#containerSize !== null && contentBounds !== null) {
         let fitToHeightScale = this.#containerSize.y / contentBounds.height;
         let fitToWidthScale = this.#containerSize.x / contentBounds.width;

         /** @type {ZoomStep[]} */
         let zoomSteps = [];

         zoomSteps.push(
            { type: ZoomModes.fitContent, value: Math.min(fitToHeightScale, fitToWidthScale) }, 
            { type: ZoomModes.fitContainer, value: Math.max(fitToHeightScale, fitToWidthScale) });

         zoomSteps.sort((a, b) => a.value - b.value);

         // Only include the "original" size if all other scale steps would "upscale" the image,
         // so the user can see the image in its native (unpixelated) resolution.
         if (zoomSteps[0].value > baseScale) {
            zoomSteps.unshift({ type: ZoomModes.original, value: baseScale });
         }
         
         zoomSteps.unshift({ type: ZoomModes.smallest, value: zoomSteps[0].value });         

         this.#zoomSteps = zoomSteps;
         if (resetScaleToDefault || (this.#zoomStepsForFullscreen !== BrowserUtils.isFullscreen)) {
            this.#resetScaleToDefault();
         }
         this.#zoomStepsForFullscreen = BrowserUtils.isFullscreen;
      }
   }

   #resetScaleToDefault() {
      let targetScale = ArrayUtils.findFirstOrNull(this.#zoomSteps, step => step.type ===
         (BrowserUtils.isFullscreen ? this.#defaultZoomModeFullscreen : this.#defaultZoomMode));
      if (targetScale !== null) {
         this.#zoomAgent.targetValue = targetScale.value;
      }
   }
   
   #calculateNextScaleFactorStep() {
      const PREDICT_MARGIN = 0.01;
      let estimatedFutureScale = PREDICT_MARGIN + this.#zoomAgent.currentValue + 
         this.#zoomInputAgent.currentValue + this.#zoomMomentumAgent.currentValue + 
         this.#zoomMomentumAgent.releaseCharge(1, true);

      let nextScaleLevel = this.#zoomSteps[0];

      for (let scaleLevel of this.#zoomSteps) {    
         if (scaleLevel.value > estimatedFutureScale) {
            nextScaleLevel = scaleLevel;
            break;
         }
      }

      return nextScaleLevel;
   }

   /**
    * @param {number} scale 
    */
   #calculateLimitedScale(scale) {
      return Math.min(Math.max(0.1, scale), 100);
   }

   /**
    * @param {Vector} offset
    * @param {number} scale
    * @returns {Rectangle?}
    */
   #calculateContentBounds(offset, scale) {
      if (this.#contentSize !== null && this.#containerSize !== null) {
         let scaledContentSize = VU.scale(this.#contentSize, scale);
         let scaledContentWidthHalf = scaledContentSize.x / 2;
         let scaledContentHeightHalf = scaledContentSize.y / 2;
         let contentBasePosition = VU.scale(this.#containerSize, 0.5);
         let contentPosition = VU.add(contentBasePosition, offset);

         return {
            x: contentPosition.x - scaledContentWidthHalf,
            y: contentPosition.y - scaledContentHeightHalf,
            width: scaledContentSize.x,
            height: scaledContentSize.y,
         };
      } else {
         return null;
      }
   }

   /**
    * @param {number} scale 
    * @returns {Rectangle?}
    */
   #calculateContentLimitBounds(scale) {
      let contentBounds = this.#calculateContentBounds(VU.zero, scale);
      if (contentBounds !== null && this.#containerSize !== null) {
         return {
            x: Math.max(0, contentBounds.x),
            y: Math.max(0, contentBounds.y),
            width: Math.min(this.#containerSize.x, contentBounds.width),
            height: Math.min(this.#containerSize.y, contentBounds.height),
         };
      } else {
         return null;
      }
   }

   /**
    * @param {Vector} offset 
    * @param {number} scale 
    * @returns {Vector}
    */
   #calculatePositionGuardOffset(offset, scale) {
      Assert.vector(offset, "offset");
      Assert.numberPositive(scale, "scale");

      let contentBounds = this.#calculateContentBounds(offset, scale);
      let contentLimitBounds = this.#calculateContentLimitBounds(scale);

      let guardOffset = VU.new(0, 0);
      if (contentBounds !== null && contentLimitBounds !== null) {
         guardOffset.y -= Math.max(contentBounds.y - contentLimitBounds.y, 0);
         guardOffset.x += Math.max(RU.right(contentLimitBounds) - RU.right(contentBounds), 0);
         guardOffset.y += Math.max(RU.bottom(contentLimitBounds) - RU.bottom(contentBounds), 0);
         guardOffset.x -= Math.max(contentBounds.x - contentLimitBounds.x, 0);
      }
      return guardOffset;
   }


   /**
    * @param {boolean} checkUp 
    * @param {boolean} checkRight 
    * @param {boolean} checkDown 
    * @param {boolean} checkLeft 
    * @returns {boolean}
    */
   #checkIfContentExceedsBounds(checkUp, checkRight, checkDown, checkLeft) {
      let contentBounds = this.#calculateContentBounds(this.#offset, this.#zoomAgent.currentValue);
      const tolerance = 2;
      if (contentBounds !== null && this.#containerSize !== null) {
         if (checkLeft && contentBounds.x < -tolerance) {
            return true;
         } else if (checkRight && (contentBounds.x + contentBounds.width) > (this.#containerSize.x + tolerance)) {
            return true;
         } else if (checkUp && contentBounds.y < -tolerance) {
            return true;
         } else if (checkDown && (contentBounds.y + contentBounds.height) > (this.#containerSize.y + tolerance)) {
            return true;
         }
      }
      return false;
   }

   /**
    * @param {number} factor
    * @returns {number}
    */
   #addZoomFactorToZoomInputAgent(factor) {
      let zoomStepOffset;
      if (factor > 1) {
         zoomStepOffset = Math.max(Math.min(
            this.#zoomAgent.currentValue * factor - this.#zoomAgent.currentValue, 5), 0.01);
      } else {
         zoomStepOffset = -Math.max(Math.min(
            this.#zoomAgent.currentValue - this.#zoomAgent.currentValue * factor, 5), 0.01);
      }
      this.#zoomInputAgent.addToCurrentValue(zoomStepOffset);
      return zoomStepOffset;
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
      if (this.#hasFocus) {
         this.#zoomMomentumAgent.startCharging();
      }
   };

   /** @type {EventHandler<ScrollEventArgs>} */
   #handleOnScroll = (args) => {
      if (this.#hasFocus && !args.noFurtherAction) {
         args.noFurtherAction = true;
         
         let centerPosition = VU.add(this.#offset,
            VU.add(VU.scale(this.#containerSize ?? VU.new(0, 0), 0.5), this.#pointerInputOffset));
         let centerOffset = VU.sub(args.position, centerPosition);
         let scaleDirection = VU.scale(centerOffset, 1 - args.factor);
         
         if (args.inputDeviceType === InputDeviceTypes.touch) {
            this.#rawTouchPinchFactor = args.factor;
            this.#movementInputAgent.addToCurrentValue(scaleDirection);
         } else {
            this.#zoomMomentumAgent.addCharge(this.#addZoomFactorToZoomInputAgent(args.factor));
            this.#movementMomentumAgent.addToCurrentValue(scaleDirection);
         }
      }
   };

   /** @type {EventHandler<ScrollEndEventArgs>} */
   #handleOnScrollEnd = () => {
      if (this.#hasFocus) {
         this.#zoomMomentumAgent.releaseCharge(1);
      }
   };

   /** @type {EventHandler<MoveStartEventArgs>} */
   #handleOnMoveStart = () => {
      if (this.#hasFocus && this.#positionGuardAgent.isIdle) {
         this.#movementMomentumAgent.startCharging();
      }
   };

   /** @type {EventHandler<MoveEventArgs>} */
   #handleOnMove = (args) => {
      if (this.#hasFocus && this.#positionGuardAgent.isIdle && !args.noFurtherAction) {
         this.#movementInputAgent.addToCurrentValue(args.offset);
         let offsetEstimate = VU.add(this.#offset, args.offset);
         let positionGuardOffsetEstimate = this.#calculatePositionGuardOffset(
            offsetEstimate, this.#zoomAgent.currentValue);
         let linearPositionGuardOffsetEstimate = 
            TileFlowType.calculateScalar(positionGuardOffsetEstimate, this.#tileFlow);

         if (linearPositionGuardOffsetEstimate !== null &&
            Math.abs(linearPositionGuardOffsetEstimate) < 1) {
            args.noFurtherAction = true;
            this.#movementMomentumAgent.addCharge(args.offset);
         }
      }
   };

   /** @type {EventHandler<MoveEndEventArgs>} */
   #handleOnMoveEnd = () => {
      if (this.#hasFocus) {
         this.#movementMomentumAgent.releaseCharge(100);
      }
   };

   /** @type {EventHandler<DoubleClickEventArgs>} */
   #handleOnDoubleClick = (args) => {
      if (this.#hasFocus && !args.noFurtherAction) {
         this.toggleNextScaleStep();
      }
   };

   /** @type {EventHandler<ActionEventArgs>} */
   #handleOnAction = (args) => {
      if (this.#hasFocus && !args.noFurtherAction) {
         if (args.action === "zoomOut") {
            this.#addZoomFactorToZoomInputAgent(1.25);
            args.noFurtherAction = true;
         } else if (args.action === "zoomIn") {
            this.#addZoomFactorToZoomInputAgent(0.75);
            args.noFurtherAction = true;
         } else if (args.action === "zoom") {
            this.toggleNextScaleStep();
            args.noFurtherAction = true;
         } else if (args.action === "up" || args.action === "down") {
            let nudgeImpulse = ((this.#contentSize?.y ?? 0) * 0.05 * this.#zoomAgent.currentValue);
            if (args.action === "up" && this.#checkIfContentExceedsBounds(true, false, false, false)) {
               this.#movementMomentumAgent.addToCurrentValue(VU.new(0, nudgeImpulse));
               args.noFurtherAction = true;
            } else if (args.action === "down" && this.#checkIfContentExceedsBounds(false, false, true, false)) {
               this.#movementMomentumAgent.addToCurrentValue(VU.new(0, -nudgeImpulse));
               args.noFurtherAction = true;
            }            
         } else if (args.action === "left" || args.action === "right") {
            let nudgeImpulse = ((this.#contentSize?.x ?? 0) * 0.05 * this.#zoomAgent.currentValue);
            if (args.action === "left" && this.#checkIfContentExceedsBounds(false, false, false, true)) {
               this.#movementMomentumAgent.addToCurrentValue(VU.new(nudgeImpulse, 0));
               args.noFurtherAction = true;
            } else if (args.action === "right" && this.#checkIfContentExceedsBounds(false, true, false, false)) {
               this.#movementMomentumAgent.addToCurrentValue(VU.new(-nudgeImpulse, 0));
               args.noFurtherAction = true;
            }            
         }
      }
   };
}