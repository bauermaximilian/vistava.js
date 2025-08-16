// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Provides utility methods for commonly used string operations.
 */
export class StringUtils {
   /**
    * Checks whether a provided {@link value} is a valid non-empty string.
    * @param {any} value The value to be checked.
    * @returns True if the specified {@link value} is a valid non-empty string; false otherwise.
    */
   static isNotEmpty(value) {
      return value != null && typeof(value) === "string" && value.length > 0 ;
   }

   /**
    * Checks whether a provided {@link value} is a valid non-empty string that doesn't just consist
    * of whitespaces.
    * @param {any} value The value to be checked.
    * @returns True if the specified {@link value} is a valid non-empty string which doesn't just 
    * consist of whitespaces; false otherwise.
    */
   static isNotBlank(value) {
      return value != null && typeof(value) === "string" && value.trim().length > 0;
   }

   /**
    * Converts a string (or the string representation of any object) to an integer.
    * Returns null if the conversion failed.
    * @param {any} value The value, either as a string, or as an object that will be converted to a string.
    * @returns {number?} The parsed integer, or null if the conversion failed.
    */
   static parseInt(value) {
      let valueString = value?.toString() ?? null;
      if (valueString !== null) {
         let valueInt = parseInt(valueString);
         if (!isNaN(valueInt)) {
            return valueInt;
         }
      }
      return null;
   }

   /**
    * Converts a string (or the string representation of any object) to an float.
    * Returns null if the conversion failed.
    * @param {any} value The value, either as a string, or as an object that will be converted to a string.
    * @returns {number?} The parsed float, or null if the conversion failed.
    */
   static parseFloat(value) {
      let valueString = value?.toString() ?? null;
      if (valueString !== null) {
         let valueFloat = parseFloat(valueString);
         if (!isNaN(valueFloat)) {
            return valueFloat;
         }
      }
      return null;
   }
}

export { StringUtils as SU }