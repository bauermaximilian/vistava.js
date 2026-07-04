// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../Shared/Assert.js";
import { InvalidOperationError } from "../../Errors/InvalidOperationError.js";
import { EventController } from "../../Shared/Event.js";
import { ClassUtils } from "../../Utils/ClassUtils.js";
import { VU } from "../../Utils/VectorUtils.js";
import { TileFlows } from "./Shared/TileFlowType.js";
import { TileFocuses } from "./Shared/TileFocusType.js";
import { TileGridLayout, TileGridLayoutBase } from "./Shared/TileGridLayout.js";
import { TileGridLayoutType } from "./Shared/TileGridLayoutType.js";
import { TilePresenter } from "./Tile/TilePresenter.js";
import { TileGridModel } from "./TileGridModel.js";

/**
 * @typedef {object} TileGridFocusUpdatedEventArgs
 * @property {number?} previouslyFocussedTileIndex
 * @property {number?} currentlyFocussedTileIndex
 * @property {TileFocus} previousFocusType
 * @property {TileFocus} currentFocusType
 */

/**
 * @typedef {object} TileGridItemUpdatedEventArgs
 * @property {number} tileIndex
 */

/**
 * @typedef {object} TileGridItemsUpdatedEventArgs
 * @property {number[]?} tileIndices
 */

/**
 * @typedef {object} TilePositionHint
 * @property {number} tileIndex
 * @property {number} tilePosition
 */

/**
 * @typedef {object} TileGridPresenterAssignable
 * @property {TileGridPresenter?} presenter
 */

/**
 * @typedef {object} TileGridAddAndTrimRecommendations
 * @property {number?} tileIndexToAddPrimary
 * @property {number?} tileIndexToAddSecondary
 * @property {number?} tileIndexToRemove
 */

export class TileGridPresenter {
	get model() { return this.#model; }

	get onFocusUpdated() { return this.#onFocusUpdated.event; }
	/** Occurs after tiles have been moved or the {@link layout} was resized. */
	get onTilesMoved() { return this.#onTilesMoved.event; }
	get onGridResized() { return this.#onGridResized.event; }
	get onTileMounted() { return this.#onTileMounted.event; }
	get onTileUnmounted() { return this.#onTileUnmounted.event; }
	get onTilesCleared() { return this.#onTilesCleared.event; }
	get onConfigurationChanged() { return this.#onConfigurationChanged.event; }

	get focussedTileIndex() { return this.#focussedTile?.model.index ?? null; }
	get focusVisible() { return this.#focussedTile?.focus === TileFocuses.visible; }
	/** @type {TileGridLayoutBase} */
	get layout() { return this.#layout; }
	
	/** @typedef {import("../../Utils/VectorUtils.js").Vector} Vector */
	/** @typedef {import("./Shared/TileFocusType.js").TileFocus} TileFocus */
	/** @template T @typedef {import("../../Shared/Event.js").EventHandler<T>} EventHandler<T> */
	/** @typedef {import("./Shared/TileGridLayout.js").TileGridLayoutSnapshot} TileGridLayoutSnapshot */
	/** @typedef {import("./TileGridModel.js").TileGridModelUpdateEventArgs} TileGridModelUpdateEventArgs */

	/** @type {EventController<TileGridFocusUpdatedEventArgs>} */
	#onFocusUpdated = new EventController();
	/** @type {EventController<TileGridItemUpdatedEventArgs>} */
	#onTileMounted = new EventController();
	/** @type {EventController<TileGridItemUpdatedEventArgs>} */
	#onTileUnmounted = new EventController();
	/** @type {EventController<TileGridItemsUpdatedEventArgs>} */
	#onTilesMoved = new EventController();
	/** @type {EventController<void>} */
	#onTilesCleared = new EventController();
	/** @type {EventController<TileGridItemsUpdatedEventArgs>} */
	#onGridResized = new EventController();
	/** @type {EventController<void>} */
	#onConfigurationChanged = new EventController();

	/** @readonly @type {TileGridModel} */
	#model = new TileGridModel();
	/** @readonly @type {Map<number,TilePresenter>} */
	#tilesByModelIndices = new Map();

	/** @type {TileGridLayoutSnapshot|null} */
	#referenceLayoutState = null;

	/** @type {TileGridLayout} */
	#layout;

	/** @type {TilePresenter?} */
	#focussedTile = null;
	/** @type {number} */
	#pendingMovementOffset = 0;
	/** @type {TileGridAddAndTrimRecommendations?} */
	#currentAddAndTrimRecommendations = null;


	/**
	 * @param {TileGridLayoutType} initialLayoutType 
	 * @param {Vector} initialSize 
	 * @throws {ArgumentError}
	 */
	constructor(initialLayoutType, initialSize) {
		this.#layout = new TileGridLayout(initialLayoutType, initialSize);

		this.#model.onAdded.subscribe(this.#handleOnModelAdded);
		this.#model.onTrimmed.subscribe(this.#handleOnModelTrimmed);
		this.#model.onCleared.subscribe(this.#handleOnModelCleared);
	}

	/**
	 * @param {number} offset 
	 * @param {boolean} [moveFocusIntoVisibleArea=true]
	 */
	move(offset, moveFocusIntoVisibleArea = true) {
		this.#pendingMovementOffset += offset;
		if (Math.abs(this.#pendingMovementOffset) < TileGridLayout.screenEpsilon) {
			return;
		}

		let focussedTileIndex = this.#focussedTile?.model.index ?? null;
		let focusVisibility = this.#focussedTile !== null ?
			this.#layout.getTileVisibility(this.#focussedTile.model.index) : null;
		let updatedFocusVisibility = this.#focussedTile !== null ?
			this.#layout.getTileVisibility(this.#focussedTile.model.index, this.#pendingMovementOffset) : null;

		this.#layout.move(this.#pendingMovementOffset);
		this.#resetCurrentAddAndTrimRecommendations();
		this.#onTilesMoved.trigger({ tileIndices: null });

		if (moveFocusIntoVisibleArea && this.#focussedTile !== null &&
			focusVisibility !== null && updatedFocusVisibility !== null &&
			((focusVisibility > 0.5 && updatedFocusVisibility < 0.5) || focusVisibility < 0.5)) {
			let newFocussedTileIndex = this.#layout.getAdjacentTo(this.#focussedTile.model.index,
				this.#pendingMovementOffset > 0 ? -1 : 1);
			if (newFocussedTileIndex !== focussedTileIndex && newFocussedTileIndex !== null) {
				this.focus(newFocussedTileIndex, true);
			}
		}

		this.#pendingMovementOffset = 0;
	}

	/**
	 * @param {TileGridLayoutSnapshot} layoutState 
	 */
	setReferenceLayout(layoutState) {
		this.#referenceLayoutState = layoutState;
	}

	/**
	 * @throws {ObjectNotInitializedError}
	 */
	unsetReferenceLayout() {
		this.#referenceLayoutState = null;
	}

	/**
	 * @returns {TileGridAddAndTrimRecommendations}
	 */
	getAddAndTrimRecommendations() {
		if (this.#currentAddAndTrimRecommendations === null) {
			/** @type {number?} */
			let tileIndexToAddPrimary = null;
			/** @type {number?} */
			let tileIndexToAddSecondary = null;
			/** @type {number?} */
			let tileIndexToRemove = null;

			let columnOverflowStart = this.#layout.countColumnTilesOutOfBounds();
			let columnOverflowEnd = this.#layout.countColumnTilesOutOfBounds(true);

			let overflowStartExceeded = columnOverflowStart > this.#layout.type.columnOverflowMaximum;
			let overflowEndExceeded = columnOverflowEnd > this.#layout.type.columnOverflowMaximum;

			// If the "columnOverflowMaximum" is exceeded anywhere, do not propose any appending - just removing.
			if (overflowStartExceeded) {
				tileIndexToRemove = this.#layout.firstTileIndex;
			} else if (overflowEndExceeded) {
				tileIndexToRemove = this.#layout.lastTileIndex;
			} else {
				// For adding new tiles, the "columnOverflowMinimum" parameter is relevant (to avoid proposing to 
				// add tiles which could then be proposed to be removed again right afterwards).
				overflowStartExceeded = columnOverflowStart > this.#layout.type.columnOverflowMinimum;
				overflowEndExceeded = columnOverflowEnd > this.#layout.type.columnOverflowMinimum;
				if (!overflowStartExceeded || !overflowEndExceeded) {
					let emptyColumnsAtStart = this.#layout.firstNonEmptyColumn !== 0;
					let emptyColumnsAtEnd = this.#layout.lastNonEmptyColumn !== (this.#layout.columnCount - 1);
					let prependTileIndex = null, appendTileIndex = null;
				
					// If no tile indices could be proposed using the reference layout, just use the "next lower"
					// neighbor" as the index to prepend, and the "next higher neighbor" as the index to append.
					// If the layout is empty (so, no neighbors), just propose appending the tile with index 0
					// and don't propose prepending anything. Also, don't propose prepending anything if the layout
					// is just populated from the tile with index 0 onwards.
					prependTileIndex ??= (this.#layout.firstTileIndex ?? 0) - 1;
					appendTileIndex ??= (this.#layout.lastTileIndex ?? -1) + 1;
					if (prependTileIndex < 0) {
						prependTileIndex = null;
					}

					// Try to fill up the "first row" to the first column, then to the last column first -
					// this should ensure the tiles in the first row are next to each other.
					if (emptyColumnsAtStart && !overflowStartExceeded && prependTileIndex !== null) {
						tileIndexToAddPrimary = prependTileIndex;
						tileIndexToAddSecondary = appendTileIndex;
					} else if (emptyColumnsAtEnd && !overflowEndExceeded && appendTileIndex !== null) {
						tileIndexToAddPrimary = appendTileIndex;
						tileIndexToAddSecondary = prependTileIndex;
					}
					// After the first row is complete, fill up the grid up to the start limit, then to the end limit -
					// this should ensure that, when in the middle of a collection, the user could see quickly that there's
					// more items "before" the current row (and doesn't have to wait until the grid fills up to the end).
					else if (prependTileIndex !== null && !overflowStartExceeded) {
						tileIndexToAddPrimary = prependTileIndex;
						tileIndexToAddSecondary = appendTileIndex;
					} else if (appendTileIndex !== null && !overflowEndExceeded) {
						tileIndexToAddPrimary = appendTileIndex;
					}
				}
			}

			this.#currentAddAndTrimRecommendations = Object.freeze({
				tileIndexToAddPrimary, tileIndexToAddSecondary, tileIndexToRemove
			});
		}

		return this.#currentAddAndTrimRecommendations;
	}

	/**
	 * @param {number} index 
	 * @param {boolean} [hidden=false] 
	 * @returns {boolean}
	 * @throws {ArgumentError}
	 */
	focus(index, hidden = false) {
		Assert.numberIntegerPositiveOrZero(index, "index");

		let newFocussedTile = this.#tilesByModelIndices.get(index);
		if (newFocussedTile != null && (this.#focussedTile !== newFocussedTile ||
			newFocussedTile.focus !== TileFocuses.visible)) {        
			let previouslyFocussedTile = this.#focussedTile;
			let previousFocusType = previouslyFocussedTile?.focus ?? TileFocuses.none;
			if (previouslyFocussedTile !== null && previouslyFocussedTile !== newFocussedTile) {
				previouslyFocussedTile.focus = TileFocuses.none;
			}

			this.#focussedTile = newFocussedTile;
			let currentFocusType = this.#focussedTile.focus =
				hidden ? TileFocuses.invisible : TileFocuses.visible;
			this.#focussedTile.focus = currentFocusType;

			this.#onFocusUpdated.trigger({
				previouslyFocussedTileIndex: previouslyFocussedTile?.model.index ?? null,
				currentlyFocussedTileIndex: this.#focussedTile.model.index,
				previousFocusType, currentFocusType
			});

			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {number} offsetTiles The tile offset (as integer) where a positive value indicates a movement orthogonal 
	 * to the tile flow (for vertical layouts, this would be "right"), a negative value indicates a movement orthogonal 
	 * against the tile flow (for vertical layouts, this would be "left").
	 * @param {boolean} [hidden = false]
	 * @returns {boolean} true if the current focus was moved successfully, false otherwise.
	 */
	focusMoveHorizontal(offsetTiles, hidden = false) {
		Assert.numberInteger(offsetTiles, "offsetTiles");

		let nextFocussedTileIndex = null;
		let hasMultipleColumns = this.#layout.columnCount > 1;
		let focussedTileIndex = this.#focussedTile?.model.index ?? null;
		if (focussedTileIndex === null) {
			return false;
		}

		if (this.#layout.type.tileFlow === TileFlows.vertical && hasMultipleColumns) {
			nextFocussedTileIndex = this.#layout.getAdjacentTo(focussedTileIndex, offsetTiles, true, true, true);
		} else if (this.#layout.type.tileFlow === TileFlows.horizontal) {
			nextFocussedTileIndex = this.#layout.getAdjacentTo(focussedTileIndex, offsetTiles, false, false, false);
			if (offsetTiles > 0 && nextFocussedTileIndex === focussedTileIndex || nextFocussedTileIndex === null) {
				//TODO: Scroll to the "right" in the movement controller in this case and then remove this comment
			}
		}

		if (nextFocussedTileIndex !== null) {
			this.focus(nextFocussedTileIndex, hidden);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {number} offsetTiles The tile offset (as integer) where a positive value indicates a movement with the
	 * tile flow (for vertical layouts, this would be "down"), a negative value indicates a movement against the 
	 * tile flow (for vertical layouts, this would be "up").
	 * @param {boolean} [hidden = false]
	 * @returns {boolean} true if the current focus was moved successfully, false otherwise.
	 */
	focusMoveVertical(offsetTiles, hidden = false) {
		Assert.numberInteger(offsetTiles, "offsetTiles");

		let nextFocussedTileIndex = null;
		let hasMultipleColumns = this.#layout.columnCount > 1;
		let focussedTileIndex = this.#focussedTile?.model.index ?? null;
		if (focussedTileIndex === null) {
			return false;
		}      

		if (this.#layout.type.tileFlow === TileFlows.vertical) {
			nextFocussedTileIndex = this.#layout.getAdjacentTo(focussedTileIndex, offsetTiles, false, false, false);
			if (offsetTiles > 0 && nextFocussedTileIndex === focussedTileIndex || nextFocussedTileIndex === null) {
				//TODO: Scroll to the "bottom" in the movement controller in this case and then remove this comment
			}
		} else if (this.#layout.type.tileFlow === TileFlows.horizontal && hasMultipleColumns) {
			nextFocussedTileIndex = this.#layout.getAdjacentTo(focussedTileIndex, offsetTiles, true, true, true);
		}

		if (nextFocussedTileIndex !== null && nextFocussedTileIndex !== focussedTileIndex) {
			this.focus(nextFocussedTileIndex, hidden);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @returns {boolean}
	 */
	focusHide() {
		if (this.#focussedTile !== null && this.#focussedTile.focus === TileFocuses.visible) {
			this.#focussedTile.focus = TileFocuses.invisible;
			this.#onFocusUpdated.trigger({
				previouslyFocussedTileIndex: this.#focussedTile.model.index,
				currentlyFocussedTileIndex: this.#focussedTile.model.index,
				previousFocusType: TileFocuses.visible,
				currentFocusType: TileFocuses.invisible
			});
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @returns {boolean}
	 */
	focusShow() {
		if (this.#focussedTile !== null && this.#focussedTile.focus === TileFocuses.invisible) {
			this.#focussedTile.focus = TileFocuses.visible;
			this.#onFocusUpdated.trigger({
				previouslyFocussedTileIndex: this.#focussedTile.model.index,
				currentlyFocussedTileIndex: this.#focussedTile.model.index,
				previousFocusType: TileFocuses.invisible,
				currentFocusType: TileFocuses.visible
			});
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {Vector} size
	 * @throws {ArgumentError}
	 */
	resize(size) {
		Assert.vectorPositive(size, "size");
		
		if (!VU.equals(this.#layout.size, size)) {
			if (this.#layout.tilesCount > 0) {
				this.#layout = this.#layout.resizedTo(size, this.#focussedTile?.model.index ?? null);
				this.#resetCurrentAddAndTrimRecommendations();
				this.#onGridResized.trigger({ tileIndices: null });
			} else {
				this.#layout = new TileGridLayout(this.#layout.type, size);
			}
		} 
	}

	/**
	 * Automatically unsets any currently assigned reference layout, optionally assigns a new one.
	 * @param {TileGridLayoutType} [layoutType]
	 * @param {Vector} [size]
	 * @param {TileGridLayoutBase | TileGridLayoutSnapshot} [referenceLayout]
	 * @throws {ArgumentError}
	 * @throws {InvalidOperationError}
	 */
	reset(layoutType, size, referenceLayout) {
		Assert.class(layoutType, TileGridLayoutType, "layoutType");
		Assert.ifDefined(size, () => Assert.vectorPositive(size, "size"));

		this.model.clear();

		if (this.#tilesByModelIndices.size > 0) {
			// If the class responsible for mounting tiles (upon adding them into the model) didn't 
			// unmount them again after clearing the model, throw an exception to avoid weird behavior
			// with lingering tile presenters or memory leaks.
			throw new InvalidOperationError("One or more tiles couldn't be removed completely.");
		}

		this.#layout = new TileGridLayout(layoutType ?? this.#layout.type, size ?? this.#layout.size);

		if (referenceLayout != null) {
			//@ts-ignore
			this.setReferenceLayout(referenceLayout);
		} else {
			this.unsetReferenceLayout();
		}

		this.#resetCurrentAddAndTrimRecommendations();
		this.#onConfigurationChanged.trigger();
	}

	/**
	 * @param {number} tileIndex 
	 * @returns {TilePresenter?}
	 */
	getTile(tileIndex) {
		return this.#tilesByModelIndices.get(tileIndex) ?? null;
	}

	/**
	 * Generates a combined reference layout, using any currently existing reference layout and the
	 * tiles from the currently active layout.
	 * @returns {TileGridLayoutSnapshot}
	 */
	getReferenceLayout() {
		let referenceLayout = this.#layout.getSnapshot();
		
		// Ensure that the information from a previously provided reference layout doesn't get lost
		// (e.g. in case the user didn't scroll back up far enough, the information about the start
		// of the grid shouldn't be lost in such cases).
		if (this.#referenceLayoutState !== null &&
			this.#referenceLayoutState.columnCount === referenceLayout.columnCount &&
			this.#referenceLayoutState.columnWidth === referenceLayout.columnWidth) {
			for (let tileIndexKey of ClassUtils.getFieldNames(this.#referenceLayoutState.tiles)) {
				let tileIndex = parseInt(tileIndexKey);
				if (referenceLayout.tiles[tileIndex] == null) {
					referenceLayout.tiles[tileIndex] = this.#referenceLayoutState.tiles[tileIndex];
				}
			}
		}

		return referenceLayout;
	}

	#resetCurrentAddAndTrimRecommendations() {
		this.#currentAddAndTrimRecommendations = null;
	}

	/**
	 * @param {TilePresenter} tile 
	 * @throws {ArgumentError}
	 * @throws {InvalidOperationError} Is thrown when the the specified {@link tile} is not associated with the 
	 * current {@link model}.
	 */
	#mount(tile) {
		if (!this.#model.has(tile.model)) {
			throw new InvalidOperationError();
		}
		if (this.#tilesByModelIndices.has(tile.model.index)) {
			throw new InvalidOperationError();
		}
		if (!this.#layout.canAdd(tile.model.index)) {
			throw new InvalidOperationError();
		}

		let { tilePositionHint, tileColumnIndexHint } = this.#getTileMountHints(tile.model.index);

		this.#layout.add(tile.model.index, tile.contentSize ?? undefined,
			tilePositionHint, tileColumnIndexHint);
		
		tile.onContentUpdated.subscribe(this.#handleOnTileContentUpdated);
		
		this.#tilesByModelIndices.set(tile.model.index, tile);		

		this.#resetCurrentAddAndTrimRecommendations();
		this.#onTileMounted.trigger({ tileIndex: tile.model.index });
	}

	/**
	 * @param {TilePresenter} tile 
	 * @throws {ArgumentError}
	 * @throws {InvalidOperationError} Is thrown when the the specified {@link tile} is still associated with the 
	 * current {@link model}.
	 */
	#unmountTile(tile) {
		if (this.#model.has(tile.model)) {
			throw new InvalidOperationError();
		}
		if (!this.#tilesByModelIndices.has(tile.model.index)) {
			throw new InvalidOperationError();
		}
		if (!this.#layout.canRemove(tile.model.index)) {
			throw new InvalidOperationError();
		}

		this.#layout.remove(tile.model.index);
		this.#disposeTile(tile);

		this.#tilesByModelIndices.delete(tile.model.index);

		if (this.#focussedTile === tile) {
			this.#focussedTile = null;
		}

		this.#resetCurrentAddAndTrimRecommendations();
		this.#onTileUnmounted.trigger({ tileIndex: tile.model.index });
	}

	/**
	 * Only provides a tile position/column index hint if both layouts have the same column
	 * setup or if the mounted tile is part of the reference row.
	 * @param {number} tileIndex 
	 * @returns {{
	 *    tilePositionHint:number|undefined,
	 *    tileColumnIndexHint:number|undefined
	 * }}
	 */
	#getTileMountHints(tileIndex) {
		/** @type {number | undefined} */
		let tilePositionHint;
		/** @type {number | undefined} */
		let tileColumnIndexHint; 
		if (this.#referenceLayoutState !== null) {
			if (this.#referenceLayoutState instanceof TileGridLayoutBase) {
				if ((this.#referenceLayoutState.columnWidth === this.#layout.columnWidth &&
					this.#referenceLayoutState.columnCount === this.#layout.columnCount) &&
					(this.#referenceLayoutState.getReferenceRowTileIndices()
					.includes(tileIndex))) {
						tilePositionHint = this.#referenceLayoutState.getTilePosition(tileIndex)?.start;
						tileColumnIndexHint = this.#referenceLayoutState.getTileColumnIndex(tileIndex) ?? undefined;
				}
			} else {
				if ((this.#referenceLayoutState.columnWidth === this.#layout.columnWidth &&
					this.#referenceLayoutState.columnCount === this.#layout.columnCount) &&
					this.#referenceLayoutState.tiles[tileIndex] != null) {
					let tileState = this.#referenceLayoutState.tiles[tileIndex];
					tilePositionHint = tileState?.tilePosition;
					tileColumnIndexHint = tileState?.columnIndex;
				}
			}
		}
		return { tilePositionHint, tileColumnIndexHint };
	}

	/**
	 * @param {TilePresenter} tile 
	 */
	#disposeTile(tile) {
		tile.onContentUpdated.unsubscribe(this.#handleOnTileContentUpdated);
	}

	/** @type {EventHandler<TileGridModelUpdateEventArgs>} */
	#handleOnModelAdded = (args) => {
		let presenter = new TilePresenter(args.model);
		this.#mount(presenter);
	};

	/** @type {EventHandler<TileGridModelUpdateEventArgs>} */
	#handleOnModelTrimmed = (args) => {
		let presenter = this.#tilesByModelIndices.get(args.model.index) ?? null;
		if (presenter !== null) {
			this.#unmountTile(presenter);
		}
	};

	/** @type {EventHandler<void>} */
	#handleOnModelCleared = () => {
		for (let presenter of this.#tilesByModelIndices.values()) {
			this.#disposeTile(presenter);
		}

		this.#tilesByModelIndices.clear();
		this.#focussedTile = null;
		this.#layout = new TileGridLayout(this.#layout.type, this.#layout.size);

		this.#resetCurrentAddAndTrimRecommendations();
		this.#onTilesCleared.trigger();
	};

	/**
	 * @param {import("./Tile/TilePresenter.js").TileContentUpdatedEventArgs} args
	 */
	#handleOnTileContentUpdated = (args) => {
		let tile = args.tile;
		if ((tile?.contentSize != null || tile?.contentError != null) && this.#layout !== null) {
			let tileIndices = this.#layout.resizeTile(tile.model.index, tile?.contentSize ?? null);
			this.#resetCurrentAddAndTrimRecommendations();
			this.#onTilesMoved.trigger({ tileIndices });
		}
	};
}