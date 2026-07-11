// SPDX-License-Identifier: GPL-3.0-or-later

import { ArgumentError } from "../Errors/ArgumentError.js";
import { Assert } from "../Shared/Assert.js"
import { VU } from "./VectorUtils.js";

/**
 * @typedef {object} Rectangle
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

export class RectangleUtils {
   /** @typedef {import("./VectorUtils.js").Vector} Vector */

   /**
    * Creates a new {@link Rectangle} instance from another {@link Rectangle} or {@link DOMRect} instance.
    * @overload
    * @param {Rectangle|DOMRect} rectangle The other {@link Rectangle} or {@link DOMRect}.
    * @returns {Rectangle} A new {@link Rectangle} instance.
    * @throws {ArgumentError} Is thrown when one or more of the components in the provided argument 
    * are no valid numbers.
    */
   /**
    * Creates a new {@link Rectangle} instance from a position (defined by {@link x} and {@link y}) and a size
    * (defined by {@link width} and {@link height}).
    * @overload
    * @param {Vector} position The X and Y coordinates of the new {@link Rectangle}.
    * @param {Vector} size The width and height of the new {@link Rectangle}.
    * @returns {Rectangle} A new {@link Rectangle} instance.
    * @throws {ArgumentError} Is thrown when one or more of the provided arguments are no valid numbers.
    */
   /**
    * Creates a new {@link Rectangle} instance from a position (defined by {@link x} and {@link y}) and a size
    * (defined by {@link width} and {@link height}).
    * @overload
    * @param {number} x The X coordinate of the new {@link Rectangle}.
    * @param {number} y The Y coordinate of the new {@link Rectangle}.
    * @param {number} width The width of the new {@link Rectangle}.
    * @param {number} height The height of the new {@link Rectangle}.
    * @returns {Rectangle} A new {@link Rectangle} instance.
    * @throws {ArgumentError} Is thrown when one or more of the provided arguments are no valid numbers.
    */
   static new() {
      if (arguments.length === 1) {
         Assert.number(arguments[0].x, "x");
         Assert.number(arguments[0].y, "y");
         Assert.number(arguments[0].width, "width");
         Assert.number(arguments[0].height, "height");
         return { x: arguments[0].x, y: arguments[0].y, width: arguments[0].width, height: arguments[0].height };
      } else if (arguments.length === 2) { 
         Assert.vector(arguments[0], "position");
         Assert.vector(arguments[1], "size");
         return { x: arguments[0].x, y: arguments[0].y, width: arguments[1].x, height: arguments[1].y };
      }
      else if (arguments.length === 4) {
         Assert.number(arguments[0], "x");
         Assert.number(arguments[1], "y");
         Assert.number(arguments[2], "width");
         Assert.number(arguments[3], "height");
         return { x: arguments[0], y: arguments[1], width: arguments[2], height: arguments[3] };
      } else {
         throw new ArgumentError();
      }
   }

   /**
    * @param {Rectangle} rectangle 
    * @returns {number}
    */
   static right(rectangle) {
      Assert.rectangle(rectangle, "rectangle");
      return rectangle.x + rectangle.width;
   }

   /**
    * @param {Rectangle} rectangle 
    * @returns {number}
    */
   static bottom(rectangle) {
      Assert.rectangle(rectangle, "rectangle");
      return rectangle.y + rectangle.height;
   }

   /**
    * @overload
    * @param {Rectangle} rectangle 
    * @returns {Vector}
    */
   /**
    * @overload
    * @param {Rectangle?} rectangle 
    * @returns {Vector?}
    */
   static position(rectangle) {
      if (rectangle !== null) {
         return VU.new(rectangle.x, rectangle.y);
      } else {
         return null;
      }
   }

   /**
    * @overload
    * @param {Rectangle} rectangle 
    * @returns {Vector}
    */
   /**
    * @overload
    * @param {Rectangle?} rectangle 
    * @returns {Vector?}
    */
   static size(rectangle) {
      if (rectangle !== null) {
         return VU.new(rectangle.width, rectangle.height);
      } else {
         return null;
      }
   }

   /**
    * Creates a new {@link Rectangle} instance with the {@link Rectangle.x} and {@link Rectangle.y} components of 
    * a specified {@link rectangle} moved by a specified {@link vector}.
    * This method does not mutate the specified {@link rectangle}.
    * @param {Rectangle} rectangle 
    * @param {Vector} vector 
    * @returns {Rectangle}
    */
   static movedBy(rectangle, vector) {
      Assert.rectangle(rectangle, "rectangle");
      Assert.vector(vector, "vector");

      return RectangleUtils.new(rectangle.x + vector.x, rectangle.y + vector.y, rectangle.width, rectangle.height);
   }

   /**
    * Moves the components of a specified {@link rectangle} by a specified {@link vector}. 
    * This method mutates the specified {@link rectangle}.
    * @param {Rectangle} rectangle 
    * @param {Vector} vector 
    * @returns {void}
    */
   static moveBy(rectangle, vector) {
      rectangle.x += vector.x;
      rectangle.y += vector.y;
   }

   /**
    * @param {Rectangle?} otherRectangle 
    * @returns {Rectangle?}
    */
   static clone(otherRectangle) {
      if (otherRectangle !== null) {
         Assert.rectangle(otherRectangle, "otherRectangle");
         return RectangleUtils.new(otherRectangle.x, otherRectangle.y, otherRectangle.width, otherRectangle.height);
      } else {
         return null;
      }
   }

   /**
    * @param {Rectangle?} rectangleA 
    * @param {Rectangle?} rectangleB 
    * @returns {boolean}
    */
   static equals(rectangleA, rectangleB) {
      return RectangleUtils.isRectangle(rectangleA) && RectangleUtils.isRectangle(rectangleB) &&
         //@ts-ignore
         rectangleA.x === rectangleB.x && rectangleA.y === rectangleB.y &&
         //@ts-ignore
         rectangleA.width === rectangleB.width && rectangleA.height === rectangleB.height;
   }

   /**
    * @overload
    * @param {Rectangle} outerRectangle 
    * @param {Vector} position 
    * @returns {boolean}
    */
   /**
    * @overload
    * @param {Rectangle} outerRectangle 
    * @param {Rectangle} innerRectangle 
    * @returns {boolean}
    */
   static contains(outerRectangle, inner) {
      Assert.rectangle(outerRectangle, "outerRectangle");

      if (RectangleUtils.isRectangle(inner)) {
         Assert.rectangle(inner, "innerRectangle");
         return inner.x >= outerRectangle.x &&
            inner.y >= outerRectangle.y &&
            (inner.x + inner.width) <= (outerRectangle.x + outerRectangle.width) &&
            (inner.y + inner.height) <= (outerRectangle.y + outerRectangle.height);
      } else {
         Assert.vector(inner, "position");
         return inner.x >= outerRectangle.x &&
            inner.y >= outerRectangle.y &&
            inner.x <= (outerRectangle.x + outerRectangle.width) &&
            inner.y <= (outerRectangle.y + outerRectangle.height);         
      }
   }

   /**
    * @param {any} rectangle 
    * @returns {boolean}
    */
   static isRectangle(rectangle) {
      return typeof(rectangle) === "object" && rectangle !== null &&
         typeof (rectangle.x) === "number" && isFinite(rectangle.x) &&
         typeof (rectangle.y) === "number" && isFinite(rectangle.y) &&
         typeof (rectangle.width) === "number" && isFinite(rectangle.width) &&
         typeof (rectangle.height) === "number" && isFinite(rectangle.height);
   }

   /**
    * @param {Rectangle} rectangle 
    * @returns {boolean}
    */
   static isEmpty(rectangle) {
      return RectangleUtils.isRectangle(rectangle) && (rectangle.width <= 0 || rectangle.height <= 0);
   }
}

export { RectangleUtils as RU }