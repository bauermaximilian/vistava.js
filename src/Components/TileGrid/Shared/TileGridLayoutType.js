// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { TileFlows } from "./TileFlowType.js";

/**
 * @typedef {object} TileGridLayoutTypeLike
 * @property {string} [identifier] The identifier of the configuration. 
 * Must be lowercase letters or underscores only.
 * @property {number} [tileGap] Gets the margin between individual tiles and the columns 
 * ("inner column margin"). Also see {@link marginWidth}.
 * @property {number} [columnWidth] The fixed width of each column (in pixels), or 0 to use the 
 * available size of the grid area to display the amount of columns specified 
 * in {@link minimumColumnCount}. The actual width might be smaller to accomodate the minimum 
 * amount of columns specified by {@link minimumColumnCount}.
 * @property {number} [minimumColumnCount] The minimum column count that should be available in 
 * the grid. Depending on the available size of the grid area, the value specified in 
 * {@link columnWidth} might get scaled down to accomodate the specified amount of columns.
 * Must be greater than 1.
 * @property {number?} [tileLength] The fixed length of each tile (in px), or 0 to have each tile
 * span the entire available length of the grid area, or null to use the length calculated by
 * the size ratio of the content and the available width of the column.
 * @property {TileFlow} [tileFlow] The tile flow, which defines whether the columns are placed 
 * vertically, next to each other, or horizontally, below each other.
 * Defines the alignment of columns and the "meaning" of length and width.
 * See the {@link TileFlow} documentation for more information.
 * @property {number} [columnOverflowMinimum] The amount of tiles in every column of the grid that 
 * should be added before and after its visible area. If the specified amount of tiles exist outside
 * the visible area in every column, more tiles should not added until the conditions change.
 * @property {number} [columnOverflowMaximum] The maximum amount of tiles in every column of the grid 
 * before and after its visible area. If the specified amount is exceeded, the grid should be 
 * trimmed until the conditions change.
 * @property {number} [paddingStart] Gets the padding (in pixels) at the start of the grid that should
 * remain empty, but still count towards the total length of the grid. 
 * @property {number} [paddingEnd] Gets the padding (in pixels) at the end of the grid that should 
 * remain empty, but still count towards the total length of the grid. 
 * @property {number} [marginWidth] Gets the margin between the outmost columns and the parent 
 * container ("outer column margin"). Does not count towards the total width of the grid. 
 * Also see {@link tileGap}.
 * @property {boolean} [restoreLayout] Gets a value indicating whether it should be attempted to 
 * restore the layout after returning to it (true) or if the layout should always be rebuilt "fresh".
 */

/**
 * @implements {TileGridLayoutTypeLike}
 */
export class TileGridLayoutType {
   static get thumbnails() { return this.#thumbnailsTypeConfiguration; }
   static get gallery() { return this.#galleryTypeConfiguration; }

   get identifier() { return this.#identifier; }
   get tileGap() { return this.#tileGap; }
   get columnWidth() { return this.#columnWidth; }
   get minimumColumnCount() { return this.#minimumColumnCount; }
   get tileLength() { return this.#tileLength; }
   get tileFlow() { return this.#tileFlow; }
   get columnOverflowMinimum() { return this.#columnOverflowMinimum; }
   get columnOverflowMaximum() { return this.#columnOverflowMaximum; }
   get paddingStart() { return this.#paddingStart; }
   get paddingEnd() { return this.#paddingEnd; }
   get marginWidth() { return this.#marginWidth; }
   get restoreLayout() { return this.#restoreLayout; }

   static #thumbnailsTypeConfiguration = new TileGridLayoutType({
      identifier: "thumbnails",
      tileGap: 16,
      minimumColumnCount: 2,
      tileFlow: TileFlows.vertical,
      restoreLayout: true,
      paddingStart: 16
   });
   static #galleryTypeConfiguration = new TileGridLayoutType({
      identifier: "gallery",
      columnWidth: 0, 
      tileLength: 0,
      columnOverflowMinimum: 1,
      columnOverflowMaximum: 3,
      minimumColumnCount: 1,
      tileFlow: TileFlows.horizontal
   });

   /** @typedef {import("./TileFlowType").TileFlow} TileFlow */

   /** @type {string} */
   #identifier = "default";
   /** @type {number} */
   #tileGap = 0;
   /** @type {number} */
   #columnWidth = 200;
   /** @type {number?} */
   #tileLength = null;
   /** @type {TileFlow} */
   #tileFlow = TileFlows.vertical;
   /** @type {number} */
   #columnOverflowMinimum = 2;
   /** @type {number} */
   #columnOverflowMaximum = 4;
   /** @type {number} */
   #minimumColumnCount = 1;
   /** @type {number} */
   #paddingStart = 0;
   /** @type {number} */
   #paddingEnd = 0;
   /** @type {number} */
   #marginWidth = 0;
   /** @type {boolean} */
   #restoreLayout = false;

   /**
    * @param {TileGridLayoutTypeLike} [initializer]
    */
   constructor(initializer) {
      if (initializer != null) {
         if (initializer.identifier !== undefined) {
            if (!/[_a-z]*/.test(initializer.identifier)) {
               throw new ArgumentError("The value \"initializer.identifier\" is invalid.");
            }
            this.#identifier = initializer.identifier;
         }

         if (initializer.columnOverflowMaximum !== undefined) {
            Assert.numberPositiveOrZero(initializer.columnOverflowMaximum,
               "initializer.columnOverflowMaximum");
            this.#columnOverflowMaximum = initializer.columnOverflowMaximum;
         }
         if (initializer.columnOverflowMinimum !== undefined) {
            Assert.numberPositiveOrZero(initializer.columnOverflowMinimum,
               "initializer.columnOverflowMinimum");
            this.#columnOverflowMinimum = initializer.columnOverflowMinimum;
         }
         if (initializer.columnWidth !== undefined) {
            Assert.numberPositiveOrZero(initializer.columnWidth, "initializer.columnWidth");
            this.#columnWidth = initializer.columnWidth;
         }
         if (initializer.marginWidth !== undefined) {
            Assert.numberIntegerPositiveOrZero(initializer.marginWidth, "initializer.marginWidth");
            this.#marginWidth = initializer.marginWidth;
         }
         if (initializer.minimumColumnCount !== undefined) {
            Assert.numberIntegerPositive(initializer.minimumColumnCount, "initializer.minimumColumnCount");
            this.#minimumColumnCount = initializer.minimumColumnCount;
         }
         if (initializer.paddingEnd !== undefined) {
            Assert.numberPositiveOrZero(initializer.paddingEnd, "initializer.paddingEnd");
            this.#paddingEnd = initializer.paddingEnd;
         }
         if (initializer.paddingStart !== undefined) {
            Assert.numberIntegerPositiveOrZero(initializer.paddingStart, "initializer.paddingStart");
            this.#paddingStart = initializer.paddingStart;
         }
         if (initializer.tileFlow !== undefined) {
            Assert.enumType(initializer.tileFlow, TileFlows, false, "initializer.tileFlow");
            this.#tileFlow = initializer.tileFlow;
         }
         if (initializer.tileGap !== undefined) {
            Assert.numberIntegerPositiveOrZero(initializer.tileGap, "initializer.tileGap");
            this.#tileGap = initializer.tileGap;
         }
         if (initializer.tileLength !== undefined) {
            Assert.ifDefined(initializer.tileLength,
               () => Assert.numberIntegerPositiveOrZero(initializer.tileLength, "initializer.tileLength"));
            this.#tileLength = initializer.tileLength;
         }
         if (initializer.restoreLayout !== undefined) {
            Assert.boolean(initializer.restoreLayout, "initializer.restoreLayout");
            this.#restoreLayout = initializer.restoreLayout;
         }
      }
   }      

   /**
    * @param {TileGridLayoutTypeLike?} otherConfiguration 
    * @returns {boolean}
    */
   equals(otherConfiguration) {
      if (otherConfiguration instanceof TileGridLayoutType) {
         return this.#columnWidth === otherConfiguration.columnWidth &&
            this.#tileFlow === otherConfiguration.tileFlow &&
            this.#tileGap === otherConfiguration.tileGap &&
            this.#tileLength === otherConfiguration.tileLength &&
            this.#columnOverflowMinimum === otherConfiguration.columnOverflowMinimum &&
            this.#columnOverflowMaximum === otherConfiguration.columnOverflowMaximum &&
            this.#paddingStart === otherConfiguration.paddingStart &&
            this.#paddingEnd === otherConfiguration.paddingEnd &&
            this.#marginWidth === otherConfiguration.marginWidth;
      } else {
         return false;
      }
   }
}