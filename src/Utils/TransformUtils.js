// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../Shared/Assert.js";
import { ArgumentError } from "../Errors/ArgumentError.js";
import { VectorUtils } from "./VectorUtils.js";

/**
 * @typedef {object} Transform
 * @property {Vector} position
 * @property {Vector} size
 */

export class TransformUtils {
   /** @typedef {import("./VectorUtils.js").Vector} Vector */
   
   /**
    * Creates a new {@link Transform} instance from a {@link x} and {@link y} coordinate for 
    * the position and a {@link width} and {@link height} for the size.
    * @overload
    * @param {number} x The X coordinate of the new {@link Transform} instance.
    * @param {number} y The Y coordinate of the new {@link Transform} instance.
    * @param {number} width The width of the new {@link Transform} instance.
    * @param {number} height The height of the new {@link Transform} instance.
    * @returns {Transform} A new {@link Transform} instance.
    * @throws {ArgumentError} Is thrown when either the {@link width} or {@link height} are less 
    * than 0.
    */
   /**
    * Creates a new {@link Transform} instance from a {@link position} {@link Vector} and 
    * a {@link size} {@link Vector}.
    * @overload
    * @param {Vector} position The position of the new {@link Transform} instance, where
    * the x component defines the x coordinate of the new {@link Transform} and the y 
    * component defines the y coordinate of the new {@link Transform}.
    * @param {Vector} size The size of the new {@link Transform} instance, where the x 
    * component defines the width of the new {@link Transform} and the y component defines 
    * the height of the new {@link Transform}.
    * @returns {Transform} A new {@link Transform} instance.
    * @throws {ArgumentError} Is thrown when any of the components of the specified {@link size}
    * are less than 0, or when the specified arguments are no valid {@link Vector} instances.
    */
   /**
    * Creates a new {@link Transform} instance by copying the values from another 
    * {@link Transform} instance.
    * @overload
    * @param {Transform} transform The other {@link Transform} instance.
    * @returns {Transform} A new {@link Transform} instance.
    * @throws {ArgumentError} Is thrown when the specified {@link location} is invalid.
    */
   static new() {
      if (arguments.length === 4) {
         Assert.number(arguments[0], "x");
         Assert.number(arguments[1], "y");
         Assert.numberPositiveOrZero(arguments[2], "width");
         Assert.numberPositiveOrZero(arguments[3], "height");
         
         return {
            position: VectorUtils.new(arguments[0], arguments[1]),
            size: VectorUtils.new(arguments[2], arguments[3])
         };
      } else if (arguments.length === 2) {
         Assert.vector(arguments[0], "position");
         Assert.vector(arguments[1], "size");
         Assert.vectorPositiveOrZero(arguments[1], "size");

         return {
            position: VectorUtils.new(arguments[0]),
            size: VectorUtils.new(arguments[1])
         };
      } else if (arguments.length === 1) {
         Assert.transform(arguments[0], "transform");
         return {
            position: arguments[0].position,
            size: arguments[0].size
         }
      } else {
         throw new ArgumentError("The specified arguments couldn't be used to create a new " + 
            "location instance.");
      }
   }

   /**
    * Clones an existing {@link Transform} instance, or returns null if the 
    * specified {@link transform} was null.
    * @param {Transform?} transform A {@link Transform} instance to be cloned, 
    * or null.
    * @returns {Transform?} A new {@link Transform} instance, or null if the specified
    * {@link transform} was null.
    * @throws {ArgumentError} Is thrown when the specified argument can't be used to create a new
    * {@link Transform} instance.
    */
   static clone(transform) {
      if (transform === null) {
         return null;
      } else {
         return TransformUtils.new(transform);
      }
   }

   /**
    * Creates a new {@link Transform} instance with the {@link Transform.position} moved by a 
    * specified {@link offset}.
    * @param {Transform} transform A {@link Transform} instance to be moved.
    * @param {Vector} offset The offset {@link Vector}, defining where the 
    * {@link Transform.position} should be moved.
    * @returns {Transform} A new {@link Transform} instance.
    * @throws {ArgumentError} Is thrown when the specified {@link transform} is no valid
    * {@link Transform} instance, or when the specified {@link offset} is no valid
    * {@link Vector} instance.
    */
   static move(transform, offset) {
      Assert.transform(transform, "location");
      Assert.vector(offset, "offset");
      return {
         position: VectorUtils.add(transform.position, offset),
         size: transform.size
      };
   }

   /**
    * Compares the {@link Transform.position} and {@link Transform.size} of two {@link Transform} 
    * instances component-wise for equality.
    * @param {any} transformA The first {@link Transform} instance (or any other value).
    * @param {any} transformB The second {@link Transform} instance (or any other value).
    * @returns {boolean} True if both {@link transformA} and {@link transformB} are valid 
    * {@link Transform} instances and each component of both the {@link Transform.position} and 
    * {@link Transform.size} are equal to its counterpart in {@link transformB}, false otherwise.
    */
   static equals(transformA, transformB) {
      if (TransformUtils.isTransform(transformA) && TransformUtils.isTransform(transformB)) {
         return VectorUtils.equals(transformA.position, transformB.position) &&
            VectorUtils.equals(transformA.size, transformB.size);
      } else {
         return false;
      }
   }

   /**
    * Checks whether a specified {@link value} is a valid {@link Transform} instance.
    * @param {any} value A value to be verified.
    * @returns {boolean} True if the specified {@link value} is a valid {@link Transform} instance,
    * false otherwise.
    */
   static isTransform(value) {
      return typeof(value) === "object" && value !== null && "position" in value && 
         "size" in value && VectorUtils.isVector(value.position) &&
         VectorUtils.isVector(value.size);
   }
}