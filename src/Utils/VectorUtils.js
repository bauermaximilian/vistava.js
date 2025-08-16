// SPDX-License-Identifier: GPL-3.0-or-later

import { ArgumentError } from "../Errors/ArgumentError.js";
import { Assert } from "../Shared/Assert.js";

/**
 * @typedef {object} Vector
 * @property {number} x
 * @property {number} y
 */

/**
 * Provides static methods for common vector operations on {@link Vector} instances.
 */
export class VectorUtils {
   /**
    * Gets a new {@link Vector} instance with both the X and Y component set to 0.
    */
   static get zero() { return VectorUtils.new(0, 0); }
   
   /**
    * Creates a new {@link Vector} instance from an {@link x} and {@link y} component.
    * @overload
    * @param {number} x The X component of the new {@link Vector} instance.
    * @param {number} y The Y component of the new {@link Vector} instance.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when the specified {@link x} or {@link y} components are 
    * no valid numbers.{@link test} 
    */
   /**
    * Creates a new {@link Vector} instance from another {@link vector}.
    * @overload
    * @param {Vector} vector Another {@link Vector} instance.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when the specified {@link vector} is no valid
    * {@link Vector} instance.
    */
   static new() {
      if (arguments.length === 2) {
         Assert.number(arguments[0], "x");
         Assert.number(arguments[1], "y");
         return { x: arguments[0], y: arguments[1] };
      } else if (arguments.length === 1) {
         Assert.vector(arguments[0], "vector");
         return { x: arguments[0].x, y: arguments[0].y };
      } else {
         throw new ArgumentError("The specified arguments couldn't be used to create a new " + 
            "vector instance.");
      }
   }

   /**
    * Clones an existing {@link Vector} instance, or returns null if the 
    * specified {@link vector} was null.
    * @param {Vector?} vector A {@link Vector} instance to be cloned, or null.
    * @returns {Vector?} A new {@link Vector} instance, or null if the specified 
    * {@link vector} was null.
    * @throws {ArgumentError} Is thrown when the specified argument can't be used to create a new
    * {@link Vector} instance.
    */
   static clone(vector) {
      if (vector === null) {
         return null;
      } else {
         return VectorUtils.new(vector);
      }
   }

   /**
    * Adds two {@link Vector} instances component-wise and returns the result 
    * as a new {@link Vector} instance.
    * @param {Vector} vectorA The first {@link Vector} instance.
    * @param {Vector} vectorB The second {@link Vector} instance.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when {@link vectorA} or {@link vectorB} are no valid
    * {@link Vector} instances.
    */
   static add(vectorA, vectorB) {
      Assert.vector(vectorA, "vectorA");
      Assert.vector(vectorB, "vectorB");

      return {
         x: vectorA.x + vectorB.x,
         y: vectorA.y + vectorB.y
      };
   }

   /**
    * Subtracts two {@link Vector} instances component-wise and returns the result 
    * as a new {@link Vector}.
    * @param {Vector} vectorA The first {@link Vector} instance.
    * @param {Vector} vectorB The second {@link Vector} instance.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when {@link vectorA} or {@link vectorB} are no valid
    * {@link Vector} instances.
    */
   static sub(vectorA, vectorB) {
      Assert.vector(vectorA, "vectorA");
      Assert.vector(vectorB, "vectorB");

      return {
         x: vectorA.x - vectorB.x,
         y: vectorA.y - vectorB.y
      };
   }

   /**
    * Multiplies each component of a {@link Vector} instances with a scalar and returns the result
    * as a new {@link Vector}.
    * @param {Vector} vector A {@link Vector} instance.
    * @param {number} scalar A scalar as {@link number}.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance
    * or when {@link scalar} is no valid number.
    */
   static scale(vector, scalar) {
      Assert.vector(vector, "vector");
      Assert.number(scalar, "scalar");

      return {
         x: vector.x * scalar,
         y: vector.y * scalar
      };
   }

   /**
    * Calculates the length (magnitude) of a {@link Vector} instance.
    * @param {Vector} vector A {@link Vector} instance.
    * @returns {number} The length as {@link number}.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance.
    */
   static len(vector) {
      Assert.vector(vector, "vector");

      return Math.sqrt(Math.pow(vector.x , 2) + Math.pow(vector.y , 2));
   }

   /**
    * Creates a new {@link Vector} instance from an existing {@link vector} with all components
    * being the absolute value variants of the source {@link vector}.
    * @param {Vector} vector A {@link Vector} instance.
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance.
    */
   static abs(vector) {
      Assert.vector(vector, "vector");
      return { x: Math.abs(vector.x), y: Math.abs(vector.y) };
   }

   /**
    * Creates a new {@link Vector} instance by normalizing an existing {@link vector}.
    * @param {Vector} vector A {@link Vector} instance.
    * @param {boolean} [throwOnZeroLengthVector = false] True to throw an {@link ArgumentError}
    * if the specified {@link vector} can't be normalized (due its length being 0),
    * false to just return a copy of the original {@link vector} in that case instead (default).
    * @returns {Vector} A new {@link Vector} instance.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance,
    * or when {@link throwOnZeroLengthVector} is true and the length of the specified 
    * {@link vector} is 0.
    */
   static norm(vector, throwOnZeroLengthVector = false) {
      Assert.vector(vector, "vector");

      let length = VectorUtils.len(vector);
      if (length > 0) {
         return { x: vector.x / length, y: vector.y / length };
      } else if (throwOnZeroLengthVector) {
         throw new ArgumentError("The specified vector has a length of 0 and can't be normalized.");
      } else {
         return VectorUtils.new(vector);
      }
   }

   /**
    * Compares two {@link Vector} instances component-wise for equality.
    * @param {any} vectorA The first {@link Vector} instance (or any other value).
    * @param {any} vectorB The second {@link Vector} instance (or any other value).
    * @returns {boolean} True if both {@link vectorA} and {@link vectorB} are valid {@link Vector} 
    * instances and each component of {@link vectorA} is equal to its counterpart in 
    * {@link vectorB}, false otherwise.
    */
   static equals(vectorA, vectorB) {
      return this.isVector(vectorA) && this.isVector(vectorB) &&
         vectorA.x === vectorB.x && vectorA.y === vectorB.y;
   }

   /**
    * Checks whether a specified {@link Vector} instance has all components with a value of 0.
    * @param {Vector} vector A {@link Vector} instance.
    * @returns {boolean} True if all of the {@link vector} components are 0, false otherwise.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance.
    */
   static isZero(vector) {
      Assert.vector(vector, "vector");
      return Math.abs(vector.x) <= Number.EPSILON && Math.abs(vector.y) <= Number.EPSILON;
   }

   /**
    * Checks whether a specified {@link Vector} instance has at least one component 
    * with a value of 0.
    * @param {Vector} vector A {@link Vector} instance.
    * @returns {boolean} True if at least one of the {@link vector} components are 0, 
    * false otherwise.
    * @throws {ArgumentError} Is thrown when {@link vector} is no valid {@link Vector} instance.
    */
   static hasZero(vector) {
      Assert.vector(vector, "vector");
      return Math.abs(vector.x) <= Number.EPSILON || Math.abs(vector.y) <= Number.EPSILON;
   }

   /**
    * Checks whether a specified {@link value} is a valid {@link Vector} instance.
    * @param {any} value A value to be verified.
    * @returns {boolean} True if the specified {@link value} is a valid {@link Vector} instance,
    * false otherwise.
    */
   static isVector(value) {
      return typeof (value) === "object" && value !== null &&
         typeof (value.x) === "number" && typeof (value.y) === "number" &&
         isFinite(value.x) && isFinite(value.y);
   }

   /**
    * Creates a string representation of a vector.
    * @param {Vector?} vector The vector to be formatted to a string.
    * @param {string} [format="{x, y}"] The format string, in which all occurrences of 'x' are replaced with the
    * X component of the vector, and all occurrences of 'y' are replaced with the Y component of the vector.
    * @param {number} [maxPrecision=3] The maximum precision, must be in the range 1 - 21, inclusive.
    * @returns {string} A new {@link string}.
    */
   static str(vector, format = "{x, y}", maxPrecision = 3) {
      Assert.stringNotEmptyOrWhitespacesOnly(format, "format");
      Assert.numberIntegerPositive(maxPrecision, "maxPrecision");
      
      if (vector !== null) {
         Assert.vector(vector, "vector");
         return format.replaceAll("x", parseFloat(vector.x.toPrecision(maxPrecision)).toString())
            .replaceAll("y", parseFloat(vector.y.toPrecision(maxPrecision)).toString());
      } else {
         return "";
      }
   }
}

export { VectorUtils as VU }