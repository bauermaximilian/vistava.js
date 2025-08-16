// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { ArgumentError } from "../Errors/ArgumentError.js";
import { InvalidOperationError } from "../Errors/InvalidOperationError.js";
import { CU } from "../Utils/ClassUtils.js";

const enumItemCreationToken = Symbol("internal-enum-item-constructor-token");

/**
 * Defines a base class for classes that define a type of an enum.
 * The singleton pattern is recommended for using the enum and its values, as demonstrated in the code example below.
 * @abstract This class should not be instantiated directly.
 * @example
 * export class IngredientType extends EnumType {
 *   static #enum = new IngredientType();
 *   static get enum() { return IngredientType.#enum; }
 * 
 *   // For "hasFlags" compatibility, the values must be a power of 2.
 *   // Otherwise, integer values greater than 0 are fine.
 *   get butter() { return this.getItem(1, "butter"); }
 *   get flour() { return this.getItem(2, "flour"); }
 *   get salt() { return this.getItem(4, "salt"); }
 * }
 * export const Ingredients = IngredientType.enum;
 * 
 * // Other file where the enum should actually be used
 * import { Ingredients } from "./IngredientType.js";
 * let butter = Ingredients.butter; // EnumItem<IngredientType>
 * let recipe = Ingredients.combine(Ingredient.salt, Ingredient.flour);
 * let flourIsFlour = Ingredients.flour === Ingredients.flour; //true
 * let flourIsSalt = Ingredients.flour === Ingredients.salt; //false
 * let recipeHasFlour = recipe.hasFlags(Ingredients.flour); //true
 * let recipeHasButter = recipe.hasFlags(Ingredients.butter); //false
 * let recipeIsIngredient = Ingredients.isDefined(recipe); //false
 */
export class EnumType {
   /** @type {Map<number, EnumItem>} */
   #items = new Map();
   /** @type {Map<EnumItem, number>} */
   #itemValues = new Map();

   /** Initializes a new {@link EnumType} instance. */
   constructor() {
      for (let propertyName of CU.getPropertyNames(this, true, false)) {
         this[propertyName];
      }
   }
   
   /**
    * 
    * @protected This method should only be called by classes derived from {@link EnumType}.
    * @param {number} itemValue The integer value of the new item, which must be equal to/greater than 0. 
    * If the {@link EnumItem.hasFlags} functionality should be supported, the value should be a power of two.
    * @param {keyof(this)&string} itemName The name of the item as a non-empty or whitespace-only string. 
    * Should be the key of a property in the (deriving) class.
    * @returns {EnumItem<this>} A new {@link EnumItem} instance, linked to the current {@link EnumType} instance.
    * @throws {ArgumentError} Is thrown when one of the provided arguments is invalid.
    * @throws {InvalidOperationError} Is thrown when this method is called with {@link itemValue}, that was previously
    * defined with another {@link itemName}.
    */
   getItem(itemValue, itemName) {
      let item = this.#items.get(itemValue);
      if (item == null) {         
         item = new EnumItem(this, itemValue, itemName, enumItemCreationToken);
         this.#items.set(itemValue, item);
         this.#itemValues.set(item, itemValue);
      } else if (item.name !== itemName) {
         throw new InvalidOperationError("The item with the specified index has an invalid name.");
      }
      return item;
   }

   /** 
    * Returns a iterable {@link Generator}, which iterates the item names of all {@link EnumItem} instances
    * defined by the current instance.
    * @returns {Generator<string, void, void>} An iterable {@link Generator}.
    */
   *getNames() {
      for (let value of this.#items) {
         yield value[1].name;
      }
   }

   /** 
    * Returns a iterable {@link Generator}, which iterates the item values of all {@link EnumItem} instances
    * defined by the current instance.
    * @returns {Generator<number, void, void>} An iterable {@link Generator}.
    */
   *getValues() {
      for (let value of this.#itemValues) {
         yield value[1];
      }
   }

   /** 
    * Returns a iterable {@link Generator}, which iterates the items of all {@link EnumItem} instances
    * defined by the current instance.
    * @returns {Generator<EnumItem<this>, void, void>} 
    */
   *getItems() {
      for (let value of this.#items) {
         yield value[1];
      }
   }

   /**
    * Creates a new {@link EnumItem} with a {@link EnumItem.value} that is the bitwise-OR combination of all
    * provided {@link enumItems} and a {@link EnumItem.name} that combines the names of all provided 
    * {@link enumItems} (separated by a '|' character).
    * This method is the equivalent of combining enum flags in C-like languages with the '|' operator.
    * @param  {...EnumItem<this>} enumItems The {@link EnumItem} instances to be combined
    * @returns {EnumItem<this>} A new 
    * @example
    * // Requires "butter" and "flour" to have power-of-two values.
    * let recipe = Ingredients.combine(Ingredient.salt, Ingredient.flour);
    * let recipeHasFlour = recipe.hasFlags(Ingredients.flour); //true
    * let recipeHasButter = recipe.hasFlags(Ingredients.butter); //false
    * let recipeIsIngredient = Ingredients.isDefined(recipe); //false
    */
   combine(...enumItems) {
      let combinedName = "";
      let combinedValue = 0;

      for (let i = 0; i < enumItems.length; i++) {
         let enumItem = enumItems[i];
         if (enumItem.parentEnum === this) {
            if (combinedName !== "") {
               combinedName += "|";
            }
            combinedName += enumItem.name;
            combinedValue |= enumItem.value;
         } else {
            throw new ArgumentError(`The enum item #${i} has an invalid type.`);
         }
      }

      return new EnumItem(this, combinedValue, combinedName, enumItemCreationToken);
   }

   /**
    * Checks whether an {@link EnumItem} instance is a valid item defined by the current instance.
    * @param {EnumItem} enumItem The {@link EnumItem} to be checked.
    * @returns {boolean} true if the item is defined by the current instance,
    * false if it is a combination of (potentially valid) values or an externally created item not directly
    * defined by this instance.
    */
   isDefined(enumItem) {
      return this.#itemValues.has(enumItem);
   }
}

/**
 * Represents an item of a {@link EnumType} implementation
 * @template {EnumType} TEnum The class, derived from EnumType, in which the item is defined.
 */
export class EnumItem {
   /** Gets the parent {@link EnumType} instance this item is defined in. */
   get parentEnum() { return this.#parentEnum; }
   /** 
    * Gets the integer value of the current item, which may be used for {@link hasFlags}
    * (if it is a power of two).
    */
   get value() { return this.#value; }
   /** Gets the name of the current item. */
   get name() { return this.#name; }

   /** @type {TEnum} */
   #parentEnum;
   /** @type {number} */
   #value;
   /** @type {string} */
   #name;

   /**
    * Initializes a new {@link EnumItem} instance.
    * This constructor can only be called from within {@link EnumType}.
    * @package
    * @param {TEnum} parentEnum The parent {@link EnumType} instance, which defined this instance.
    * @param {number} itemValue The value of the item. Must be an integer equal to/greater than 0.
    * @param {string} itemName The name of the item. Must not be empty or whitespaces only.
    * @param {Symbol} creationToken The creation token, which is only available from within the {@link EnumType}
    * source file, preventing accidental creation of new {@link EnumItem} instances outside {@link EnumType} classes.
    * @throws {ArgumentError} Is thrown when one of the provided arguments is invalid.
    */
   constructor(parentEnum, itemValue, itemName, creationToken) {
      Assert.class(parentEnum, EnumType, "parentEnum");
      Assert.numberIntegerPositiveOrZero(itemValue, "itemValue");
      Assert.stringNotEmptyOrWhitespacesOnly(itemName, "itemName");

      this.#parentEnum = parentEnum;
      this.#value = itemValue;
      this.#name = itemName;
      if (creationToken !== enumItemCreationToken) {
         throw new ArgumentError("The specified creation token is invalid.");
      }
   }

   /**
    * Checks whether the current instance value has one or more flags, defined through the values of
    * the specified {@link otherEnumItems}.
    * @param {...this} otherEnumItems The other enum items that should be checked whether they are "contained"
    * in the value of the current instance (using bitwise-AND).
    * @returns {boolean} true if all specified {@link otherEnumItems} are "contained" in the current instance
    * {@link value}, false otherwise.
    * @throws {ArgumentError} Is thrown when any of the specified {@link otherEnumItems} has a different
    * {@link parentEnum} instance than the current instance.
    * @example
    * // Requires "butter" and "flour" to have power-of-two values.
    * let recipe = Ingredients.combine(Ingredient.salt, Ingredient.flour);
    * let recipeHasFlour = recipe.hasFlags(Ingredients.flour); //true
    * let recipeHasButter = recipe.hasFlags(Ingredients.butter); //false
    * let recipeIsIngredient = Ingredients.isDefined(recipe); //false
    */
   hasFlags(...otherEnumItems) {
      for (let i = 0; i < otherEnumItems.length; i++) {
         let otherEnumItem = otherEnumItems[i];
         if (otherEnumItem.parentEnum === this.parentEnum) {
            if (!(this.#value & otherEnumItem.value)) {
               return false;
            }
         } else {
            throw new ArgumentError(`The enum item #${i} has an invalid type.`);
         }
      }
      return true;
   }
}