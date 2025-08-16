// SPDX-License-Identifier: GPL-3.0-or-later

import { ArgumentError } from "../Errors/ArgumentError.js";
import { VectorUtils } from "../Utils/VectorUtils.js";
import { TransformUtils } from "../Utils/TransformUtils.js";
import { RectangleUtils } from "../Utils/RectangleUtils.js";
import { EnumItem, EnumType } from "./EnumType.js";
import { ImplementationError } from "../Errors/ImplementationError.js";

/**
 * Creates a new {@link ImplementationError} instance.
 * @param {string} [message]
 * @returns {ImplementationError}
 * @example
 * throw up();
 * throw up("Unexpected number overflow");
 */
export const up = (message) => new ImplementationError(message);

/**
 * Provides various methods to assert certain conditions and to throw errors if the assertions
 * are not met.
 */
export class Assert {
   /** 
    * Gets or sets a value defining whether any assertions should be executed normally (true) or
    * if they should be skipped (false), which can improve performance.
    * @type {boolean} 
    */
   static get isActive() { return Assert.#isActive; }
   static set isActive(value) { Assert.#isActive = !!value; }

   /** @typedef {import("../Utils/VectorUtils.js").Vector} Vector */
   /** @typedef {import("../Utils/RectangleUtils.js").Rectangle} Rectangle */
   /** @typedef {import("../Utils/TransformUtils.js").Transform} Transform */
   
   static #isActive = true;

   /**
    * Asserts that a specified {@link value} is of type boolean and equal to 'false'
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static false(value, name) {
      if (!Assert.#isActive) {
         return;
      }

      if (value !== false) {
         AssertUtils.throwArgumentError("The value~ is not false.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type boolean and equal to 'true'
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static true(value, name) {
      if (!Assert.#isActive) {
         return;
      }

      if (value !== true) {
         AssertUtils.throwArgumentError("The value~ is not true.", name);
      }
   }

   /**
    * Asserts that a specified {@link valueExpected} is equal to the specified {@link valueActual} 
    * and throws an error if this assertion is not met.
    * @param {any} valueExpected The expected value.
    * @param {any} valueActual The actual value.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static equals(valueExpected, valueActual, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (valueExpected !== valueActual) {
         AssertUtils.throwArgumentError(
            `The value~ is not equal to the expected value of ${valueExpected}.`, name);
      }
   };

   /**
    * Asserts that a specified {@link valueExpected} is equal to the specified {@link valueActual} 
    * and throws an error if this assertion is not met.
    * @param {any} valueExpected The expected value.
    * @param {any} valueActual The actual value.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static equalsNot(valueExpected, valueActual, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (valueExpected === valueActual) {
         AssertUtils.throwArgumentError(
            `The value~ is equal to the expected value of ${valueExpected}.`, name);
      }
   };

   /**
    * Asserts that the values inside two objects or arrays are equal to each other by ensuring that
    * each value in {@link expectedValue} exists in {@link actualValue} and both values are equal to 
    * each other, and throws an error if this assertion is not met.
    * @param {object} expectedValue The expected value.
    * @param {object} actualValue The actual value.
    * @param {boolean} [allowAdditionalMembersInActual=true] true (default) to allow and ignore any 
    * additional members in {@link actualValue} that do not exist in {@link expectedValue}, false to
    * throw an {@link ArgumentError} in such cases.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static equivalent(expectedValue, actualValue, allowAdditionalMembersInActual = true, name) {
      if (typeof (expectedValue) === typeof (actualValue)) {
         if (typeof (expectedValue) === "object") {
            let keysExpected = Object.keys(expectedValue);
            let keysActual = Object.keys(actualValue);
            for (let key of keysExpected) {
               let memberValueExpected = expectedValue[key];
               let memberValueActual = actualValue[key];

               if (typeof (memberValueExpected) === typeof (memberValueActual) &&
                  typeof (memberValueExpected) === "object") {
                  Assert.equivalent(memberValueExpected, memberValueActual, allowAdditionalMembersInActual,
                     `${name ?? "value"}.${key}`);
               } else if (memberValueExpected !== memberValueActual) {
                  AssertUtils.throwArgumentError(`The member \"${key}\" in the value~ does not ` +
                     (memberValueActual !== undefined ? "have the expected member value." : "exist."));
               }
            }
            if (!allowAdditionalMembersInActual) {
               for (let key of keysActual) {
                  if (!keysExpected.includes(key)) {
                     AssertUtils.throwArgumentError(`The member \"${key}\" in value~ is not ` +
                        "supposed to exist, as it is absent in the expected value.");
                  }
               }
            }
         } else {
            Assert.equals(expectedValue, actualValue, name);
         }
      } else {
         AssertUtils.throwArgumentError("The value~ has a different type than expected.");
      }
   }

   /**
    * Asserts that a specified {@link callback} throws an error of type {@link expectedErrorType}
    * and throws an error if this assertion is not met.
    * @param {()=>void} callback The function which will be called.
    * @param {new ()=>any} [expectedErrorType] The expected error type. Optional
    * @param {string} [name] The name of the function for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static throws(callback, expectedErrorType = Error, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      try {
         callback();
      } catch (error) {
         if (expectedErrorType !== undefined) {
            if (error instanceof expectedErrorType) {
               return;
            } else {
               AssertUtils.throwArgumentError(
                  "The function call~ threw an error, but not of the " + 
                     `expected type "${expectedErrorType.name}".`, name);
            }
         }
      }

      AssertUtils.throwArgumentError(
         `The function call~ didn't throw an error of type  "${expectedErrorType.name}".`, name);
   };

   /**
    * Asserts that a specified {@link value} is a non-empty array containing a specific {@link expectedValueElement}
    * (which must not be undefined) and throws an error if this assertion is not met.
    * @param {any[]} value The array variable to be checked.
    * @param {any} expectedValueElement The element which should be asserted to be in the specified value array.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static contains(value, expectedValueElement, name) {
      if (!Assert.#isActive) { 
         return; 
      }
      if (expectedValueElement === undefined) {
         AssertUtils.throwArgumentError("The expected value, which must be in the array, is undefined.");
      }
      Assert.array(value, name);
      if (!value.includes(expectedValueElement)) {
         AssertUtils.throwArgumentError("The array~ does not contain a specific required element.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a non-empty array 
    * and throws an error if this assertion is not met.
    * @param {any[]} value The array variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static containsAny(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.array(value, name);
      if (value.length === 0) {
         AssertUtils.throwArgumentError("The array~ does not contain any elements.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is neither null nor undefined 
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static defined(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value === undefined || value === null) {
         AssertUtils.throwArgumentError("The value~ is undefined or null.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number} (and not NaN or infinite)
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static number(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (typeof(value) !== "number") {
         AssertUtils.throwArgumentError("The value~ is not of type number.", name);
      }
      if (!isFinite(value)) {
         AssertUtils.throwArgumentError("The value~ is not finite.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number} and greater than/equal 
    * to 0 (and not NaN or infinite) and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static numberPositiveOrZero(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.number(value, name);
      if (typeof(value) === "number" && value < 0) {
         AssertUtils.throwArgumentError("The value~ is neither a positive number nor zero.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number} and greater than 0
    * (and not NaN or infinite) and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static numberPositive(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.number(value, name);
      if (typeof(value) === "number" && value <= 0) {
         AssertUtils.throwArgumentError("The value~ is no positive number.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number} greater than or equal to
    * {@link min} and less than or equal to {@link max} (and not NaN) and throws an error 
    * if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {number} min The minimum allowed value for {@link value}.
    * @param {number} max The maximum allowed value for {@link value}.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static numberInRange(value, min, max, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.number(value, name);
      if (typeof(value) === "number" && (value < min || value > max)) {
         AssertUtils.throwArgumentError("The value~ exceeds the valid range for this.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number} and a whole number, 
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static numberInteger(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.number(value, name);
      if (Math.floor(value) !== value) {
         AssertUtils.throwArgumentError("The value~ is no integer number.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number}, a whole number and
    * greater than 0 (and not NaN or infinite), and throws an error if this 
    * assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */   
   static numberIntegerPositive(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.numberInteger(value, name);
      if (value <= 0) {
         AssertUtils.throwArgumentError("The value~ is no positive integer number.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link number}, a whole number and
    * greater than/equal to 0 (and not NaN or infinite), and throws an error if this 
    * assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */   
   static numberIntegerPositiveOrZero(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.numberInteger(value, name);
      if (value < 0) {
         AssertUtils.throwArgumentError("The value~ is no positive integer number or zero.", name);
      }
   }
   
   /**
    * Asserts that a specified {@link array} is a valid array and that the 
    * specified {@link value} is of type {@link number} greater or equal to
    * 0 and less than the length of the specified {@link array} (and also not NaN) and throws 
    * an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {Array} array The array the specified {@link value} should be checked against.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static arrayIndex(value, array, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.array(array, "array");
      Assert.numberInRange(value, 0, array.length - 1, name);
   }

   /**
    * Asserts that a specified {@link value} is of type {@link string}
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static string(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.defined(value, name);
      if (typeof(value) !== "string") {
         AssertUtils.throwArgumentError("The value~ is not a string.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link string} or null
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static stringOrNull(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value !== null && typeof(value) !== "string") {
         AssertUtils.throwArgumentError("The value~ is not a string.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link string} and not empty
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static stringNotEmpty(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.string(value, name);
      if (typeof(value) === "string" && value.length === 0) {
         AssertUtils.throwArgumentError("The value~ must not be empty.");
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link string} and not empty or 
    * whitespaces only and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static stringNotEmptyOrWhitespacesOnly(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.string(value, name);
      if (typeof(value) === "string" && value.trim().length === 0) {
         AssertUtils.throwArgumentError("The value~ must not be empty or whitespaces only.");
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link string}
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static boolean(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.defined(value, name);
      if (typeof(value) !== "boolean") {
         AssertUtils.throwArgumentError("The value~ is not of type boolean.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link function}
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static function(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.defined(value, name);
      if (typeof(value) !== "function") {
         AssertUtils.throwArgumentError("The value~ is not a string.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is an array
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static array(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.defined(value, name);
      if (!Array.isArray(value)) {
         AssertUtils.throwArgumentError("The value~ is not an array.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is an array with elements of type {@link type}
    * and throws an error if this assertion is not met.
    * For checking arrays of class instances, see {@link arrayOfClass}.
    * @param {any} value The variable to be checked.
    * @param {string} type The expected type name of the values in the specified array.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static arrayOfType(value, type, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.array(value, name);
      for (let i = 0; i < value.length; i++) {
         Assert.type(value[i], type, `${name}[${i}]`);
      }
   }

   /**
    * Asserts that a specified {@link value} is an array with elements that are an instance of
    * the class {@link variableClass} and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {new (...args) => any} variableClass The expected class of the specified {@link value}.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static arrayOfClass(value, variableClass, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.array(value, name);
      for (let i = 0; i < value.length; i++) {
         Assert.class(value[i], variableClass, `${name ?? "value"}[${i}]`);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Vector} object.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static vector(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (!VectorUtils.isVector(value)) {
         AssertUtils.throwArgumentError("The value~ is not a valid vector.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Rectangle} object.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static rectangle(value, name) {
      if (!Assert.#isActive) {
         return;
      }

      if (!RectangleUtils.isRectangle(value)) {
         AssertUtils.throwArgumentError("The value~ is not a valid rectangle.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid, non-empty {@link Rectangle} object.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static rectangleNotEmpty(value, name) {
      if (!Assert.#isActive) {
         return;
      }

      Assert.defined(value, name);
      let isRectangle = RectangleUtils.isRectangle(value);
      if (!isRectangle || (isRectangle && RectangleUtils.isEmpty(value))) {
         AssertUtils.throwArgumentError("The value~ is not a valid non-empty rectangle.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Vector} object with neither
    * of the vector components having a value equal to or less than 0.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static vectorPositive(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.vector(value, name);
      if (value.x <= 0) {
         AssertUtils.throwArgumentError(
            "The X component of the vector~ is equal to or smaller than 0.", name);
      } else if (value.y <= 0) {
         AssertUtils.throwArgumentError(
            "The Y component of the vector~ is equal to or smaller than 0.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Vector} object with neither
    * of the vector components having a value of less than 0.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static vectorPositiveOrZero(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.vector(value, name);
      if (value.x < 0) {
         AssertUtils.throwArgumentError("The X component of the vector~ is smaller than 0.", name);
      } else if (value.y < 0) {
         AssertUtils.throwArgumentError("The Y component of the vector~ is smaller than 0.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Vector} object with neither
    * of the vector components having a value of 0.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static vectorNonZero(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.vector(value, name);
      if (value.x === 0) {
         AssertUtils.throwArgumentError("The X component of the vector~ is 0.", name);
      } else if (value.y === 0) {
         AssertUtils.throwArgumentError("The Y component of the vector~ is 0.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a valid {@link Transform} object.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static transform(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (!TransformUtils.isTransform(value)) {
         AssertUtils.throwArgumentError("The value~ is not a valid transformation.", name);
      }
   }

   /**
    * Asserts that a specified {@link value} is of type {@link type}
    * and throws an error if this assertion is not met.
    * Use {@link class} to check whether a specific variable is an instance of a specific class.
    * @param {any} value The variable to be checked.
    * @param {string} type The expected type name of the specified {@link value}.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static type(value, type, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value === null || typeof(value) !== type) {
         AssertUtils.throwArgumentError(`The value~ is not of type "${type}".`, name);
      }
   }

   /**
    * Asserts that a specified {@link value} is an instance of the class {@link valueClass}
    * and throws an error if this assertion is not met.
    * Use {@link type} to check whether a specific variable is an instance of a specific type.
    * @param {any} value The variable to be checked.
    * @param {new (...args) => any} valueClass The expected class of the specified {@link value}.
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static class(value, valueClass, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value === null || !(value instanceof valueClass)) {
         AssertUtils.throwArgumentError(
            `The value~ is no instance of class "${valueClass.name}".`, name);
      }
   }

   /**
    * Asserts that a specified {@link value} is a class type 
    * and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {string} [name] The name of the variable for the error message. Optional.
    */
   static classType(value, name) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value === null || value === undefined || typeof(value) !== "function" ||
         typeof(value.prototype?.constructor) !== "function") {
         AssertUtils.throwArgumentError(`The value~ is no valid class type.`, name);
      }
   }

   /**
    * Executes a specific callback (with another assertion method) only if the specified 
    * {@link value} is defined (not undefined nor null).
    * @param {any} value The variable to be checked.
    * @param {()=>void} callback The callback to be executed if the {@link value} is defined.
    */
   static ifDefined(value, callback) {
      if (!Assert.#isActive) { 
         return; 
      }

      if (value != null) {
         callback();
      }
   }

   /**
    * Asserts that a specified {@link $class} inherits from or is equal to the specified 
    * {@link parentClass} and throws an error if this assertion is not met.
    * @param {new (...args) => any} $class The (child) class to be checked.
    * @param {new (...args) => any} parentClass The parent class.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static inherits($class, parentClass) {
      if (!Assert.#isActive) { 
         return; 
      }

      Assert.defined($class, "$class");
      Assert.defined(parentClass, "parentClass");

      if (!$class?.prototype || !$class.name) {
         AssertUtils.throwArgumentError(
            `The value~ is no valid class.`, "$class");
      }
      if (!parentClass?.prototype || !parentClass.name) {
         AssertUtils.throwArgumentError(
            `The value~ is no valid class.`, "parentClass");
      }

      if (!($class.prototype instanceof parentClass) && !($class === parentClass)) {
         AssertUtils.throwArgumentError(
            `The class \"${$class.name}\" does not extend \"${parentClass.name}\".`);
      }
   }

   /**
    * Asserts that a specified {@link value} is an item of a specific {@link enumTypeInstance} and (unless disabled) 
    * a valid value of that specified enum and throws an error if this assertion is not met.
    * @param {any} value The variable to be checked.
    * @param {EnumType} enumTypeInstance The expected {@link EnumType} instance of the specified 
    * {@link value}.
    * @param {boolean} [allowCombined=false] A value indicating whether the specified {@link value} must be defined
    * as a property of the {@link enumTypeInstance} class (false, default), or if "combined" values (created with the
    * method of the same name) are also allowed (true).
    * @param {string} [name] The name of the variable for the error message. Optional.
    * @throws {ArgumentError} Is thrown when the current assertion is not met.
    */
   static enumType(value, enumTypeInstance, allowCombined = false, name) {
      if (!Assert.#isActive) { 
         return; 
      }
      Assert.class(enumTypeInstance, EnumType, "enumTypeInstance");
      
      if (!allowCombined && !enumTypeInstance.isDefined(value)) {
         AssertUtils.throwArgumentError(
            `The value~ is no valid defined value for enum class "${enumTypeInstance.constructor.name}".`, name);
      } else if (allowCombined && value instanceof EnumItem && value.parentEnum !== enumTypeInstance) {
         AssertUtils.throwArgumentError(
            `The value~ is no valid value for enum class "${enumTypeInstance.constructor.name}".`, name);
      }
   }
}

class AssertUtils {
   /**
    * Throws a new argument error with a formatted message, using the functionality of the
    * {@link #formatErrorMessage} method for formatting the specified {@link message} with the
    * specified {@link valueName}.
    * @param {string} message The message to be formatted.
    * @param {string} [valueName] The name of the variable that should be formatted and inserted
    * whereever the specified token was found. Can be null or undefined.
    */
   static throwArgumentError(message, valueName) {
      throw new ArgumentError(AssertUtils.formatErrorMessage(message, valueName));
   }

   /**
    * Replaces every occurrence of "~" in a specified {@link message} with a formatted version of a 
    * specific {@link valueName} or removes the token from the message, returning the result.
    * @param {string} message The message to be formatted.
    * @param {string} [valueName] The name of the variable that should be formatted and inserted
    * whereever the specified token was found. Can be null or undefined.
    * @returns {string} A new string.
    * @example 
    * Assert.#format("The value~ was invalid.", "variableName");
    * // 'The value of "variableName" was invalid.'
    * Assert.#format("The parameter~ was invalid.");
    * // 'The value was invalid.'
    */
   static formatErrorMessage(message, valueName) {
      if (valueName !== null && valueName !== undefined && valueName.length > 0) {
         return message.replace("~", ` of "${valueName}"`);
      } else {
         return message.replace("~", "");
      }
   }
}