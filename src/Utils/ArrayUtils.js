// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../Shared/Assert.js";

export class ArrayUtils {
   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {(item:TItem)=>boolean} predicate 
    * @param {(itemToBeRemoved:TItem)=>void} [disposeAction]
    * @returns {number} The amount of removed elements.
    * @throws {ArgumentError}
    */
   static removeWhere(array, predicate, disposeAction) {
      Assert.array(array, "array");
      Assert.function(predicate, "predicate");
      if (disposeAction) {
         Assert.function(disposeAction, "disposeAction");
      }

      let itemsToRemove = [];
      for (let i = 0; i < array.length; i++) {
         if (predicate(array[i])) {
            itemsToRemove.push(array[i]);
         }
      }

      for (let item of itemsToRemove) {
         ArrayUtils.remove(array, item);
         if (disposeAction) {
            disposeAction(item);
         }
      }

      return itemsToRemove.length;
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {number} index 
    * @param {(itemToBeRemoved:TItem)=>void} [disposeAction]
    * @throws {ArgumentError}
    */
   static removeAt(array, index, disposeAction) {
      Assert.defined(array, "array");
      Assert.arrayIndex(index, array, "index");
      if (disposeAction) {
         Assert.function(disposeAction, "disposeAction");
      }
      let removedItems = array.splice(index, 1);
      if (disposeAction){
         disposeAction(removedItems[0]);
      }
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {TItem} item 
    * @param {number} index 
    */
   static insertAt(array, item, index) {
      Assert.array(array, "array");
      Assert.defined(item, "item");
      Assert.numberIntegerPositiveOrZero(index, "index");

      array.splice(index, 0, item);
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {TItem} item 
    * @param {(itemToBeRemoved:TItem)=>void} [disposeAction]
    * @returns {boolean}
    * @throws {ArgumentError}
    */
   static remove(array, item, disposeAction) {
      Assert.array(array, "array");
      Assert.defined(item, "item");

      let index = array.indexOf(item);
      if (index >= 0) {
         ArrayUtils.removeAt(array, index, disposeAction);
         return true;
      } else {
         return false;
      }
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {TItem} item 
    * @returns {boolean}
    * @throws {ArgumentError}
    */
   static contains(array, item) {
      Assert.array(array, "array");
      Assert.defined(item, "item");

      let index = array.indexOf(item);
      return index >= 0;
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @param {(item:TItem)=>boolean} [predicate]
    * @returns {boolean}
    * @throws {ArgumentError}
    */
   static any(array, predicate) {
      Assert.array(array, "array");
      if (predicate) {
         Assert.function(predicate, "predicate");
         for (let i = 0; i < array.length; i++) {
            if (predicate(array[i])) {
               return true;
            }
         }
   
         return false;
      } else {
         return array.length > 0;
      }
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]|(readonly TItem[])} array 
    * @param {(item:TItem)=>boolean} predicate 
    * @returns {TItem?}
    * @throws {ArgumentError}
    */
   static findFirstOrNull(array, predicate) {
      Assert.array(array, "array");
      Assert.function(predicate, "predicate");

      for (let i = 0; i < array.length; i++) {
         if (predicate(array[i])) {
            return array[i];
         }
      }

      return null;
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array 
    * @returns {TItem?}
    * @throws {ArgumentError}
    */
   static firstOrNull(array) {
      Assert.array(array, "array");

      if (array.length > 0) {
         return array[0];
      } else {
         return null;
      }
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]|(readonly TItem[])} array 
    * @param {(item:TItem)=>boolean} predicate 
    * @returns {TItem?}
    * @throws {ArgumentError}
    */
   static findLastOrNull(array, predicate) {
      Assert.array(array, "array");
      Assert.function(predicate, "predicate");

      for (let i = array.length - 1; i >= 0; i--) {
         if (predicate(array[i])) {
            return array[i];
         }
      }

      return null;
   }

   /**
    * 
    * @template TItem
    * @param {TItem[]} array
    * @returns {TItem?}
    * @throws {ArgumentError}
    */
   static lastOrNull(array) {
      Assert.array(array, "array");

      if (array.length > 0) {
         return array[array.length - 1];
      } else {
         return null;
      }
   }
}

export { ArrayUtils as AU }