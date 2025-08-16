// SPDX-License-Identifier: GPL-3.0-or-later

import { InvalidOperationError } from "../Errors/InvalidOperationError.js";

/** 
 * @template {any} T
 * @typedef {new (...args) => T} ClassType<T> 
 */

export class ClassUtils {
   /**
    * @template {any} T
    * @param {ClassType<T>} classType 
    * @returns {string?}
    */
   static getClassName(classType) {
      let targetTypeName = classType?.prototype?.constructor?.name;
      if (typeof(targetTypeName) === "string") {
         return targetTypeName;
      } else {
         return null;
      }
   }

   /**
    * @param {object} instance 
    * @returns {ClassType<any>} 
    */
   static getClassType(instance) {
      let classType = Object.getPrototypeOf(instance).constructor;
      if (classType != null) {
         return classType;
      } else {
         throw new InvalidOperationError("The specified instance was no valid class instance.");
      } 
   } 

   static * getFieldNames(obj) {
      for (let fieldName of Object.keys(obj)) {
         yield fieldName;
      }
   }

   static * getPropertyNames(obj, requireGet = false, requireSet = false) {
      let properties = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(obj));
      for (let propertyName of Object.keys(properties)) {
         let hasGet = "get" in properties[propertyName] && properties[propertyName].get != null;
         let hasSet = "set" in properties[propertyName] && properties[propertyName].set != null;
         if (propertyName !== "__proto__" && (hasGet || hasSet) &&
            (!requireGet || (requireGet && hasGet)) && (!requireSet || (requireSet && hasSet))) {
            yield propertyName;
         }
      }
   }

   static * getPropertyAndFieldNames(obj, requirePropertyGet = false, requirePropertySet = false) {
      yield* ClassUtils.getFieldNames(obj);
      yield* ClassUtils.getPropertyNames(obj, requirePropertyGet, requirePropertySet);
   }
}

export { ClassUtils as CU }