// SPDX-License-Identifier: GPL-3.0-or-later

export class ParserError extends Error {
   /**
    * @param {string} [message]
    */
   constructor(message) {
      super(message);
   }

   /**
    * @param {string} memberName
    * @returns {ParserError}
    */
   static newMissingMemberError(memberName) {
      return new ParserError(`The member "${memberName}" wasn't found.`);
   }

   /**
    * @param {string} memberName
    * @param {string} typeName
    * @returns {ParserError}
    */
   static newInvalidTypeError(memberName, typeName) {
      return new ParserError(`The value of member "${memberName}" isn't of type ${typeName}.`);
   }

   /**
    * @param {string} memberName
    * @returns {ParserError}
    */
   static newInvalidTypeValueError(memberName) {
      return new ParserError(`The value of member "${memberName}" is outside the valid range.`);
   }
}