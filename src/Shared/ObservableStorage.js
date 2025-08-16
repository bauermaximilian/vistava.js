// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { EventController } from "./Event.js";
import { CU } from "../Utils/ClassUtils.js";

/**
 * @callback Validator A function that throws an {@link Error} if the provided {@link value} is invalid.
 * If the value is valid, calling this function should have no effect.
 * @param {any} value The value to be validated.
 * @throws {Error} Is thrown when the value is not valid.
 */

/**
 * @template TParentModel
 * Provides an observable storage to be used internally by model classes.
 * Explicitly specifying the type of the storage field in the model class should ensure that the field names
 * used in the "get" and "set" methods (and the "onUpdated" event) are valid field/property names of the model itself.
 * @example
 * export class MyModel {
 *    //ObservableStorage<MyModel>
 *    #storage = new ObservableStorage();
 *    get str() { return this.#storage.get("str", ""); }
 *    set str(value) { this.#storage.set("str", value, Assert.string); }
 *    get num() { return this.#storage.get("num", 0); }
 *    set num(value) { this.#storage.set("num", value, Assert.number); }
 *    get onUpdated() { return this.#storage.onUpdated; }
 *    
 *    apply(obj) { ObservableStorage.apply(obj, this, this.#storage); }
 * }
 * let myModel = new MyModel();
 * myModel.apply({ num: 42, str: "a" }); // Assignments get validated
 * // myModel.num = "asdf"; // Would throw a validation error
 */
export class ObservableStorage {
   get onUpdated() { return this.#onUpdated.event; }

   /** @type {Object.<keyof(TParentModel),any>} */
   #storage = {};
   /** @type {any[]} */
   #changedKeys = [];
   /** @type {EventController<import("./Event.js").FieldsChangedEventArgs<TParentModel>>} */
   #onUpdated = new EventController();
   /** @type {boolean} */
   #onUpdatedDisabled = false;

   constructor() {
   }
   
   /**
    * @param {keyof(TParentModel)} key 
    * @param {any} [defaultValue = undefined]
    * @returns {any}
    */
   get(key, defaultValue = undefined){
      let value = this.#storage[key];
      
      if (value === undefined) {
         return defaultValue;
      } else {
         return value;
      }
   }

   /**
    * @param {keyof(TParentModel)} key 
    * @param {any} value 
    * @param {Validator} [validator = undefined]
    */
   set(key, value, validator = undefined) {
      let oldValue = this.#storage[key];
      if (oldValue !== value) {
         validator?.(value);
         this.#storage[key] = value;
         this.#changedKeys.push(key);
         this.#triggerOnUpdated();
      }
   }

   #triggerOnUpdated = () => {
      if (!this.#onUpdatedDisabled) {
         this.#onUpdated.trigger({ keys: this.#changedKeys });
         this.#changedKeys = [];
      }
   };

   /**
    * @template TParentModel
    * @param {Object.<keyof(TParentModel),any>} object 
    * @param {TParentModel} targetModel 
    * @param {ObservableStorage<TParentModel>} modelBaseStorage
    */
   static apply(object, targetModel, modelBaseStorage) {
      Assert.class(modelBaseStorage, ObservableStorage, "modelBaseStorage");
         
      modelBaseStorage.#onUpdatedDisabled = true;

      try {
         for (let key of CU.getPropertyAndFieldNames(object, true)) {
            if (key in object) {
               targetModel[key] = object[key];
            }
         }
      } finally {
         modelBaseStorage.#onUpdatedDisabled = false;
      }

      modelBaseStorage.#triggerOnUpdated();
   }
}