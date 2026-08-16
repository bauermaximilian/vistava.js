// SPDX-License-Identifier: GPL-3.0-or-later

import { ParserError } from "../Errors/ParserError.js";

export class ParseUtils {
   /**
    * @template T
    * @param {any} source 
    * @param {string} memberName 
    * @param {(obj:{})=>T} parser 
    * @param {T} [defaultValue]
    * @returns {T}
    */
   static parseObject(source, memberName, parser, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "object") {
            try {
               let parsedObject = parser(source[memberName]);
               if (parsedObject == null) {
                  throw new ParserError("The parser failed unexpectedly with an undefined result.");
               } else {
                  return parsedObject;
               }
            } catch (error) {
               throw new ParserError(`The value of member "${memberName}" couldn't be parsed: ${error}`);
            }
         } else {
            throw ParserError.newInvalidTypeError(memberName, "object");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }

   /**
    * 
    * @param {any} source 
    * @param {string} memberName 
    * @param {Map<string,string>} [defaultValue]
    * @returns {Map<string,string>}
    */
   static parseStringMap(source, memberName, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "object") {
            let memberValue = source[memberName];
            let returnValue = new Map();
            for (let key of Object.keys(memberValue)) {
               let keyValue = memberValue[key];
               if (typeof (keyValue) === "string") {
                  returnValue.set(key, keyValue);
               } else {
                  throw ParserError.newInvalidTypeError(`${memberName}.${key}`, "string");
               }
            }
            return returnValue;
         } else {
            throw ParserError.newInvalidTypeError(memberName, "object");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }

   /**
    * 
    * @param {any} source 
    * @param {string} memberName 
    * @param {number?} [defaultValue]
    * @returns {number?}
    */
   static parseNumber(source, memberName, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "number") {
            return source[memberName];
         } else {
            throw ParserError.newInvalidTypeError(memberName, "number");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }

   /**
    * 
    * @param {any} source 
    * @param {string} memberName 
    * @param {boolean} allowZero 
    * @param {number?} [defaultValue]
    * @returns {number?}
    */
   static parseNumberPositive(source, memberName, allowZero, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "number") {
            if ((source[memberName] > 0 && !allowZero) || (source[memberName] >= 0 && allowZero)) {
               return source[memberName];
            } else {
               throw ParserError.newInvalidTypeValueError(memberName);
            }
         } else {
            throw ParserError.newInvalidTypeError(memberName, "number");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }

   /**
    * 
    * @param {any} source 
    * @param {string} memberName 
    * @param {string?} [defaultValue]
    * @returns {string?}
    */
   static parseString(source, memberName, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "string") {
            return source[memberName];
         } else {
            throw ParserError.newInvalidTypeError(memberName, "string");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }

   /**
    * 
    * @param {any} source 
    * @param {string} memberName 
    * @param {boolean?} [defaultValue]
    * @returns {boolean?}
    */
   static parseBoolean(source, memberName, defaultValue) {
      if (memberName in source) {
         if (typeof (source[memberName]) === "boolean") {
            return source[memberName];
         } else {
            throw ParserError.newInvalidTypeError(memberName, "boolean");
         }
      } else if (defaultValue !== undefined) {
         return defaultValue;
      } else {
         throw ParserError.newMissingMemberError(memberName);
      }
   }
}

export { ParseUtils as PU }