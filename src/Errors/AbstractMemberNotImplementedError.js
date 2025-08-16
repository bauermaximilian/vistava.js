// SPDX-License-Identifier: GPL-3.0-or-later

import { NotImplementedError } from "./NotImplementedError.js";

export class AbstractMemberNotImplementedError extends NotImplementedError {
   /**
    * @param {string} [memberName]
    */
   constructor(memberName) {
      let memberNameFragment = (typeof(memberName) === "string" && memberName.trim().length > 0) ?
         `member "${memberName.trim()}"` : "current member";
      super(`The ${memberNameFragment} wasn't overridden by any derived class.`);
   }
}