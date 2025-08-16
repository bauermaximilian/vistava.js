// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { MU } from "../../../Utils/MathUtils.js";
import { RU } from "../../../Utils/RectangleUtils.js";
import { VU } from "../../../Utils/VectorUtils.js";
import { TileFlows, TileFlowType } from "../Shared/TileFlowType.js";
import { TileGridLayoutType } from "../Shared/TileGridLayoutType.js";

/** @typedef {Rectangle & { index: number }} TileGridLayoutItem */
/** @typedef { TileGridLayoutItem & { usedInheritedPosition:boolean }} TileGridLayoutMountedItem */

export class TileGridLayoutColumn {
   /** 
    * Gets a value indicating whether the current column is empty (true) or not (false).
    * @type {boolean}
    */
   get isEmpty() { return this.#items.length === 0; }
   /**
    * Gets the first item of the current column.
    */
   get first() { return this.#items.length > 0 ? this.#items[0] : null; }
   /**
    * Gets the last item of the current column.
    */
   get last() { return this.#items.length > 0 ? this.#items[this.#items.length - 1] : null; }
   /** 
    * Gets the start position (including the {@link paddingStart}) of the current column
    * (perpendicular to the tile flow axis). 
    */
   get startPosition() { return this.#startPosition; }
   /** 
    * Gets the start position (including the {@link paddingEnd}) of the current column
    * (perpendicular to the tile flow axis). 
    */
   get endPosition() { return this.#endPosition; }
   /** TileLayoutConfiguration
    * Gets the padding (in pixels) at the start of the column that should remain empty, 
    * but still count towards the total column length. 
    */
   get paddingStart() { return this.#paddingStart; }
   /** 
    * Gets the padding (in pixels) at the end of the column that should remain empty, 
    * but still count towards the total column length. 
    */
   get paddingEnd() { return this.#paddingEnd; }
   /** 
    * The length (in pixels) of the current column, including the {@link paddingStart} 
    * and {@link paddingEnd} (perpendicular to the tile flow axis). 
    */
   get length() { return this.#length; }
   /** The width (in pixels) of the current column (orthogonal to the tile flow axis). */
   get width() { return this.#width; }
   /** The location of the entire column. */
   get location() {
      let firstTile = this.first;
      if (firstTile !== null) {
         return RU.new(firstTile.x, firstTile.y, this.#width, this.#length);
      } else {
         return RU.new(this.#position.x, this.#position.y, this.#width, this.#length);
      }
   }
   /** The amount of tiles in the current column. */
   get count() { return this.#items.length; }
   /** The index of the current column. */
   get index() { return this.#index; }
   /** The index of the tile which was added to the grid first. Updates when that tile gets removed.  */
   get tileIndexReference() { return this.#tileIndexReference; }

   /** @type {number?} */
   get tileIndexMinimum() { return this.first?.index ?? null; }
   /** @type {number?} */
   get tileIndexMaximum() { return this.last?.index ?? null; }

   /** @typedef {import("../Shared/TileFlowType").TileFlow} TileFlow */
   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("../../../Utils/RectangleUtils.js").Rectangle} Rectangle */   

   /** @type {number} */
   #index;
   /** @readonly @type {number} */
   #paddingStart;
   /** @readonly @type {number} */
   #paddingEnd;
   /** @readonly @type {TileFlow} */
   #tileFlow;
   /** @readonly @type {number} */
   #width;
   /** @readonly @type {number?} */
   #tileLength;
   /** @readonly @type {number} */
   #tileGap;
   /** @readonly @type {Vector} */
   #position;
   /** @readonly @type {number} */
   #startPositionOrthogonal;
   /** @readonly @type {number} */
   #endPositionOrthogonal;
   /** @readonly @type {TileGridLayoutItem[]} */
   #items = [];

   /** @type {number?} */
   #startPosition = null;
   /** @type {number?} */
   #endPosition = null;
   /** @type {number?} */
   #tileIndexReference = null;
   /** @type {number} */
   #length = 0;

   /**
    * @param {number} index The index of the column.
    * @param {Vector} position
    * @param {number} tileGap
    * @param {number} width The fixed width of each column. Must be greater than 0.
    * @param {TileFlow} tileFlow
    * @param {number?} tileLength The fixed length of each tile, or null to calculate the length
    * proportionally from the available width and the ratio of the content.
    * @param {number} paddingStart The padding (in pixels) at the start of the column that 
    * should remain empty, but still count towards the total column length.
    * @param {number} paddingEnd The padding (in pixels) at the end of the column that 
    * should remain empty, but still count towards the total column length.
    */
   constructor(index, position, width, tileGap, tileFlow, tileLength, paddingStart, paddingEnd) {
      Assert.numberIntegerPositiveOrZero(index, "index");
      Assert.vector(position, "position");
      Assert.numberPositive(width, "width");
      Assert.numberPositiveOrZero(tileGap, "tileGap");
      Assert.enumType(tileFlow, TileFlows, false, "tileFlow");
      Assert.ifDefined(tileLength, () => Assert.numberPositive(tileLength, "tileLength"));
      Assert.numberPositiveOrZero(paddingStart, "paddingStart");
      Assert.numberPositiveOrZero(paddingEnd, "paddingEnd");

      this.#index = index;
      this.#position = position;
      this.#startPositionOrthogonal = TileFlowType.calculateScalar(position, tileFlow, true);
      this.#endPositionOrthogonal = this.#startPositionOrthogonal + width;
      this.#tileGap = tileGap;
      this.#width = width;
      this.#tileFlow = tileFlow;
      this.#tileLength = tileLength;
      this.#paddingStart = paddingStart;
      this.#paddingEnd = paddingEnd;
   }

   /**
    * @param {number} tileIndex 
    * @param {Vector} tileContentDimensions 
    * @param {boolean} prepend
    * @param {number?} [defaultPosition]
    * @param {boolean} [isFirstTileInGrid]
    * @param {boolean} [isFirstRowInCollection]
    * @param {boolean} [isLastRowInCollection]
    * @returns {TileGridLayoutMountedItem}
    * @throws {InvalidOperationError}
    */
   create(tileIndex, tileContentDimensions, prepend, defaultPosition, isFirstTileInGrid,
      isFirstRowInCollection, isLastRowInCollection) {
      //let isFirstTileInGridOrFirstRowInLayout = isFirstTileInGrid || isFirstRowInCollection;
      let referenceOffset = 0, referenceLength = 0;
      let isFirstTileInColumn = this.#items.length === 0;
      let usedDefaultPosition = false;

      if (isFirstTileInColumn) {
         if (defaultPosition != null) {
            referenceOffset = defaultPosition;
            usedDefaultPosition = true;
         }
         referenceLength = (tileContentDimensions.x / tileContentDimensions.y) * this.width;
      } else {
         let referenceTile = prepend ? this.first : this.last;
         if (referenceTile !== null) {
            referenceOffset = TileFlowType.calculateScalar(RU.position(referenceTile), this.#tileFlow);
            referenceLength = TileFlowType.calculateScalar(RU.size(referenceTile), this.#tileFlow);
         }
      }

      if (isFirstTileInColumn && defaultPosition == null) {
         referenceOffset += this.#paddingStart;
      }

      // Shift prepended tiles one tile length "backwards" only in specific cases
      let useLengthOffsetForPrepend = !isFirstTileInColumn ||
         (defaultPosition == null && !isLastRowInCollection);
      //(!isFirstTileInGridOrFirstRowInLayout && defaultPosition == null && !isLastRowInCollection);
      let useLengthOffsetForAppend = !isFirstTileInColumn;

      return {
         ...this.#createItem(tileIndex, tileContentDimensions, referenceOffset, referenceLength,
            !!prepend, prepend ? useLengthOffsetForPrepend : useLengthOffsetForAppend),
         usedInheritedPosition: usedDefaultPosition
      };
   }

   /**
    * @param {TileGridLayoutItem} item 
    * @returns {void}
    * @throws {InvalidOperationError}
    */
   add(item) {
      let prepend = this.#shouldPrependItem(item.index);

      if (prepend) {
         this.#items.unshift(item);
      } else {
         this.#items.push(item);
      }

      if (this.#tileIndexReference === null) {
         this.#tileIndexReference = item.index;
      }

      this.#updateStartEndPositionAndLength();
   }

   /**
    * @param {number} tileIndex 
    * @param {Vector} tileContentDimensions 
    * @param {boolean} [rearrangePrecedingTiles=false] 
    * @returns {number[]} The indices of the updated tiles.
    * @throws {ArgumentError}
    */
   resizeTile(tileIndex, tileContentDimensions, rearrangePrecedingTiles = false) {
      /** @type {number[]} */
      let updatedTileIndicies = [];
      let firstItem = this.first;
      let lastItem = this.last;

      let newSize = this.#calculateItemSize(tileContentDimensions);

      if (lastItem?.index === tileIndex && !rearrangePrecedingTiles) {
         lastItem.width = newSize.x;
         lastItem.height = newSize.y;
         updatedTileIndicies.push(tileIndex);
      } else if (firstItem?.index === tileIndex && rearrangePrecedingTiles) {
         firstItem.x -= newSize.x - firstItem.width;
         firstItem.y -= newSize.y - firstItem.height;
         firstItem.width = newSize.x;
         firstItem.height = newSize.y;
         updatedTileIndicies.push(tileIndex);
      } else {
         /** @type {Vector?} */
         let offset = null;
         let i = rearrangePrecedingTiles ? this.#items.length - 1 : 0
         for (; i >= 0 && i < this.#items.length; i += rearrangePrecedingTiles ? -1 : 1) {
            let item = this.#items[i];
            if (item.index === tileIndex) {
               let oldSize = VU.new(item.width, item.height);
               offset = VU.sub(newSize, oldSize);
               item.width = newSize.x;
               item.height = newSize.y;
               if (rearrangePrecedingTiles) {
                  item.x -= offset.x;
                  item.y -= offset.y;
               }
            } else if (offset !== null) {
               if (rearrangePrecedingTiles) {
                  item.x -= offset.x;
                  item.y -= offset.y;
               } else {
                  item.x += offset.x;
                  item.y += offset.y;
               }
            } else {
               continue;
            }
            updatedTileIndicies.push(item.index);            
         }
         if (offset === null) {
            throw new ArgumentError("The specified tile wasn't found.");
         }
      }

      this.#updateStartEndPositionAndLength();
      return updatedTileIndicies;
   }

   /**
    * @param {number} tileIndex
    */
   remove(tileIndex) {
      let removedItem = null;
      if (tileIndex === this.last?.index) {
         removedItem = this.#items.pop() ?? null;
      } else if (tileIndex === this.first?.index) {
         removedItem = this.#items.shift() ?? null;
      }

      if (removedItem !== null) {
         if (this.#tileIndexReference !== null) {
            let first = this.first;
            let last = this.last;
            if (first !== null && last !== null) {
               this.#tileIndexReference = Math.max(Math.min(last.index, this.#tileIndexReference), first.index);
            } else {
               this.#tileIndexReference = null;
            }
         }

         this.#updateStartEndPositionAndLength();
         return removedItem;
      } else {
         throw new ArgumentError("The specified tile index neither refers to the first nor last tile " +
            "and therefore can't be removed.");
      }
   }

   /**
    * @param {number} offset 
    * @param {number} [startPositionMinimum] 
    * @param {number} [endPositionMaximum] 
    * @returns {number} The amount of the offset that was "clipped away" from the offset.
    * Can be positive or negative, depending on the clipping direction.
    */
   move(offset, startPositionMinimum, endPositionMaximum) {
      let offsetClipping = 0;
      if (this.#startPosition !== null && startPositionMinimum != null) {
         offsetClipping = Math.max(0, this.#startPosition + offset + startPositionMinimum);
      }
      if (this.#endPosition !== null && endPositionMaximum != null) {
         offsetClipping = Math.min(0, this.#endPosition - offset - endPositionMaximum);
      }
      offset -= offsetClipping;

      let offsetVector = TileFlowType.calculateVector(offset, this.#tileFlow);
      for (let i = 0; i < this.#items.length; i++) {
         RU.moveBy(this.#items[i], offsetVector);
      }

      this.#updateStartEndPositionByOffset(offset);

      return offsetClipping;
   }

   /**
    * @param {Vector} position 
    * @returns {TileGridLayoutItem?}
    */
   getByPosition(position) {
      let linearOrthogonalPosition = TileFlowType.calculateScalar(position, this.#tileFlow, true);
      if (linearOrthogonalPosition >= this.#startPositionOrthogonal &&
         linearOrthogonalPosition < this.#endPositionOrthogonal) {
         let linearPosition = TileFlowType.calculateScalar(position, this.#tileFlow);
         
         let start = 0;
         let end = this.#items.length - 1;
         while (start <= end) {
            let currentIndex = Math.floor((start + end) / 2);

            let currentItem = this.#items[currentIndex];
            let currentLinearPosition = TileFlowType.calculateScalar(currentItem.x, currentItem.y, this.#tileFlow);
            let currentLinearPositionEnd = currentLinearPosition +  
               TileFlowType.calculateScalar(currentItem.width, currentItem.height, this.#tileFlow);
            let currentLinearPositionEndWithGap = currentLinearPositionEnd + this.#tileGap;
            if (currentLinearPositionEndWithGap < linearPosition) {
               start = currentIndex + 1;
            } else if (currentLinearPosition > linearPosition) {
               end = currentIndex - 1;
            } else {
               if (linearPosition < currentLinearPositionEndWithGap &&
                  linearPosition > currentLinearPositionEnd) {
                  return null;
               } else {
                  return currentItem;
               }
            }
         }
      }

      return null;
   }

   /**
    * @param {number} tileIndex 
    * @returns {TileGridLayoutItem?}
    */
   get(tileIndex) {
      for (let item of this.#items) {
         if (item.index === tileIndex) {
            return item;
         }
      }
      return null;
   }

   /**
    * @overload
    * @param {number} tilePositionStart
    * @param {number} tileLength
    * @returns {TileGridLayoutItem?}
    */
   /**
    * @overload
    * @param {Rectangle} bounds 
    * @returns {TileGridLayoutItem?}
    */
   getClosestTo(/** @type {any} */ tilePositionStartOrBounds, /** @type {any} */ tileLength) {
      if (RU.isRectangle(tilePositionStartOrBounds)) {
         tileLength = TileFlowType.calculateScalar(RU.size(tilePositionStartOrBounds), this.#tileFlow);
         tilePositionStartOrBounds = TileFlowType.calculateScalar(RU.position(tilePositionStartOrBounds),
            this.#tileFlow);
      }

      /** @type {TileGridLayoutItem?} */
      let bestCandidate = null;
      /** @type {number?} */
      let bestCandidateDifference = null;

      for (let i = 0; i < this.#items.length; i++) {
         let currentCandidate = this.#items[i];
         let otherTilePositionStart = TileFlowType.calculateScalar(RU.position(currentCandidate), this.#tileFlow);
         let otherTileLength = TileFlowType.calculateScalar(RU.size(currentCandidate), this.#tileFlow);
         let relativeDifference = this.calculateRelativeTilePositionDifference(tilePositionStartOrBounds,
            tileLength, otherTilePositionStart, otherTileLength, 0);
         if (bestCandidateDifference === null || relativeDifference < bestCandidateDifference) {
            bestCandidateDifference = relativeDifference;
            bestCandidate = currentCandidate;
         }
      }

      return bestCandidate;
   }

   /**
    * @param {number} tileIndex The (source) index of the tile.
    * @param {number} tileOffsetCount The amount of tiles that should be iterated from the tile
    * with the specified {@link tileIndex}.
    * @param {boolean} moduloOnOverflow 
    * @returns {{location:TileGridLayoutItem?, overflowCycles:number}}
    */
   getAdjacentTo(tileIndex, tileOffsetCount, moduloOnOverflow) {
      for (let i = 0; i < this.#items.length; i++) {
         let item = this.#items[i];
         if (item.index === tileIndex) {
            let targetItemindex = i + tileOffsetCount;
            let overflowCycles = 0;

            if ((targetItemindex < 0 || targetItemindex >= this.#items.length) && moduloOnOverflow) {
               overflowCycles = Math.floor(targetItemindex / this.#items.length);
               targetItemindex = MU.moduloUnsigned(targetItemindex, this.#items.length);
            }

            targetItemindex = Math.max(Math.min(targetItemindex, this.#items.length), 0);

            return {
               location: this.#items[targetItemindex],
               overflowCycles
            };
         }
      }

      return {
         location: null,
         overflowCycles: 0
      };
   }

   /**
    * @param {(item:TileGridLayoutItem)=>boolean} predicate 
    * @param {boolean} [fromEnd = false]
    */
   countWhile(predicate, fromEnd = false) {
      for (let i = 0; i < this.#items.length; i++) {
         let item = this.#items[fromEnd ? (this.#items.length - i - 1) : i];
         if (!predicate(item)) {
            return i;
         }
      }
      return this.#items.length;
   }

   /**
    * @param {number} tilePositionStart
    * @param {number} tileLength
    * @param {number} otherTilePosition
    * @param {number} otherTileLength
    * @param {number} otherTilePositionShiftFactor
    */
   calculateRelativeTilePositionDifference(tilePositionStart, tileLength, otherTilePosition,
      otherTileLength, otherTilePositionShiftFactor) {
      let tilePositionEnd = tilePositionStart + tileLength;
      let otherTilePositionStart = otherTilePosition - (tileLength * otherTilePositionShiftFactor);
      let otherTilePositionEnd = otherTilePositionStart + otherTileLength;

      let startPositionDifference = Math.abs(tilePositionStart - otherTilePositionStart);
      let endPositionDifference = Math.abs(tilePositionEnd - otherTilePositionEnd);
      
      let positionDifference = Math.min(startPositionDifference, endPositionDifference);

      return positionDifference / tileLength;
   }

   *enumerateTiles() {
      for (let item of this.#items) {
         yield item;
      }
   }

   /**
    * @param {number} tileIndex 
    * @param {Vector} tileContentDimensions
    * @param {number} referenceOffset
    * @param {number} referenceLength
    * @param {boolean} prepend
    * @param {boolean} shiftByOneTileLength
    * @returns {TileGridLayoutItem}
    * @throws {ArgumentError}
    */
   #createItem(tileIndex, tileContentDimensions, referenceOffset, referenceLength, prepend, shiftByOneTileLength) {
      /** @type {Vector} */
      let position;
      let size = this.#calculateItemSize(tileContentDimensions);

      if (this.#tileFlow === TileFlows.vertical) {
         if (prepend) {
            let lengthOffset = shiftByOneTileLength ? (this.#tileGap + size.y) : 0;
            position = VU.new(this.#position.x, referenceOffset - lengthOffset)
         } else {
            let lengthOffset = shiftByOneTileLength ? (referenceLength + this.#tileGap) : 0
            position = VU.new(this.#position.x, referenceOffset + lengthOffset);
         }
      } else {
         if (prepend) {
            let lengthOffset = shiftByOneTileLength ? (this.#tileGap + size.x) : 0;
            position =  VU.new(referenceOffset - lengthOffset, this.#position.y);
         } else {
            let lengthOffset = shiftByOneTileLength ? (referenceLength + this.#tileGap) : 0;
            position =  VU.new(referenceOffset + lengthOffset, this.#position.y);
         }
      }

      return {
         index: tileIndex,
         x: position.x,
         y: position.y,
         width: size.x,
         height: size.y
      }
   }   

   /**
    * @param {Vector} tileContentDimensions 
    * @returns {Vector}
    * @throws {ArgumentError}
    */
   #calculateItemSize(tileContentDimensions) {
      let ratio = tileContentDimensions.x / tileContentDimensions.y;
      if (isNaN(ratio) || ratio === 0) {
         throw new ArgumentError("The dimensions of the specified location are invalid.");
      }
      if (this.#tileFlow === TileFlows.vertical) {
         return VU.new(this.#width, this.#tileLength ?? (this.#width / ratio));
      } else {
         return VU.new(this.#tileLength ?? (this.#width * ratio), this.#width);
      }
   }

   /**
    * @param {number} itemIndex 
    * @returns {boolean}
    * @throws {InvalidOperationError}
    */
   #shouldPrependItem(itemIndex) {
      if (this.#items.length > 0 && this.#items[0].index > itemIndex) {
         return true;
      } else if (this.#items.length === 0 || this.#items[this.#items.length - 1].index < itemIndex) {
         return false;
      } else {
         throw new InvalidOperationError("A tile with the specified tile index can neither be " +
            "appended nor prepended to the current column.");
      }
   }

   /**
    * @param {number} offset
    */
   #updateStartEndPositionByOffset(offset) {
      if (this.#startPosition !== null) {
         this.#startPosition += offset;
      }
      if (this.#endPosition !== null) {
         this.#endPosition += offset;
      }
   }

   #updateStartEndPositionAndLength() {
      this.#startPosition = TileFlowType.calculateScalar(RU.position(this.first), this.#tileFlow);
      
      let lastTilePositionLinear = TileFlowType.calculateScalar(RU.position(this.last), this.#tileFlow);
      let lastTileSizeLinear = TileFlowType.calculateScalar(RU.size(this.last), this.#tileFlow)
      if (lastTilePositionLinear !== null && lastTileSizeLinear !== null) {
         this.#endPosition = lastTilePositionLinear + lastTileSizeLinear;
      } else {
         this.#endPosition = null;
      }

      if (this.#startPosition !== null && this.#endPosition !== null) {
         this.#startPosition -= this.#paddingStart;
         this.#endPosition += this.#paddingEnd;
         this.#length = this.#endPosition - this.#startPosition;
      } else {
         this.#length = 0;
      }
   }

   /**
    * @param {Vector} containerSize 
    * @param {TileGridLayoutType} configuration
    * @returns {{ columns:TileGridLayoutColumn[], occupiedWidth:number }}
    */   
   static initializeColumns(containerSize, configuration) {
      let availableWidth, tileLength;
      if (configuration.tileFlow === TileFlows.vertical) {
         availableWidth = containerSize.x;
         // Only if tileLength is 0, the value needs to be "replaced", not for null or other values.
         tileLength = configuration.tileLength === 0 ? 
            containerSize.y : configuration.tileLength;
      } else {
         availableWidth = containerSize.y;
         tileLength = configuration.tileLength === 0 ? 
            containerSize.x : configuration.tileLength;
      }
      availableWidth -= configuration.marginWidth * 2;
      
      let columnCount = 0, columnWidth = configuration.columnWidth, columnWidthWithGap;
      if (configuration.columnWidth > 0) {
         columnCount = Math.floor((availableWidth - configuration.tileGap) / 
            (columnWidth + configuration.tileGap));
      }
      if (columnWidth === 0 || columnCount < configuration.minimumColumnCount) {
         columnCount = configuration.minimumColumnCount;
         columnWidth = (availableWidth / columnCount) - (columnCount - 1) * configuration.tileGap;
      }

      columnWidthWithGap = columnWidth + configuration.tileGap;

      let occupiedWidth = columnCount * columnWidth + (columnCount - 1) * configuration.tileGap;
      let padding = availableWidth - occupiedWidth + configuration.marginWidth * 2;
      let columnOffset = TileFlowType.calculateVector(columnWidthWithGap, configuration.tileFlow, true);

      let columns = [];
      let columnPosition = TileFlowType.calculateVector(padding / 2, configuration.tileFlow, true);
      for (let i = 0; i < columnCount; i++) {
         columns.push(new TileGridLayoutColumn(i, columnPosition, columnWidth,
            configuration.tileGap, configuration.tileFlow, tileLength, configuration.paddingStart, 
            configuration.paddingEnd));
         columnPosition = VU.add(columnPosition, columnOffset);
      }

      return { columns, occupiedWidth };
   }
}