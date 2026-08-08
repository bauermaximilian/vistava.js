// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { AbstractMemberNotImplementedError } from "../../../Errors/AbstractMemberNotImplementedError.js";
import { MathUtils } from "../../../Utils/MathUtils.js";
import { RU } from "../../../Utils/RectangleUtils.js";
import { TileFlowType } from "./TileFlowType.js";
import { TileGridLayoutColumn } from "./TileGridLayoutColumn.js";
import { TileGridLayoutType } from "./TileGridLayoutType.js";
import { ImplementationError } from "../../../Errors/ImplementationError.js";
import { VU } from "../../../Utils/VectorUtils.js";

/**
 * Defines a (serializable) object that can be created from a {@link TileGridLayout} instance and 
 * contains all required information to restore the same layout (from the same tiles) in another
 * {@link TileGridLayout} instance.
 * @typedef {object} TileGridLayoutSnapshot
 * @property {number} columnCount
 * @property {number} columnWidth
 * @property {Object<number, TileGridLayoutItemState>} tiles 
 * The state of every tile (value) associated to their tile index (key).
 */

/**
 * Defines a (serializable) object that contains all information required to restore a specific tile
 * from a specific {@link TileGridLayout} instance in another {@link TileGridLayout} instance.
 * @typedef {object} TileGridLayoutItemState
 * @property {number} columnIndex
 * @property {number} [tilePosition]
 */

/**
 * @abstract
 */
export class TileGridLayoutBase {
	/** 
	 * Gets the amount of tiles in the current layout.  
	 * @type {number}
	 */
	get tilesCount() { throw new AbstractMemberNotImplementedError(); }
	/**
	 * Gets the amount of tiles in the current layout that have non-default dimensions.
	 * @type {number}
	 */
	get tilesWithDimensionsCount() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the amount of columns in the current layout. 
	 * @type {number}
	 */
	get columnCount() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the linear length of the container. 
	 * @type {number}
	 */   
	get containerLength() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the smallest (linear) starting position of all existing columns. 
	 * @type {number?}
	 */
	get startPosition() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the largest (linear) starting position of all existing columns. 
	 * @type {number?}
	 */
	get startPositionMaximum() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the largest (linear) end position of all existing columns. 
	 * @type {number?}
	 */
	get endPosition() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the smallest (linear) end position of all existing columns.
	 * @type {number?} 
	 */
	get endPositionMinimum() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the column with the smallest tile index. 
	 * @type {number?}
	 */
	get columnWithSmallestTileIndex()  { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the column with the biggest tile index.
	 * @type {number?}
	 */
	get columnWithBiggestTileIndex()  { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the width of a single column. 
	 * @type {number}
	 */
	get columnWidth() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the width of all columns, including the {@link TileLayoutConfiguration.tileGap}, but 
	 * exluding the {@link TileLayoutConfiguration.marginWidth}. 
	 * @type {number}
	 */
	get columnsWidth() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets a value indicating whether the current grid has at least one empty column. 
	 * @type {boolean}
	 */
	get hasEmptyColumns() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the layout configuration type used to initialize the current instance. 
	 * @type {TileGridLayoutType}
	 */
	get type() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the first tile (in other words, the smallest tile index) in the current instance.
	 * @type {number?} 
	 */
	get firstTileIndex() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the last tile (in other words, the biggest tile index) in the current instance. 
	 * @type {number?}
	 */
	get lastTileIndex() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the first column that is not empty (has at least one tile in it.) 
	 * @type {number?}
	 */
	get firstNonEmptyColumn() { throw new AbstractMemberNotImplementedError(); }
	/** 
	 * Gets the index of the last column that is not empty (has at least one tile in it.) 
	 * @type {number?}
	 */
	get lastNonEmptyColumn() { throw new AbstractMemberNotImplementedError(); }
	/**
	 * Gets the size (client width and client height) of the layout as a {@link Vector}.
	 * @type {Vector}
	 */
	get size() { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} tileIndex 
	 * @returns {boolean}
	 */
	contains(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Checks whether a tile with a specified index is the first in its parent column.
	 * @param {number} tileIndex 
	 * @returns {boolean}
	 */
	isFirstInColumn(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Checks whether a tile with a specified index is the last in its parent column.
	 * @param {number} tileIndex 
	 * @returns {boolean}
	 */
	isLastInColumn(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Checks whether a tile with a specified index has actual dimensions in the grid (true) or
	 * whether temporary "default" dimensions were used while adding the tile to the grid.
	 * @param {number} tileIndex 
	 * @returns {boolean}
	 */
	hasTileDimensions(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} tileIndex 
	 * @returns {Rectangle?}
	 */
	getTileLocation(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} tileIndex 
	 * @returns {{start:number, end:number}?}
	 */
	getTilePosition(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} columnIndex 
	 * @returns {Rectangle?}
	 */
	getColumnLocation(columnIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} tileIndex
	 * @returns {number?}
	 */
	getTileColumnIndex(tileIndex) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {Vector} position 
	 * @return {number?}
	 */
	getByPosition(position) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @param {number} linearPosition 
	 * @param {number} columnIndex
	 * @returns {number?} The index of the tile closest to the specified {@link linearPosition}, 
	 * or null.
	 * @throws {ArgumentError}
	 */
	getClosestTo(linearPosition, columnIndex = 0) { throw new AbstractMemberNotImplementedError(); }
	
	/**
	 * @param {number} tileIndex The (source) index of the tile.
	 * @param {number} tileOffsetCount The amount of tiles that should be iterated from 
	 * the tile with the specified {@link tileIndex}.
	 * @param {boolean} [searchPerpendicular=false] true to search for an adjacent tile 
	 * perpendicular to the current tile flow axis, false to search on the current tile flow axis.
	 * @param {boolean} [moduloOnOverflow=false] 
	 * @param {boolean} [searchBothAxis=true] true to continue the search on the perpendicular axis
	 * of the first searched axis if an overflow occurred, false to handle the overflow in the 
	 * first searched axis.
	 * @returns {number?} The (source) index of the adjacent tile, or null.
	 */
	getAdjacentTo(tileIndex, tileOffsetCount, searchPerpendicular = false, moduloOnOverflow = false, 
		searchBothAxis = false) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Calculates the distance/offset the layout would have to be moved by so that a tile with a 
	 * specific {@link tileIndex} would be completely inside the visible area of the layout.
	 * @param {number} tileIndex 
	 * @returns {number?}
	 */
	getDistanceToVisibleArea(tileIndex) { throw new AbstractMemberNotImplementedError(); }
	
	/**
	 * @param {number} tileIndex 
	 * @param {number} [positionOffset = 0]
	 * @returns {number?}
	 * @throws {ArgumentError}
	 */
	getTileVisibility(tileIndex, positionOffset = 0) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Gets tile indices of the reference row, which can be used for restoring the layout from cache.
	 * The reference row tiles should be added to the layout first (in given ascending order),
	 * then the grid should be extended sufficiently before the reference row, then after.
	 * @param {number?} [referenceTileIndex=null] 
	 * @returns {number[]}
	 */
	getReferenceRowTileIndices(referenceTileIndex = null) { throw new AbstractMemberNotImplementedError(); }

	/**
	 * @returns {TileGridLayoutSnapshot}
	 * @throws {InvalidOperationError} Is thrown when the layout is empty.
	 */
	getSnapshot() { throw new AbstractMemberNotImplementedError(); }

	/**
	 * Counts the amount of tiles in a specific column that are outside the visible area.
	 * Only the tiles in the parent column of the tile with the {@link tileIndexMinimum} (or,
	 * if {@link fromEnd} is true, in the parent column of the tile with the {@link tileIndexMaximum})
	 * are counted.
	 * @param {boolean} [fromEnd = false] false (default) to count the out-of-bounds tiles at the 
	 * start of the column with the tile with index {@link tileIndexMinimum}; true to count the 
	 * out-of-bounds tiles at the end of the column with the tile with index {@link tileIndexMaximum}.
	 * @returns {number} The amount of tiles (either at the start or end of the column) that are
	 * "out of bounds" (offscreen).
	 */
	countColumnTilesOutOfBounds(fromEnd = false) { throw new AbstractMemberNotImplementedError(); }
}

export class TileGridLayout extends TileGridLayoutBase {
	static get screenEpsilon() { return 0.1; }
	
	get tilesCount() { return this.#tilesCount; }
	get tilesWithDimensionsCount() { return this.#dimensionsByTileIndex.size; }
	get columnCount() { return this.#columns.length; }
	get containerLength() { return this.#containerLength; }
	get startPosition() { return this.#startPosition; }
	get startPositionMaximum() { return this.#startPositionMaximum; }
	get endPosition() { return this.#endPosition; }
	get endPositionMinimum() { return this.#endPositionMinimum; }
	get columnWithSmallestTileIndex()  { return this.#columnWithTileIndexMinimum; }
	get columnWithBiggestTileIndex()  { return this.#columnWithTileIndexMaximum; }
	get columnWidth() { return this.#columns[0].width; }
	get columnsWidth() { return this.#columnsWidth; }
	get hasEmptyColumns() { return this.#hasEmptyColumns; }
	get type() { return this.#layoutType; }
	get firstTileIndex() { return this.#indexMinimum; }
	get lastTileIndex() { return this.#indexMaximum; }
	get firstNonEmptyColumn() { return this.#firstNonEmptyColumn; }
	get lastNonEmptyColumn() { return this.#lastNonEmptyColumn; }
	get size() { return this.#size; }
	get hasDisbalancedStartRow() {
		return this.#indexMinimum === 0 &&
			this.#startPosition !== null && this.#startPositionMaximum !== null &&
			Math.abs(this.#startPositionMaximum - this.#startPosition) > 1;
	}

	/** @typedef {import("../../../Utils/RectangleUtils.js").Rectangle} Rectangle */
	/** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
	/** @typedef {import("./TileGridLayoutColumn.js").TileGridLayoutItem} TileGridLayoutItem */
	/** @typedef {import("./TileFlowType.js").TileFlow} TileFlow */

	/** @readonly @type {Vector} */
	#defaultContentDimensions;

	/** @type {TileGridLayoutType} */
	#layoutType;
	/** @type {TileGridLayoutColumn[]} */
	#columns = [];
	/** 
	 * Contains the columns of every tile that is or was part of the current layout.
	 * @type {Map<number, TileGridLayoutColumn>} 
	 */
	#columnsByTileIndex = new Map();
	/** 
	 * Contains the locations of every tile that is part of the current layout.
	 * @type {Map<number, TileGridLayoutItem>}
	 */
	#tilesByTileIndex = new Map();
	/**
	 * Contains the actual original dimensions of every tile that is currently in the layout.
	 * Tiles that are currently using the "default" size are not part of this map.
	 * @type {Map<number,Vector>}
	 */
	#dimensionsByTileIndex = new Map();

	/** @type {Vector} */
	#size;
	/** @type {number} */
	#containerLength;
	/** @type {TileFlow} */
	#tileFlow;
	/** @type {number} */
	#columnsWidth;

	/** @type {number} */
	#tilesCount = 0;
	/** @type {number?} */
	#startPosition = null;
	/** @type {number?} */
	#startPositionMaximum = null;
	/** @type {number?} */
	#endPositionMinimum = null;
	/** @type {number?} */
	#endPosition = null;
	/** @type {number?} */
	#columnWithTileIndexMinimum = null;
	/** @type {number?} */
	#columnWithTileIndexMaximum = null;
	/** @type {number?} */
	#firstNonEmptyColumn = null;
	/** @type {number?} */
	#lastNonEmptyColumn = null;
	/** @type {boolean} */
	#hasEmptyColumns = true;
	/** @type {number?} */
	#indexMinimum = null;
	/** @type {number?} */
	#indexMaximum = null;

	/**
	 * @param {TileGridLayoutType} layoutType
	 * @param {Vector} size
	 * @throws {ArgumentError}
	 */
	constructor(layoutType, size) {
		super();

		Assert.vectorPositive(size, "size");
		Assert.class(layoutType, TileGridLayoutType, "layoutType");

		this.#size = size;
		this.#containerLength = TileFlowType.calculateScalar(size, layoutType.tileFlow);
		this.#layoutType = layoutType;
		this.#tileFlow = layoutType.tileFlow;
		let { columns, occupiedWidth } = TileGridLayoutColumn.initializeColumns(size, layoutType);
		this.#columns = columns;
		this.#columnsWidth = occupiedWidth;

		if (this.columnCount === 0) {
			throw new InvalidOperationError("The specified size and/or configuration " + 
				"caused the grid to have no columns, which is invalid.");
		}

		let columnWidth = this.#columns[0].width;
		this.#defaultContentDimensions = VU.new(columnWidth, columnWidth);
	}

	/**
	 * Checks whether a specific {@link tileIndex} is valid to be used for adding a new tile to the 
	 * current instance using {@link add}.
	 * A tile index is valid for adding if it is a valid finite number greater than/equal to 0 and if 
	 * the layout is either empty or the tile index the single increment of the current 
	 * {@link tileIndexMaximum} or a single decrement of the current {@link tileIndexMinimum}.
	 * @param {number?} tileIndex 
	 * @returns {boolean}
	 */
	canAdd(tileIndex) {
		if (tileIndex == null || typeof (tileIndex) !== "number" || tileIndex < 0 ||
			!isFinite(tileIndex) || this.contains(tileIndex) ||
			(this.#indexMaximum !== null && this.#indexMinimum !== null && 
			tileIndex !== (this.#indexMinimum - 1) && (tileIndex !== (this.#indexMaximum + 1)))) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Checks whether a specific {@link tileIndex} is valid to be used for removing a tile from the
	 * current instance using {@link remove}.
	 * A tile index is valid for removal if it is equal to either {@link tileIndexMinimum} or
	 * {@link tileIndexMaximum}.
	 * @param {number?} tileIndex 
	 * @returns {boolean}
	 */
	canRemove(tileIndex) {
		if (tileIndex == null || typeof (tileIndex) !== "number" || 
			this.#indexMinimum === null || this.#indexMaximum === null ||
			(tileIndex !== this.#indexMinimum && tileIndex !== this.#indexMaximum)) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * @param {number} tileIndex
	 * @param {Vector} [tileContentDimensions]
	 * @param {number} [positionHint]
	 * @param {number} [columnIndexHint]
	 * @returns {import("./TileGridLayoutColumn.js").TileGridLayoutMountedItem}
	 * @throws {ArgumentError}
	 * @throws {InvalidOperationError}
	 */
	add(tileIndex, tileContentDimensions, positionHint, columnIndexHint) {
		Assert.ifDefined(tileContentDimensions,
			() => Assert.vectorPositive(tileContentDimensions, "tileContentDimensions"));
		Assert.ifDefined(positionHint, () => Assert.number(positionHint, "positionHint"));
		Assert.ifDefined(columnIndexHint,
			() => Assert.numberIntegerPositiveOrZero(columnIndexHint, "columnIndexHint"));

		if (!this.canAdd(tileIndex)) {
			throw new InvalidOperationError("The tile index is either invalid, already used, or " +
				"neither a (single) increment of the current maximum or decrement of the current " +
				"minimum tile index.");
		}

		if (tileContentDimensions != null) {
			this.#dimensionsByTileIndex.set(tileIndex, tileContentDimensions);
		} else {
			let columnWidth = this.#columns[0].width;
			tileContentDimensions = VU.new(columnWidth, columnWidth);
		}

		let prepend = this.#indexMinimum !== null && tileIndex < this.#indexMinimum;
		let column = this.#determineColumnToAddTile(tileIndex, tileContentDimensions,
			columnIndexHint ?? null, prepend);

		let isFirstTileInGrid = this.#tilesByTileIndex.size === 0;
		let isFirstRowInCollection = tileIndex < this.#columns.length;
		let isLastRowInCollection = this.#indexMaximum !== null ?
			Math.floor(this.#indexMaximum / this.columnCount) === Math.floor(tileIndex / this.columnCount) : false;
		let tile = column.create(tileIndex, tileContentDimensions, prepend, positionHint,
			isFirstTileInGrid, isFirstRowInCollection, isLastRowInCollection);
		column.add(tile);
		this.#columnsByTileIndex.set(tileIndex, column);
		this.#tilesByTileIndex.set(tileIndex, tile);
		this.#updateCachedLayoutProperties();

		return { ...tile };
	}

	/**
	 * @param {number} tileIndex
	 */
	remove(tileIndex) {
		if (!this.canRemove(tileIndex)) {
			throw new InvalidOperationError("The layout is either empty or the tile index is not " +
				"equal to either the current minimum nor the maximum tile index.");
		}

		let column = this.#columns[(tileIndex === this.#indexMinimum ?
			this.#columnWithTileIndexMinimum : this.#columnWithTileIndexMaximum) ?? -1];
		let trimmedItem = column.remove(tileIndex);
		this.#tilesByTileIndex.delete(trimmedItem.index);
		this.#dimensionsByTileIndex.delete(tileIndex);
		this.#updateCachedLayoutProperties();
		return trimmedItem.index;
	}

	/**
	 * @param {number} offset 
	 * @param {number} [startPositionMinimum] 
	 * @param {number} [endPositionMaximum] 
	 * @returns {boolean} True if the layout (and all columns) were moved equally by the 
	 * full {@link offset}, false otherwise.
	 */
	move(offset, startPositionMinimum, endPositionMaximum) {
		let clampedMinimum = 0, clampedMaximum = 0;
		for (let column of this.#columns) {
			let clampedColumnMovementOffset =
				column.move(offset, startPositionMinimum, endPositionMaximum);
			clampedMaximum = Math.max(clampedMaximum, clampedColumnMovementOffset);   
			clampedMinimum = Math.min(clampedMinimum, clampedColumnMovementOffset);    
		}

		if (clampedMinimum !== clampedMaximum) {
			this.#updateCachedLayoutProperties();
		} else {
			this.#updateCachedLayoutPropertiesByOffset(offset - clampedMaximum);
		}

		return clampedMaximum < TileGridLayout.screenEpsilon;
	}

	/**
	 * @param {number} tileIndex
	 * @param {Vector?} tileContentDimensions
	 * @returns {number[]} The indices of the updated tiles.
	 * @throws {ArgumentError}
	 */
	resizeTile(tileIndex, tileContentDimensions) {
		tileContentDimensions ??= this.#defaultContentDimensions;
		
		for (let column of this.#columns) {
			let tile = column.get(tileIndex);
			if (tile !== null) {
				let tileEndPosition = TileFlowType.calculateScalar(tile.x, tile.y, this.#tileFlow) +
					TileFlowType.calculateScalar(tile.width, tile.height, this.#tileFlow);
				let invert = (column.tileIndexReference !== null && tileIndex < column.tileIndexReference) ||
					(tileEndPosition <= 0 && column.tileIndexReference !== tileIndex);
				let updatedTileIndicies = column.resizeTile(tileIndex, tileContentDimensions, invert);
				this.#dimensionsByTileIndex.set(tileIndex, tileContentDimensions);
				this.#updateCachedLayoutProperties();
				//let tileLocation = this.getTileLocation(tileIndex);
				//console.log(`Resized #${tileIndex ?? 0} (${tileLocation?.width}x${tileLocation?.height}, I=${invert})`);
				return updatedTileIndicies;
			}
		}
		throw new ArgumentError("The specified tile doesn't exist.");
	}

	/**
	 * @param {Vector} newSize 
	 * @param {number?} [focussedTileIndex=null]
	 * @returns {TileGridLayout}
	 */
	resizedTo(newSize, focussedTileIndex = null) {
		if (focussedTileIndex !== null && !this.contains(focussedTileIndex)) {
			throw new ArgumentError("The specified focussed tile doesn't exist in the layout.");
		}
		
		// If only the length of the container was updated, the layout doesn't have to be rebuilt - 
		// changing the containerLength and returning this instance will suffice.
		let resizedLayout = new TileGridLayout(this.type, newSize);
		if (resizedLayout.containerLength !== this.containerLength && 
			resizedLayout.columnsWidth === this.columnsWidth &&
			resizedLayout.type.marginWidth === this.type.marginWidth) {
			this.#containerLength = resizedLayout.containerLength;
			this.#size = newSize;
			return this;
		}

		if (this.firstTileIndex !== null && this.lastTileIndex !== null) {
			if (resizedLayout.columnCount === this.columnCount) {
				// If the amount of columns didn't change during resizing, just copy the entire grid with all tile
				// parameters (because only the padding of the layout will change, but not the "relative" tile
				// positions within their columns).
				for (let tileIndex = this.firstTileIndex; tileIndex <= this.lastTileIndex; tileIndex++) {
					let tileLocation = this.getTileLocation(tileIndex);
					if (tileLocation === null) { throw new ImplementationError(); }
					let tileDimensions = VU.new(tileLocation.width, tileLocation.height);
					let tilePosition = TileFlowType.calculateScalar(tileLocation.x, tileLocation.y, this.#tileFlow);
					let tileColumnIndex = this.getTileColumnIndex(tileIndex);
					if (tileColumnIndex === null) { throw new ImplementationError(); }
					resizedLayout.add(tileIndex, tileDimensions, tilePosition, tileColumnIndex);
				}
			} else {
				// Get the properties of the reference tile, which the user will use as optical reference point 
				// to orient themselves in the layout, and then copy that tile into the resized grid maintaining
				// the current position (but likely being placed in another column).
				let referenceTileIndex = focussedTileIndex ?? this.firstTileIndex;
				let referenceTileLocation = this.getTileLocation(referenceTileIndex);
				if (referenceTileLocation === null) { throw new ImplementationError(); }
				let referenceTileDimensions = VU.new(referenceTileLocation.width, referenceTileLocation.height);
				let referenceTilePosition = TileFlowType.calculateScalar(referenceTileLocation.x,
					referenceTileLocation.y, this.#tileFlow);
				let referenceTileLength = TileFlowType.calculateScalar(referenceTileLocation.width,
					referenceTileLocation.height, this.#tileFlow);
				
				// If all tiles preceding the reference tile have the same dimensions, the reference row
				// "center align" optimization in the "copyIntoNewLayout" below shouldn't be done (as this will 
				// mess up an otherwise normal-looking layout).
				let allPrecedingTilesHaveSameDimensions = true;
				for (let i = referenceTileIndex - 1; i >= 0; i--) {
					let tileLocation = this.getTileLocation(i);
					let tileDimensions = VU.new(tileLocation?.width ?? 0, tileLocation?.height ?? 0);
					if (!VU.equals(tileDimensions, referenceTileDimensions)) {
						allPrecedingTilesHaveSameDimensions = false;
						break;
					}
				}
				
				resizedLayout.add(referenceTileIndex, referenceTileDimensions, referenceTilePosition);
				let referenceTileColumnIndex = resizedLayout.getTileColumnIndex(referenceTileIndex);
				if (referenceTileColumnIndex === null) { throw new ImplementationError(); }

				let referenceRowStartIndex = referenceTileIndex, referenceRowEndIndex = referenceTileIndex;
				const copyIntoNewLayout = (/** @type {number} */ tileIndex, /** @type {boolean} */ isReferenceRow) => {
					let tileLocation = this.getTileLocation(tileIndex);
					if (tileLocation === null) { throw new ImplementationError(); }
					let tileDimensions = VU.new(tileLocation.width, tileLocation.height);
					let tileLength = TileFlowType.calculateScalar(tileLocation.width,
						tileLocation.height, this.#tileFlow);
					let positionHint = undefined;
					if (isReferenceRow) {
						referenceRowStartIndex = Math.min(referenceRowStartIndex, tileIndex);
						referenceRowEndIndex = Math.max(referenceRowEndIndex, tileIndex);
						// Unless the copied tile is in the very first row of the layout, center-align the new 
						// tile position using the reference tile position and length so the reference row doesn't 
						// look like the start of the grid (with all tiles having the same start position).
						if ((tileIndex / resizedLayout.columnCount) > 1 && !allPrecedingTilesHaveSameDimensions) {
							positionHint = referenceTilePosition - (tileLength - referenceTileLength) / 2;
						} else {
							positionHint = referenceTilePosition;
						}
					} else {
						positionHint = referenceTilePosition - tileLength - this.#layoutType.tileGap;
					}
					resizedLayout.add(tileIndex, tileDimensions, positionHint);
				};

				// Copy the tiles before the reference tile until the start of the row (the first column) 
				// or the start of the available tiles from the current layout is reached.
				if (referenceTileColumnIndex > 0) {
					for (let tileIndex = referenceTileIndex - 1; tileIndex >= this.firstTileIndex; tileIndex--) {
						copyIntoNewLayout(tileIndex, true);
						let tileColumnIndex = resizedLayout.getTileColumnIndex(tileIndex);
						if (tileColumnIndex === null || tileColumnIndex >= referenceTileColumnIndex) {
							throw new ImplementationError();
						} else if (tileColumnIndex === 0) {
							break;
						}
					}
				}

				// Copy the tiles after the reference tile until the end of the row (the last column)
				// or the end of the available tiles from the current layout is reached.
				if ((referenceTileColumnIndex + 1) < resizedLayout.columnCount) {
					for (let tileIndex = referenceTileIndex + 1; tileIndex <= this.lastTileIndex; tileIndex++) {
						copyIntoNewLayout(tileIndex, true);
						let tileColumnIndex = resizedLayout.getTileColumnIndex(tileIndex);
						if (tileColumnIndex === null || tileColumnIndex <= referenceTileColumnIndex) {
							throw new ImplementationError();
						} else if (tileColumnIndex === (resizedLayout.columnCount - 1)) {
							break;
						}
					}
				}

				// Copy the remaining tiles before and after the newly created "reference row" in the new layout
				// from the old layout.
				for (let tileIndex = referenceRowStartIndex - 1; tileIndex >= this.firstTileIndex; tileIndex--) {
					copyIntoNewLayout(tileIndex, false);
				}
				for (let tileIndex = referenceRowEndIndex + 1; tileIndex <= this.lastTileIndex; tileIndex++) {
					copyIntoNewLayout(tileIndex, false);
				}
			}
		}

		return resizedLayout;
	}

	contains(/** @type {number} */ tileIndex) {
		return this.#tilesByTileIndex.has(tileIndex);
	}

	isFirstInColumn(/** @type {number} */ tileIndex) {
		for (let i = 0; i < this.#columns.length; i++) {
			if (this.#columns[i].first?.index === tileIndex) {
				return true;
			}
		}
		return false;
	}

	isLastInColumn(/** @type {number} */ tileIndex) {
		for (let i = 0; i < this.#columns.length; i++) {
			if (this.#columns[i].last?.index === tileIndex) {
				return true;
			}
		}
		return false;
	}

	hasTileDimensions(/** @type {number} */ tileIndex) {
		return this.#dimensionsByTileIndex.has(tileIndex);
	}

	getTileLocation(/** @type {number} */ tileIndex) {
		return RU.clone(this.#tilesByTileIndex.get(tileIndex) ?? null);
	}

	getColumnLocation(/** @type {number} */ columnIndex) {
		return this.#columns[columnIndex]?.location ?? null;
	}

	getTilePosition(/** @type {number} */ tileIndex) {
		let tile = this.#tilesByTileIndex.get(tileIndex);
		if (tile != null) {
			let tilePosition = TileFlowType.calculateScalar(tile.x, tile.y, this.#tileFlow);
			let tileLength = TileFlowType.calculateScalar(tile.width, tile.height, this.#tileFlow);
			let tileEndPosition = tilePosition + tileLength;
			return { start: tilePosition, end: tileEndPosition };
		} else {
			return null;
		}
	}

	getTileColumnIndex(/** @type {number} */ tileIndex) {
		if (this.#tilesByTileIndex.has(tileIndex)) {
			return this.#columnsByTileIndex.get(tileIndex)?.index ?? null;
		} else {
			return null;
		}
	}

	getByPosition(/** @type {Vector} */ position) {
		for (let column of this.#columns) {
			let columnItem = column.getByPosition(position);
			if (columnItem !== null) {
				return columnItem.index;
			}
		}
		return null;
	}

	getClosestTo(/** @type {number} */ linearPosition, /** @type {number} */ columnIndex = 0) {
		if (columnIndex >= 0 && columnIndex < this.#columns.length) {
			let column = this.#columns[columnIndex];

			const defaultTileLength = 100;
			return column.getClosestTo(linearPosition, defaultTileLength)?.index ?? null;
		} else {
			return null;
		}
	}
	
	getAdjacentTo(/** @type {number} */ tileIndex, /** @type {number} */ tileOffsetCount,
		/** @type {boolean} */ searchPerpendicular = false,
		/** @type {boolean} */ moduloOnOverflow = false,
		/** @type {boolean} */ searchBothAxis = false) {
		if (searchPerpendicular) {
			return this.#getPerpendicularAdjacentTo(tileIndex, tileOffsetCount, moduloOnOverflow, 
				searchBothAxis);
		} else {
			return this.#getParallelAdjacentTo(tileIndex, tileOffsetCount, moduloOnOverflow, 
				searchBothAxis);
		}
	}

	getDistanceToVisibleArea(/** @type {number} */ tileIndex) {
		if (this.#startPosition === null || this.#startPositionMaximum === null || this.#endPosition === null ||
			this.#endPositionMinimum === null || this.#indexMinimum === null ||
			!this.#dimensionsByTileIndex.has(tileIndex)) {
			return null;
		}

		let tile = this.getTilePosition(tileIndex)
		if (tile === null) {
			return null;
		}

		if (this.isFirstInColumn(tileIndex)) {
			tile.start -= this.type.paddingStart;
		}
		if (this.isLastInColumn(tileIndex)) {
			tile.end += this.type.paddingEnd;
		}

		let offset = 0;
		if (tile.start < 0) {
			offset = -tile.start;
		} else if (tile.end > this.containerLength) {
			offset = this.containerLength - tile.end;
		}

		if (offset > 0 && this.#indexMinimum < this.columnCount &&
			(this.#startPositionMaximum + offset) > -1 &&
			(this.#startPosition + offset) < 1) {
			offset = -this.#startPosition;
		}
		// else if (offset < 0 &&
		//    (this.#endPositionMinimum + offset) < (this.containerLength + 1) &&
		//    (this.#endPosition + offset) > (this.containerLength - 1)) {
		//    offset = (-this.#endPosition - this.containerLength);
		// }

		return offset;
	}

	getTileVisibility(/** @type {number} */ tileIndex, /** @type {number} */ positionOffset = 0) {
		let tile = this.#tilesByTileIndex.get(tileIndex);
		if (tile != null) {
			let tilePosition = TileFlowType.calculateScalar(tile.x, tile.y, this.#tileFlow) + positionOffset;
			let tileLength = TileFlowType.calculateScalar(tile.width, tile.height, this.#tileFlow);
			let tileEndPosition = tilePosition + tileLength;
			let visibility = 1;

			if (tilePosition < 0) {
				visibility = 1 - (tilePosition / (-tileLength));
			} else if (tileEndPosition > this.#containerLength) {
				visibility = 1 - (tileEndPosition - this.#containerLength) / tileLength;
			}

			return Math.max(Math.min(visibility, 1), 0);
		} else {
			return null;
		}
	}
	
	getReferenceRowTileIndices(/** @type {number?} */ referenceTileIndex = null) {
		referenceTileIndex ??= this.#getFocussedTileCandidateIndex();
		if (referenceTileIndex === null) {
			return [];
		}

		let tileIndices = [];
		let columnIndexStart = this.#columnsByTileIndex.get(referenceTileIndex)?.index ?? null;
		if (columnIndexStart === null) {
			throw new ImplementationError();
		}

		let tileIndex = referenceTileIndex;
		/** @type {number?} */
		let tileColumnIndex = columnIndexStart;
		/** @type {number?} */
		let lastTileColumnIndex = tileColumnIndex;
		while (tileColumnIndex != null && lastTileColumnIndex !== null && tileColumnIndex >= lastTileColumnIndex) {
			tileIndices.push(tileIndex);
			lastTileColumnIndex = tileColumnIndex;
			tileColumnIndex = this.#columnsByTileIndex.get(++tileIndex)?.index ?? null;
		}

		if (columnIndexStart > 0) {
			tileIndex = referenceTileIndex - 1;
			tileColumnIndex = this.#columnsByTileIndex.get(tileIndex)?.index ?? null;
			lastTileColumnIndex = tileColumnIndex;
			while (tileColumnIndex != null && lastTileColumnIndex !== null && tileColumnIndex <= lastTileColumnIndex) {
				tileIndices.push(tileIndex);
				tileColumnIndex = this.#columnsByTileIndex.get(--tileIndex)?.index ?? null;
			}
		}

		tileIndices.sort((a, b) => a - b);

		return tileIndices;
	}

	/**
	 * @returns {TileGridLayoutSnapshot}
	 */
	getSnapshot() {
		/** @type {TileGridLayoutSnapshot} */
		let state = {
			columnCount: this.#columns.length,
			columnWidth: this.columnWidth,
			tiles: {}
		};

		for (let tileColumn of this.#columnsByTileIndex) {
			let tileIndex = tileColumn[0];
			let column = tileColumn[1];
			let tile = this.#tilesByTileIndex.get(tileIndex) ?? null;
			let tilePosition = tile !== null ?
				TileFlowType.calculateScalar(tile.x, tile.y, this.#tileFlow) : undefined;
			state.tiles[tileIndex] = { columnIndex: column.index, tilePosition }
		}

		return state;
	}

	countColumnTilesOutOfBounds(/** @type {boolean} */ fromEnd = false) {
		if (this.#indexMinimum !== null && this.#indexMaximum !== null) {
			let column = this.#columnsByTileIndex.get(fromEnd ? this.#indexMaximum : this.#indexMinimum);
			if (column != null) {
				return this.#countColumnTilesOutOfBounds(column, fromEnd);
			} else {
				return 0;
			}
		} else {
			return 0;
		}
	}

	countColumnTilesOutOfBoundsMinimum(/** @type {boolean} */ fromEnd = false) {
		let tileCount = Number.MAX_SAFE_INTEGER;
		for (let column of this.#columns) {
			let columnTileCount = this.#countColumnTilesOutOfBounds(column, fromEnd);
			tileCount = Math.min(tileCount, columnTileCount);
		}
		if (tileCount === Number.MAX_SAFE_INTEGER) {
			return 0;
		} else {
			return tileCount;
		}
	}

	countColumnTilesOutOfBoundsMaximum(/** @type {boolean} */ fromEnd = false) {
		let tileCount = Number.MIN_SAFE_INTEGER;
		for (let column of this.#columns) {
			let columnTileCount = this.#countColumnTilesOutOfBounds(column, fromEnd);
			tileCount = Math.max(tileCount, columnTileCount);
		}
		if (tileCount === Number.MIN_SAFE_INTEGER) {
			return 0;
		} else {
			return tileCount;
		}
	}

	/**
	 * 
	 * @param {TileGridLayoutColumn} column 
	 * @param {boolean} fromEnd
	 * @returns 
	 */
	#countColumnTilesOutOfBounds(column, fromEnd) {
		if (this.#indexMinimum !== null && this.#indexMaximum !== null) {
			if (fromEnd) {
				return column.countWhile(item => TileFlowType.calculateScalar(item.x, item.y,
					this.#tileFlow) > this.#containerLength, true) ?? 0;
			} else {
				return column.countWhile(item => (
					TileFlowType.calculateScalar(item.x, item.y, this.#tileFlow) +
					TileFlowType.calculateScalar(item.width, item.height, this.#tileFlow) < 0)) ?? 0;
			}
		} else {
			return 0;
		}
	}

	/**
	 * @returns {number?}
	 */
	#getFocussedTileCandidateIndex() {
		return this.#columns[0].getClosestTo(0, this.#containerLength)?.index ?? this.firstTileIndex;
	}

	/**
	 * @param {number} tileIndex
	 * @param {number} tileOffsetCount
	 * @param {boolean} moduloOnOverflow
	 * @param {boolean} allowMultiStageSearch
	 * @returns {number?}
	 */
	#getParallelAdjacentTo(tileIndex, tileOffsetCount, moduloOnOverflow, allowMultiStageSearch) {
		/** @type {number?} */
		let targetTileIndex = tileIndex;
		let sourceColumn = this.#columnsByTileIndex.get(targetTileIndex) ?? null;
		if (sourceColumn !== null) {
			let skipModuloOnOverflow = 
				(tileIndex === this.#indexMinimum && tileOffsetCount < 0) || 
				(tileIndex === this.#indexMaximum && tileOffsetCount > 0);

			let adjacentTileParams = sourceColumn.getAdjacentTo(targetTileIndex, tileOffsetCount,
				moduloOnOverflow && !skipModuloOnOverflow);

			if (adjacentTileParams.overflowCycles < 0 && allowMultiStageSearch) {
				targetTileIndex = this.#getPerpendicularAdjacentTo(targetTileIndex, 
					adjacentTileParams.overflowCycles, moduloOnOverflow && !skipModuloOnOverflow, false);
				if (targetTileIndex !== null) {
					sourceColumn = this.#columnsByTileIndex.get(targetTileIndex) ?? sourceColumn;
					adjacentTileParams = sourceColumn.getAdjacentTo(targetTileIndex, tileOffsetCount,
						moduloOnOverflow && !skipModuloOnOverflow);
				}            
			}

			targetTileIndex = adjacentTileParams.location?.index ?? null;

			if (adjacentTileParams.overflowCycles > 0 && allowMultiStageSearch &&
				targetTileIndex !== null) {
				return this.#getPerpendicularAdjacentTo(targetTileIndex, 
					adjacentTileParams.overflowCycles, moduloOnOverflow && !skipModuloOnOverflow, false);
			} else {
				return targetTileIndex;
			}
		}

		return null;
	}

	/**
	 * @param {number} tileIndex
	 * @param {number} tileOffsetCount
	 * @param {boolean} moduloOnOverflow
	 * @param {boolean} allowMultiStageSearch
	 * @returns {number?}
	 */
	#getPerpendicularAdjacentTo(tileIndex, tileOffsetCount, moduloOnOverflow, 
		allowMultiStageSearch) {
		/** @type {number?} */
		let targetTileIndex = tileIndex;
		let sourceColumn = this.#columnsByTileIndex.get(targetTileIndex) ?? null;
		if (sourceColumn !== null) {
			let skipModuloOnOverflow = 
				(tileIndex === this.#indexMinimum && tileOffsetCount < 0) || 
				(tileIndex === this.#indexMaximum && tileOffsetCount > 0);
			let sourceColumnIndex = this.#columns.indexOf(sourceColumn);
			let targetColumnIndex = sourceColumnIndex + tileOffsetCount;

			let overflowCycles = 0;

			if ((targetColumnIndex < 0 || targetColumnIndex >= this.#columns.length) && 
				moduloOnOverflow && !skipModuloOnOverflow) {
				overflowCycles = Math.floor(targetColumnIndex / this.#columns.length);
				targetColumnIndex = MathUtils.moduloUnsigned(targetColumnIndex, this.#columns.length);
			}

			targetColumnIndex = Math.max(Math.min(targetColumnIndex, this.#columns.length - 1), 0);

			if (overflowCycles < 0 && allowMultiStageSearch) {
				targetTileIndex = this.#getParallelAdjacentTo(targetTileIndex, overflowCycles, 
					moduloOnOverflow && !skipModuloOnOverflow, false);
			}
			
			let targetColumn = this.#columns[targetColumnIndex];
			let tileLocation = targetTileIndex !== null ? this.getTileLocation(targetTileIndex) : null;

			if (tileLocation !== null) {
				targetTileIndex = targetColumn.getClosestTo(tileLocation)?.index ?? null;
			}

			if (overflowCycles > 0 && allowMultiStageSearch && targetTileIndex !== null) {
				return this.#getParallelAdjacentTo(targetTileIndex, overflowCycles,
					moduloOnOverflow && !skipModuloOnOverflow, false);
			} else {
				return targetTileIndex;
			}
		}

		return null;
	}

	/**
	 * @param {number} offset
	 */
	#updateCachedLayoutPropertiesByOffset(offset) {
		if (this.#startPosition !== null)  {
			this.#startPosition += offset;
		}
		if (this.#startPositionMaximum !== null)  {
			this.#startPositionMaximum += offset;
		}
		if (this.#endPositionMinimum !== null)  {
			this.#endPositionMinimum += offset;
		}
		if (this.#endPosition !== null)  {
			this.#endPosition += offset;
		}
	}

	#updateCachedLayoutProperties() {
		this.#startPosition = null; 
		this.#startPositionMaximum = null;
		this.#endPositionMinimum = null; 
		this.#endPosition = null;
		this.#columnWithTileIndexMinimum = null;
		this.#columnWithTileIndexMaximum = null;
		this.#hasEmptyColumns = false;
		this.#indexMinimum = null;
		this.#indexMaximum = null;
		this.#tilesCount = 0;
		this.#firstNonEmptyColumn = null;
		this.#lastNonEmptyColumn = null;

		for (let i = 0; i < this.#columns.length; i++) {
			let column = this.#columns[i];

			this.#tilesCount += column.count;

			if (column.tileIndexMinimum !== null && 
				(this.#indexMinimum === null || column.tileIndexMinimum < this.#indexMinimum)) {
				this.#indexMinimum = column.tileIndexMinimum;
				this.#columnWithTileIndexMinimum = i;
			}
			if (column.tileIndexMaximum !== null && 
				(this.#indexMaximum === null || column.tileIndexMaximum > this.#indexMaximum)) {
				this.#indexMaximum = column.tileIndexMaximum;
				this.#columnWithTileIndexMaximum = i;
			}

			if (column.count !== 0) {
				this.#lastNonEmptyColumn = i;
				if (this.#firstNonEmptyColumn === null) {
					this.#firstNonEmptyColumn = i;
				}
			} else {
				this.#hasEmptyColumns = true;
			}

			let startPosition = column.startPosition;
			if (startPosition !== null) {
				let endPosition = startPosition + column.length;

				if (this.#startPosition === null || startPosition < this.#startPosition) {
					this.#startPosition = startPosition;
				}
				if (this.#startPositionMaximum === null || startPosition > this.#startPositionMaximum) {
					this.#startPositionMaximum = startPosition;
				}

				if (this.#endPositionMinimum === null || endPosition < this.#endPositionMinimum) {
					this.#endPositionMinimum = endPosition;
				}
				if (this.#endPosition === null || endPosition > this.#endPosition) {
					this.#endPosition = endPosition;
				}
			}         
		}

		if (this.#columnWithTileIndexMinimum === null && this.#columns.length > 0) {
			this.#columnWithTileIndexMinimum = 0;
		}
		if (this.#columnWithTileIndexMaximum === null && this.#columns.length > 0) {
			this.#columnWithTileIndexMaximum = 0;
		}
	}

	/**
	 * @param {number} tileIndex 
	 * @returns {number?}
	 */
	#findColumnIndexOfTile(tileIndex) {
		for (let i = 0; i < this.#columns.length; i++) {
			if (this.#columns[i].get(tileIndex) !== null) {
				return i;
			}
		}
		return null;
	}

	/**
	 * @param {TileGridLayoutItem} precedingTile
	 * @param {number} tileIndex
	 * @param {Vector} tileContentDimensions
	 * @param {number} columnCandidateIndex
	 * @param {boolean} prepend
	 * @param {boolean} [columnCandidateIsInNewRow = false]
	 * @returns {TileGridLayoutColumn?}
	 */
	#determineColumnToAddTileForFlow(precedingTile, tileIndex, tileContentDimensions, 
		columnCandidateIndex, prepend, columnCandidateIsInNewRow = false) {             
		const positionDifferenceTreshold = 0.76;

		if (columnCandidateIndex >= 0 && columnCandidateIndex < this.#columns.length) {
			let tileFlow = this.#layoutType.tileFlow;
			let targetColumn = this.#columns[columnCandidateIndex];
			
			let newTileIsFirstTileInGrid = this.#tilesByTileIndex.size === 0;
			let newTileIsInFirstRow = tileIndex < this.#columns.length;
			let newTileIsInLastRow = this.#indexMaximum !== null ?
				Math.floor(this.#indexMaximum / this.columnCount) === Math.floor(tileIndex / this.columnCount) : false;
			
			let newTile = targetColumn.create(tileIndex, tileContentDimensions, prepend,
				null, newTileIsFirstTileInGrid, newTileIsInFirstRow, newTileIsInLastRow);

			let precedingTilePosition = TileFlowType.calculateScalar(precedingTile.x, precedingTile.y, tileFlow);
			let precedingTileLength = TileFlowType.calculateScalar(precedingTile.width, precedingTile.height, tileFlow);
			let newTilePosition = TileFlowType.calculateScalar(newTile.x, newTile.y, tileFlow);
			let newTileLength = TileFlowType.calculateScalar(newTile.width, newTile.height, tileFlow);

			let relativePositionDifference = targetColumn.calculateRelativeTilePositionDifference(
				precedingTilePosition, precedingTileLength, newTilePosition,
				newTileLength, columnCandidateIsInNewRow ? (prepend ? -1 : 1) : 0);

			if (relativePositionDifference < positionDifferenceTreshold) {
				return this.#columns[columnCandidateIndex];
			}
		}

		return null;
	}

	/**
	 * @param {boolean} prepend
	 * @returns {{currentDisbalance:number, targetColumn: TileGridLayoutColumn?}}
	 */
	#determineColumnToAddTileForBalance(prepend) {
		let positionMinimum = null, positionMaximum = null;
		let columnPositionMinimum = null, columnPositionMaximum = null;
		let tileFlow = this.#layoutType.tileFlow;

		for (let i = 0; i < this.#columns.length; i++) {
			let column = this.#columns[i];

			let positionToCompare = null;
			if (prepend && column.first != null) {
				positionToCompare = TileFlowType.calculateScalar(column.first.x, column.first.y, tileFlow);
			} else if (column.last != null) {
				positionToCompare = positionToCompare =
					TileFlowType.calculateScalar(column.last.x, column.last.y, tileFlow) + 
					TileFlowType.calculateScalar(column.last.width, column.last.height, tileFlow);
			} else {
				positionToCompare = 0;
			}

			if (positionToCompare !== null) {
				if (positionMinimum === null || positionToCompare < positionMinimum) {
					positionMinimum = positionToCompare;
					columnPositionMinimum = i;
				} 
				if (positionMaximum === null || positionToCompare > positionMaximum) {
					positionMaximum = positionToCompare;
					columnPositionMaximum = i;
				}
			}
		}

		if (positionMaximum !== null && columnPositionMaximum !== null &&
			positionMinimum !== null && columnPositionMinimum !== null) {
			return {
				currentDisbalance: Math.abs(positionMaximum - positionMinimum),
				targetColumn: this.#columns[prepend ? columnPositionMaximum : columnPositionMinimum]
			};
		} else {
			return {
				currentDisbalance: 0,
				targetColumn: null
			}
		}
	}

	/**
	 * @param {number} tileIndex
	 * @param {Vector} tileContentDimensions
	 * @param {number?} columnIndexHint 
	 * @param {boolean} prepend
	 * @returns {TileGridLayoutColumn}
	 */
	#determineColumnToAddTile(tileIndex, tileContentDimensions, columnIndexHint, prepend) {
		const disbalanceTreshold = 600;

		// If a tile with the specified index was part of the grid before (and no column index hint is
		// provided), reuse the previous column index as hint.
		let previousTileColumn = this.#columnsByTileIndex.get(tileIndex);
		if (previousTileColumn?.index != null) {
			columnIndexHint = previousTileColumn.index;
		}

		let previousTileIndex = tileIndex + (prepend ? 1 : -1);
		let previousTile = 
			this.#tilesByTileIndex.get(previousTileIndex) ?? null;
		let previousTileColumnIndex = this.#findColumnIndexOfTile(previousTileIndex);
		let columnOffsetFactor = prepend ? -1 : 1;
		let newlineColumnIndex = prepend ? (this.#columns.length - 1) : 0;

		let targetColumn = null;

		// The positions of the first items that would build the first row should always be the same.
		// When building a layout from the middle of a collection without hints, assume the previous 
		// items being stacked with tileIndex % columns.length and create the first grid row as such.
		if (tileIndex < this.#columns.length || (this.#hasEmptyColumns && columnIndexHint === null)) {
			targetColumn = this.#columns[tileIndex % this.#columns.length];
		} else if (columnIndexHint !== null &&
			columnIndexHint >= 0 && columnIndexHint < this.#columns.length) {
			targetColumn = this.#columns[columnIndexHint];
		} else if (previousTile !== null && previousTileColumnIndex !== null) {
			let { currentDisbalance, targetColumn: targetColumnToRestoreBalance } = 
				this.#determineColumnToAddTileForBalance(prepend);

			// If the disbalance is too big, balance the columns out in any case.
			if (currentDisbalance > disbalanceTreshold) {
				targetColumn = targetColumnToRestoreBalance;
			} else { // Otherwise, go with the next best tile to maintain a "reading flow".
				// "Next neighbor" tile
				targetColumn = this.#determineColumnToAddTileForFlow(previousTile, tileIndex,
					tileContentDimensions, previousTileColumnIndex + columnOffsetFactor * 1, prepend);
				// "Overnext neighbor" tile (with a single column gap in between)
				if (targetColumn === null) {
					targetColumn = this.#determineColumnToAddTileForFlow(previousTile, tileIndex,
						tileContentDimensions, previousTileColumnIndex + columnOffsetFactor * 2, prepend);
				}
				// Tile in the "next row" (only if the last tile was at the end of the previous row)
				if (targetColumn === null && ((prepend && previousTileColumnIndex === 0) ||
					(!prepend && previousTileColumnIndex === (this.#columns.length - 1)))) {
					targetColumn = this.#determineColumnToAddTileForFlow(previousTile,
						tileIndex, tileContentDimensions, newlineColumnIndex, prepend, true);
				}
			}

			// If no tile which would maintain the reading flow was found, use the column that would
			// balance out the columns instead.
			targetColumn ??= targetColumnToRestoreBalance;
		}
		
		// Return the target column (or the first existing column, if no other was determined).
		return targetColumn ?? this.#columns[0];
	}
}