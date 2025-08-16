// SPDX-License-Identifier: GPL-3.0-or-later

import { EnumItem, EnumType } from "../../../Shared/EnumType.js";
import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { VU } from "../../../Utils/VectorUtils.js";

/**
 * An {@link EnumType} defining the different alignments of tile columns, tiles and tile movement inside a tile grid.
 */
export class TileFlowType extends EnumType {
   static #enum = new TileFlowType();
   static get enum() { return TileFlowType.#enum; }

   /** Gets the instance that defines a tile flow along the Y axis. @type {TileFlow} */
   get vertical() { return this.getItem(1, "vertical"); }
   /** Gets the instance that defines a tile flow along the X axis. @type {TileFlow} */
   get horizontal() { return this.getItem(2, "horizontal"); }

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */

   /**
    * Calculates a scalar along the axis of a specific {@link tileFlow} from a specific {@link vector}.
    * @overload
    * @param {Vector} vector The vector, from which a scalar should be calculated.
    * @param {TileFlow} tileFlow The tile flow, which defines the axis the returned scalar will be on.
    * @param {boolean} [orthogonal=false] true to return a scalar orthogonal to the axis of the {@link tileFlow},
    * false (default) to return a scalar parallel to the axis of the {@link tileFlow}.
    * @returns {number} The scalar as a new {@link number}.
    * @throws {ArgumentError} Is thrown when the specified {@link tileFlow} is invalid.
   */
   /**
    * Calculates a scalar along the axis of a specific {@link tileFlow} from a specific {@link vector}.
    * @overload
    * @param {Vector?} vector The vector, from which a scalar should be calculated, or null.
    * @param {TileFlow} tileFlow The tile flow, which defines the axis the returned scalar will be on.
    * @param {boolean} [orthogonal=false] true to return a scalar orthogonal to the axis of the {@link tileFlow},
    * false (default) to return a scalar parallel to the axis of the {@link tileFlow}.
    * @returns {number?} The scalar as a new {@link number}, or null.
    * @throws {ArgumentError} Is thrown when the specified {@link tileFlow} is invalid.
    */
   /**
    * Calculates a scalar along the axis of a specific {@link tileFlow} from a specific {@link vector}.
    * @overload
    * @param {number} vectorX The X component of the vector, from which a scalar should be calculated.
    * @param {number} vectorY The Y component of the vector, from which a scalar should be calculated.
    * @param {TileFlow} tileFlow The tile flow, which defines the axis the returned scalar will be on.
    * @param {boolean} [orthogonal=false] true to return a scalar orthogonal to the axis of the {@link tileFlow},
    * false (default) to return a scalar parallel to the axis of the {@link tileFlow}.
    * @returns {number} The scalar as a new {@link number}.
    * @throws {ArgumentError} Is thrown when the specified {@link tileFlow} is invalid.
    */
   static calculateScalar() {
      let x, y, tileFlow, orthogonal = false;

      if (typeof (arguments[0]) === "number" && typeof (arguments[1]) === "number") {
         x = arguments[0];
         y = arguments[1];
         tileFlow = arguments[2];
         orthogonal = arguments[3];
      } else if (VU.isVector(arguments[0])) {
         x = arguments[0].x;
         y = arguments[0].y;
         tileFlow = arguments[1];
         orthogonal = arguments[2];
      } else if (arguments[0] == null) {
         return null;
      }

      if (tileFlow === tileFlow.parentEnum.vertical) {
         return orthogonal ? x : y;
      } else if (tileFlow === tileFlow.parentEnum.horizontal) {
         return orthogonal ? y : x;
      } else {
         throw new ArgumentError("The specified tile flow is invalid.");
      }
   }

   /**
    * Calculates a vector from a specific {@link scalar} and an axis defined through a specific {@link tileFlow}.
    * @overload
    * @param {number} scalar The scalar, defining the length of the returned vector.
    * @param {TileFlow} tileFlow The tile flow, which defines the axis the returned vector will be parallel 
    * (or orthogonal) to.
    * @param {boolean} [orthogonal=false] true to return a vector orthogonal to the axis of the tile flow,
    * false (default) to return a vector parallel to the axis of the {@link tileFlow}.
    * @returns {Vector} A new {@link Vector}.Defines the alignment of tile columns and tiles inside a grid.
    * @throws {ArgumentError} Is thrown when the specified {@link tileFlow} is invalid.
    */
   /**
    * @overload
    * @param {number?} scalar The scalar, defining the length of the returned vector, or null.
    * @param {TileFlow} tileFlow The tile flow, which defines the axis the returned vector will be parallel 
    * (or orthogonal) to. 
    * @param {boolean} [orthogonal=false] true to return a vector orthogonal to the axis of the tile flow,
    * false (default) to return a vector parallel to the axis of the {@link tileFlow}.
    * @returns {Vector?} A new {@link Vector}, or null.
    * @throws {ArgumentError} Is thrown when the specified {@link tileFlow} is invalid.
    */
   static calculateVector(/** @type {number?} */ scalar, /** @type {TileFlow?} */ tileFlow, orthogonal = false) {
      if (scalar !== null) {
         if (tileFlow === TileFlows.vertical) {
            return orthogonal ? VU.new(scalar, 0) : VU.new(0, scalar);
         } else if (tileFlow === TileFlows.horizontal) {
            return orthogonal ? VU.new(0, scalar) : VU.new(scalar, 0);
         } else {
            throw new ArgumentError("The specified tile flow is invalid.");
         }
      } else {
         return null;
      }
   }
}

/** 
 * An {@link EnumType} instance, defining the different alignments of tile columns, tiles and tile movement 
 * inside a tile grid. 
 */
export const TileFlows = TileFlowType.enum;

/** @typedef {EnumItem<TileFlowType>} TileFlow An item of the {@link TileFlowType}. */