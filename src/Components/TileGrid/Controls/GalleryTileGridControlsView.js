// SPDX-License-Identifier: GPL-3.0-or-later

import { EventController } from "../../../Shared/Event.js";
import { RateLimiter } from "../../../Shared/RateLimiter.js";
import { InputEventsGroup } from "../../Shared/UserInput/InputEventsGroup.js";
import { BrowserUtils, cu } from "../../../Utils/BrowserUtils.js";
import { VU } from "../../../Utils/VectorUtils.js";
import { VideoController } from "../../Shared/VideoController.js";
import { GuiIconPresenter } from "../../GuiIcon/GuiIconPresenter.js";
import { GuiIconView } from "../../GuiIcon/GuiIconView.js";
import { TileGridView } from "../TileGridView.js";
import { TileGridControlsView } from "./TileGridControlsView.js";
import { InputDeviceTypes } from "../../Shared/UserInput/InputDeviceType.js";

const tagName = "gallery-grid-controls";

/**
 * @typedef {object} GalleryTileGridControlsViewSessionState
 * @property {boolean} barsShownInitiallyOnce
 */

export class GalleryTileGridControlsView extends TileGridControlsView {
	/** @override */
	static get tagName() { return tagName; }

	get onBack() { return this.#onBack.event; }

	/** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
	/** @template T @typedef {import("../../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
	/** @template T @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T> */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").ClickEventArgs} ClickEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveEventArgs} MoveEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveEndEventArgs} MoveEndEventArgs */
	/** @typedef {import("../../Shared/UserInput/InputEventsGroupController.js").MoveStartEventArgs} MoveStartEventArgs */

	/** @readonly @type {number} */
	#barTimeoutTime = 2500;
	/** @readonly @type {number} */
	#previousNextTimeoutTime = 2500;
	/** @readonly @type {number} */
	#statusTimeoutTime = 2500;

	/** @readonly @type {VideoController} */
	#videoController = new VideoController();

	/** @readonly @type {RateLimiter} */
	#makeBarsVisibleLimiter = new RateLimiter(500, 1);
	/** @readonly @type {RateLimiter} */
	#makePreviousNextVisibleLimiter = new RateLimiter(500, 1);
	/** @readonly @type {RateLimiter} */
	#videoControllerUpdateLimiter = new RateLimiter(50, 1);

	/** @type {boolean} */
	#barsVisible = false;
	/** @type {boolean} */
	#previousNextVisible = false;
	/** @type {boolean} */
	#statusVisible = false;
	/** @type {number?} */
	#hideBarsTimeoutHandle = null;
	/** @type {number?} */
	#hidePreviousNextTimeoutHandle = null;
	/** @type {number?} */
	#hideStatusIconTimeoutHandle = null;
	
	/** @type {HTMLDivElement?} */
	#bottomBar = null;
	
	/** @type {GuiIconView?} */
	#buttonBack = null;
	/** @type {GuiIconView?} */
	#buttonPlayPause = null;
	/** @type {GuiIconView?} */
	#buttonMute = null;
	/** @type {GuiIconView?} */
	#buttonEllipsis = null;
	/** @type {GuiIconView?} */
	#buttonFullscreen = null;
	/** @type {GuiIconView?} */
	#buttonPrevious = null;
	/** @type {GuiIconView?} */
	#buttonNext = null;
	/** @type {HTMLDivElement?} */
	#progressPlayback = null;
	/** @type {GuiIconView?} */
	#statusIcon = null;
	/** @type {GuiIconView?} */
   #loadingIcon = null;

	/** @type {Vector?} */
	#currentProgressMovementInputPosition = null;

	/** @type {EventController<void>} */
	#onBack = new EventController();

	constructor() {
		super();     

		this.onInputEventsGroupChanged.subscribe(this.#handleOnInputEventsGroupChanged);
		this.onFocussedTileViewUpdated.subscribe(this.#handleOnFocussedTileViewUpdated);
		this.onTileGridViewChanged.subscribe(this.#handleOnTileGridViewChanged);

		this.#videoController.onUpdateVolume.subscribe(this.#handleOnVideoControllerUpdate);
		this.#videoController.onUpdatePlaybackState.subscribe(this.#handleOnVideoControllerUpdate);
		this.#videoController.onUpdatePosition.subscribe(this.#handleOnVideoControllerUpdate);

		this.#videoController.onUpdateVolume.subscribe(this.#handleOnVideoControllerVolumeUpdate);
		this.#videoController.onUpdatePlaybackState.subscribe(this.#handleOnVideoControllerPlaybackStateUpdate);
	}
	
	connectedCallback() {
		this.style.width = "100%";
		this.style.height = "100%";
		this.style.position = "absolute";
		this.style.top = "0";
		this.style.left = "0";
		this.style.zIndex = "2";

		let styleSheet = new CSSStyleSheet();
      styleSheet.insertRule(`@keyframes rotate {
         0% {
            transform: rotateZ(0deg);
         }
         50% {
            transform: rotateZ(180deg);
         }
         100% {
            transform: rotateZ(360deg);
         }
      }`);      
      this.root.adoptedStyleSheets.push(styleSheet);

		this.#updateManagedMediaContent(this.focussedTile?.mediaContent ?? null);

		let sessionState = BrowserUtils.getSessionState(GalleryTileGridControlsView);
		if (sessionState !== null && "barsShownInitiallyOnce" in sessionState &&
			!sessionState.barsShownInitiallyOnce) {
			sessionState = { barsShownInitiallyOnce: true };
			BrowserUtils.setSessionState(GalleryTileGridControlsView, sessionState);
			this.#makeBarsVisible();
		}

		this.addEventListener("mousemove", this.#handleOnMouseMoved);
	}

	disconnectedCallback() {
		if (this.#hideBarsTimeoutHandle !== null) {
			clearTimeout(this.#hideBarsTimeoutHandle);
			this.#hideBarsTimeoutHandle = null;
		}
		if (this.#hidePreviousNextTimeoutHandle !== null) {
			clearTimeout(this.#hidePreviousNextTimeoutHandle);
			this.#hidePreviousNextTimeoutHandle = null;
		}

		this.removeEventListener("mousemove", this.#handleOnMouseMoved);
	}
	
	#render() {	
		if (!this.isConnected) { return; }
	
		this.#bottomBar = cu(this.#bottomBar, HTMLDivElement, this.root, (e, s) => {
			this.#applyBarStyle(s, false);
			
			this.#buttonFullscreen = this.#createIconButton(e);
			this.#progressPlayback = cu(null, HTMLDivElement, e, (_, s) => {
				s.border = "1px solid #0a0a0a80";
				s.flexGrow = "1";
				s.height = "75%";
				s.display = "flex";
				s.alignItems = "center";
				s.justifyContent = "center";
				s.userSelect = "none";
				s.margin = "3px 6px";
				s.letterSpacing = "1.25px";
				s.fontFamily = `-apple-system, "Segoe UI", Roboto, sans-serif`;
			});
			
			this.#buttonMute = this.#createIconButton(e);
			this.#buttonPlayPause = this.#createIconButton(e);

			this.#addBarActivationEventListeners(e);
		}, (e, s) => {
			s.opacity = this.#barsVisible ? "1" : "0";

			this.#updateIconButton(this.#buttonFullscreen, "fullscreen", true);

			this.#updateVideoControls();
		});

		this.#renderStatusIcon();
		this.#renderLoadingIndicator();
		this.#renderPreviousNextButtons();
	}

	#renderPreviousNextButtons() {
		let initializeButton = (/** @type {GuiIconView} */ e, /** @type {CSSStyleDeclaration} */ s) => {
			s.width = s.height = "40px";
			s.padding = "3px";
			s.opacity = "0";
			s.transition = "opacity 1s";
			s.position = "absolute";
			s.bottom = "calc(50vh - 20px)";
			s.color = "rgba(255,255,255,70%)";
			s.filter = "drop-shadow(0px 0px 2px black)"
		}

		this.#buttonPrevious = cu(this.#buttonPrevious, GuiIconView, this.root, (e, s) => {		
			initializeButton(e, s);
			e.presenter = new GuiIconPresenter();
			e.presenter.model.isInteractive = true;
			e.presenter.model.icon = "previous";
			s.left = "15px"
		}, (e, s) => {
			s.opacity = this.#previousNextVisible ? "1" : "0";
		});
		this.#buttonNext = cu(this.#buttonNext, GuiIconView, this.root, (e, s) => {
			initializeButton(e, s);
			e.presenter = new GuiIconPresenter();
			e.presenter.model.isInteractive = true;
			e.presenter.model.icon = "next";
			s.right = "15px";
		}, (e, s) => {
			s.opacity = this.#previousNextVisible ? "1" : "0";
		});
	}

	#renderStatusIcon() {
		this.#statusIcon = cu(this.#statusIcon, GuiIconView, this.root, (e, s) => {
			s.width = s.height = "100px";
			s.position = "absolute";
			s.top = "2vh";
			s.right = "4vw";
			e.presenter = new GuiIconPresenter();
			e.presenter.model.isInteractive = false;
			s.opacity = "0";
			s.transition = "opacity 1s";
			s.zIndex = "2";
			s.filter = "drop-shadow(0px 0px 6px #000000AA)";
			s.color = "#d8d8d8";
		}, (e, s) => {
			s.opacity = this.#statusVisible ? "1" : "0";
		});
	}

	#renderLoadingIndicator() {
		this.#loadingIcon = cu(this.#loadingIcon, GuiIconView, this.root, (e, s) => {
			e.presenter = new GuiIconPresenter();
         e.presenter.model.icon = "loading";
			e.presenter.model.isInteractive = false;
			s.position = "absolute";
			s.height = "3em";
			s.zIndex = "0";
			s.color = "rgba(255,255,255,70%)";
			s.filter = "drop-shadow(0px 0px 2px black)"
         s.opacity = "0";
			s.transition = `opacity 0.3s ease-in-out`;
			s.top = "calc(50% - 1.5em)"
			s.left = "calc(50% - 1.5em)"
		}, (e, s) => {
			if (this.focussedTile?.presenter?.contentSize == null) {
				s.opacity = "1";
				s.animation = "5s linear 0s rotate infinite";
			} else if (this.focussedTile?.presenter?.contentError != null) {
				s.opacity = "0";
				s.animation = "";
			} else {
            s.opacity = "0";
            setTimeout(() => {
               if (!this.focussedTile?.presenter?.contentSize == null) {
                  s.animation = "";
               }
            }, 300);
         }
		});
	}

	#updateVideoControls() {
		this.#updateIconButton(this.#buttonMute,
			this.#videoController.muted ? "volumeOff" : "volumeOn",
			this.#videoController.hasVideoElement);
		this.#updateIconButton(this.#buttonPlayPause,
			this.#videoController.playing ? "pause" : "play",
			this.#videoController.hasVideoElement);
		
		if (this.#progressPlayback !== null) {
			if (this.#videoController.hasVideoElement) {
				this.#progressPlayback.innerText = this.#videoController.progressInfo.replace("/", " / ");
				let progress = `${this.#videoController.progress}%`;
				this.#progressPlayback.style.background =
					`linear-gradient(90deg, #0a0a0a ${progress}, #252525 ${progress})`;
				this.#progressPlayback.style.visibility = "visible";
			} else {
				this.#progressPlayback.style.visibility = "hidden";
			}
		}
	}
	
	/**
	 * 
	 * @param {HTMLElement} parent 
	 * @returns {GuiIconView}
	 */
	#createIconButton(parent) {
		return cu(null, GuiIconView, parent, (e, s) => {
			s.width = s.height = "50px";
			s.padding = "3px";
			e.presenter = new GuiIconPresenter();
			e.presenter.model.isInteractive = true;
		});
	}
	
	/**
	 * @param {GuiIconView?} iconView
	 * @param {string} iconName 
	 * @param {boolean} isVisible 
	 */
	#updateIconButton(iconView, iconName, isVisible) {
		if (iconView?.presenter != null) {
			iconView.style.display = isVisible ? "block" : "none";
			iconView.presenter.model.icon = iconName;
		}
	}
	
	/**
	 * @param {CSSStyleDeclaration} style 
	 * @param {boolean} isTop 
	 */
	#applyBarStyle(style, isTop) {
		style.position = "absolute";
		style.left = "0";
		style.right = "0";
		style.height = "50px";
		style.color = "white";
		style.display = "flex";
		style.alignItems = "center";
		style.opacity = "0";
		style.transition = "opacity 1s";
		style.zIndex = "1";
		style.justifyContent = "space-between";
		
		if (isTop) {
			style.background = "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))";
			style.top = "0";
		} else {
			style.background = "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))";
			style.bottom = "0";
		}
	}

	/**
	 * @param {HTMLElement} barElement 
	 */
	#addBarActivationEventListeners(barElement) {
		barElement.addEventListener("touchstart", this.#handleOnBarsInteractedWith);
		barElement.addEventListener("touchmove", this.#handleOnBarsInteractedWith);
		barElement.addEventListener("mousemove", this.#handleOnBarsInteractedWith);
	}

	/**
	 * @param {HTMLElement?} mediaContent 
	 */
	#updateManagedMediaContent(mediaContent) {
		if (mediaContent instanceof HTMLVideoElement) {
			this.#videoController.videoElement = mediaContent;
		} else {
			this.#videoController.videoElement = null;
		}
	}

	/**
	 * @param {string} iconName 
	 * @returns {void}
	 */
	#updateStatus(iconName) {
		if (this.#statusIcon?.presenter?.model == null) { return; }

		this.#statusVisible = true;
		this.#statusIcon.presenter.model.icon = iconName;
		this.#renderStatusIcon();

		if (this.#hideStatusIconTimeoutHandle !== null) {
			clearTimeout(this.#hideStatusIconTimeoutHandle);
			this.#hideStatusIconTimeoutHandle = null;
		}

		this.#hideStatusIconTimeoutHandle = setTimeout(() => {
			this.#hideStatusIconTimeoutHandle = null;
			this.#statusVisible = false;
			this.#renderStatusIcon();
		}, this.#statusTimeoutTime);
	}

	#makePreviousNextVisible = () => {
		this.#previousNextVisible = true;
		this.#render();

		if (this.#hidePreviousNextTimeoutHandle !== null) {
			clearTimeout(this.#hidePreviousNextTimeoutHandle);
			this.#hidePreviousNextTimeoutHandle = null;
		}

		this.#hidePreviousNextTimeoutHandle = setTimeout(() => {
			this.#hidePreviousNextTimeoutHandle = null;
			this.#previousNextVisible = false;
			this.#render();
		}, this.#previousNextTimeoutTime);
	}

	#makeBarsVisible = () => {
		this.#barsVisible = true;
		this.#render();

		if (this.#hideBarsTimeoutHandle !== null) {
			clearTimeout(this.#hideBarsTimeoutHandle);
			this.#hideBarsTimeoutHandle = null;
		}

		this.#hideBarsTimeoutHandle = setTimeout(() => {
			this.#hideBarsTimeoutHandle = null;
			this.#barsVisible = false;
			this.#render();
		}, this.#barTimeoutTime);
	}

	/** @type {EventHandler<ValueChangedEventArgs<TileGridView?>>} */
   #handleOnTileGridViewChanged = (args) => {
      args.oldValue?.onLoadingIndicatorVisibilityChanged.unsubscribe(this.#handleOnLoadingIndicatorVisibilityChanged);

      args.newValue?.onLoadingIndicatorVisibilityChanged.subscribe(this.#handleOnLoadingIndicatorVisibilityChanged);
   };

	/** @type {EventHandler<ValueChangedEventArgs<InputEventsGroup>>} */
	#handleOnInputEventsGroupChanged = (args) => {
		args.oldValue?.onClick.unsubscribe(this.#handleOnClick);
		args.oldValue?.onDoubleClick.unsubscribe(this.#handleOnDoubleClick);
		// args.oldValue?.onClickSecondary.unsubscribe(this.#handleOnClickSecondary);
		args.oldValue?.onAction.unsubscribe(this.#handleOnAction);
		args.oldValue?.onMoveStart.unsubscribe(this.#handleOnMoveStart);
		args.oldValue?.onMove.unsubscribe(this.#handleOnMove);
		args.oldValue?.onMoveEnd.unsubscribe(this.#handleOnMoveEnd);
		args.oldValue?.onMoveEnd.unsubscribe(this.#handleOnMoveOrScrollEnd);
		args.oldValue?.onScrollEnd.unsubscribe(this.#handleOnMoveOrScrollEnd);

		args.newValue?.onClick.subscribe(this.#handleOnClick);
		args.newValue?.onDoubleClick.subscribe(this.#handleOnDoubleClick);
		// args.newValue?.onClickSecondary.subscribe(this.#handleOnClickSecondary);
		args.newValue?.onAction.subscribe(this.#handleOnAction);
		args.newValue?.onMoveStart.subscribe(this.#handleOnMoveStart);
		args.newValue?.onMove.subscribe(this.#handleOnMove);
		args.newValue?.onMoveEnd.subscribe(this.#handleOnMoveEnd);
		args.newValue?.onMoveEnd.subscribe(this.#handleOnMoveOrScrollEnd);
		args.newValue?.onScrollEnd.subscribe(this.#handleOnMoveOrScrollEnd);
	};

	#handleOnLoadingIndicatorVisibilityChanged = () => {
		this.#renderLoadingIndicator();
	};

	#handleOnMouseMoved = (/** @type {MouseEvent} */ e) => {
		if (e.clientX < 50 || e.clientX > (window.screen.width - 50)) {
			this.#makePreviousNextVisibleLimiter.executeThrottled(this.#makePreviousNextVisible);
		}
	};

	#handleOnBarsInteractedWith = () => {
		this.#makeBarsVisibleLimiter.executeThrottled(this.#makeBarsVisible);
	};

	#handleOnVideoControllerVolumeUpdate = () => {
		if (this.#videoController.muted || this.#videoController.volume <= 0.01) {
			this.#updateStatus("volumeOff");
		} else if (this.#videoController.volume >= 1) {
			this.#updateStatus("volumeOn");
		} else if (this.#videoController.volume >= 0.8) {
			this.#updateStatus("volume4-5");
		} else if (this.#videoController.volume >= 0.6) {
			this.#updateStatus("volume3-5");
		} else if (this.#videoController.volume >= 0.4) {
			this.#updateStatus("volume2-5");
		} else if (this.#videoController.volume >= 0.2) {
			this.#updateStatus("volume1-5");
		}
	};

	#handleOnVideoControllerPlaybackStateUpdate = () => {
		this.#updateStatus(this.#videoController.shouldBePlaying ? "play" : "pause");
	};

	/** @type {EventHandler<ActionEventArgs>} */
	#handleOnAction = (args) => {
		if (this.tileGridView?.presenter == null) { return; }

		if (args.noFurtherAction) { return; }

		args.noFurtherAction = true;
		if (args.action === "back") {
			this.#onBack.trigger();			
		} else if (args.action === "fullscreen") {
			BrowserUtils.toggleFullscreen();
		} else if (this.#videoController.hasVideoElement) {
			if (args.action === "confirm" || args.action === "play") {
				this.#videoController.togglePlay();
			} else if (args.action === "toggleMute") {
				this.#videoController.toggleMute();
			} else if (args.action === "left" && this.#videoController.shouldBePlaying) {
				this.#videoController.seekBy(-10);
				this.#updateStatus("rewind");
			} else if (args.action === "right" && this.#videoController.shouldBePlaying) {
				this.#videoController.seekBy(10);
				this.#updateStatus("fastForward");
			} else if (args.action === "up") {
				this.#videoController.changeVolume(0.2);
			} else if (args.action === "down") {
				this.#videoController.changeVolume(-0.2); 
			} else {
				args.noFurtherAction = false;
			} 
		} else {
			args.noFurtherAction = false;
		}
	};
	
	/** @type {EventHandler<ClickEventArgs>} */
	#handleOnClick = (args) => {
		if (this.tileGridView?.presenter == null) { return; }

		if (args.noFurtherAction || !this.tileGridView.isWithinBounds(args.position)) { return; }
		
		args.noFurtherAction = true;
		if (BrowserUtils.isInside(this.#buttonBack, args.position)) {
			this.#onBack.trigger();
		} else if (BrowserUtils.isInside(this.#buttonEllipsis, args.position)) {
			return;//TODO
		} else if (BrowserUtils.isInside(this.#buttonFullscreen, args.position)) {
			BrowserUtils.toggleFullscreen();
		} else if (BrowserUtils.isInside(this.#progressPlayback, args.position)) {
			let insideRatio = BrowserUtils.getInsideRatio(this.#progressPlayback, args.position);
			if (insideRatio.x >= 0 && insideRatio.x <= 1) {
				this.#videoController.progress = insideRatio.x * 100;
			}
		} else if (BrowserUtils.isInside(this.#buttonMute, args.position)) {
			this.#videoController.muted = !this.#videoController.muted;
		} else if (BrowserUtils.isInside(this.#buttonPlayPause, args.position)) {
			if (this.#videoController.playing) {
				this.#videoController.pause();
			} else {
				this.#videoController.play();
			}
			this.#render();
		} else if (BrowserUtils.isInside(this.#buttonPrevious, args.position)
			&& args.inputDeviceType === InputDeviceTypes.mouse) {
			this.tileGridView.presenter?.focusMoveHorizontal(-1);
		} else if (BrowserUtils.isInside(this.#buttonNext, args.position)
			&& args.inputDeviceType === InputDeviceTypes.mouse) {
			this.tileGridView.presenter?.focusMoveHorizontal(1);
		} else {
			args.noFurtherAction = false;
		}
	};

	/** @type {EventHandler<ClickEventArgs>} */
	#handleOnDoubleClick = (args) => {
		if (this.tileGridView?.presenter == null) { return; }

		if (args.noFurtherAction || !this.tileGridView.isWithinBounds(args.position)) { return; }

		if (BrowserUtils.isInside(this.#buttonPrevious, args.position)) {
			args.noFurtherAction = true;
		} else if (BrowserUtils.isInside(this.#buttonNext, args.position)) {
			args.noFurtherAction = true;
		}
	};

	/**
	 * @param {Vector} position 
	 */
	#applyPositionInputToProgressBar(position) {
		let insideRatio = BrowserUtils.getInsideRatio(this.#progressPlayback, position);
		if (insideRatio.x >= 0 && insideRatio.x <= 1) {
			this.#videoController.progress = insideRatio.x * 100;
		}
	}

	/** @type {EventHandler<MoveStartEventArgs>} */
	#handleOnMoveStart = (args) => {
		if (args.position !== null && BrowserUtils.isInside(this.#progressPlayback, args.position)) {
			this.#currentProgressMovementInputPosition = args.position;
			this.#applyPositionInputToProgressBar(this.#currentProgressMovementInputPosition);
		}
   };

   /** @type {EventHandler<MoveEventArgs>} */
	#handleOnMove = (args) => {
      if (this.#currentProgressMovementInputPosition != null) {
			this.#currentProgressMovementInputPosition = VU.add(this.#currentProgressMovementInputPosition, args.offset);
			this.#applyPositionInputToProgressBar(this.#currentProgressMovementInputPosition);
			args.noFurtherAction = true;
      }
   };

   /** @type {EventHandler<MoveEndEventArgs>} */
   #handleOnMoveEnd = () => {
      this.#currentProgressMovementInputPosition = null;
   }

	#handleOnMoveOrScrollEnd = () => {
		this.tileGridView?.moveFocussedTileIntoVisibleArea();
	};

	/** @type {EventHandler<import("./TileGridControlsView.js").FocussedTileUpdatedEventArgs>} */
	#handleOnFocussedTileViewUpdated = (args) => {
		if (args.viewChanged) {
			this.#updateManagedMediaContent(args.newTileView?.mediaContent ?? null);
		}

		if (args.viewChanged || args.mediaContentStatusChanged) {
			this.#render();
		}
	};

	#handleOnVideoControllerUpdate = () => {
		this.#videoControllerUpdateLimiter.executeThrottled(() => this.#updateVideoControls());
	};
}