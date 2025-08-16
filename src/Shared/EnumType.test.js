// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { EnumType, EnumItem } from "./EnumType.js";

export class TypedEnumTests {
   constructor_testEnumClass_executesProperly() {
      let enumInstance = SandwichContentType.enum;
      Assert.defined(enumInstance);
      Assert.equals(SandwichContents, enumInstance);
   }

   constructor_testEnumClass_allPropertiesPassAssertions() {
      Assert.defined(SandwichContents.butter);
      Assert.defined(SandwichContents.jam);
      Assert.defined(SandwichContents.salt);

      Assert.enumType(SandwichContents.butter, SandwichContents, false, "butter");
      Assert.enumType(SandwichContents.butter, SandwichContents, false, "jam");
      Assert.enumType(SandwichContents.butter, SandwichContents, false, "salt");

      // The EnumItem constructor must only be called by the EnumType base class.
      Assert.throws(() => new EnumItem(SandwichContents, 2, "jam", Symbol("internal-enum-item-constructor-token")));
      Assert.throws(() => Assert.enumType(
         SandwichContents.combine(SandwichContents.butter, SandwichContents.jam), SandwichContents, false));
      Assert.enumType(
         SandwichContents.combine(SandwichContents.butter, SandwichContents.jam), SandwichContents, true);
   }

   getNames_testEnumClass_returnsAllNames() {
      let allNames = [...SandwichContentType.enum.getNames()];
      Assert.contains(allNames, "butter");
      Assert.contains(allNames, "jam");
      Assert.contains(allNames, "salt");
   }

   getValues_testEnumClass_returnsAllValues() {
      let allValues = [...SandwichContentType.enum.getItems()];
      Assert.contains(allValues, SandwichContentType.enum.butter);
      Assert.contains(allValues, SandwichContentType.enum.jam);
      Assert.contains(allValues, SandwichContentType.enum.salt);
   }

   getItem_sameValueAndNameTwice_returnsSameInstances() {
      let firstRequestedValue = SandwichContentType.enum.butter;
      let secondRequestedValue = SandwichContentType.enum.butter;
      Assert.equals(firstRequestedValue, secondRequestedValue);
   }

   getItem_differentValueAndName_returnsDifferentInstances() {
      let firstRequestedValue = SandwichContentType.enum.jam;
      let secondRequestedValue = SandwichContentType.enum.butter;
      Assert.equalsNot(firstRequestedValue, secondRequestedValue);
   }

   getItem_sameValueDifferentName_throwsError() {
      //@ts-ignore: getItem is "protected"
      SandwichContentType.enum.getItem(1, "butter");
      //@ts-ignore: getItem is "protected"
      Assert.throws(() => SandwichContentType.enum.getItem(1, "jam"));
   }

   combine_twoValues_returnsExpectedNewItem() {
      let sandwichContent = SandwichContentType.enum.combine(SandwichContentType.enum.butter,
         SandwichContentType.enum.jam);
      Assert.equals("butter|jam", sandwichContent.name);
      Assert.equals(1 | 2, sandwichContent.value);
   }

   hasFlag_combinedValue_returnsExpectedResults() {
      let sandwichContent = SandwichContentType.enum.combine(SandwichContentType.enum.butter,
         SandwichContentType.enum.jam);
      Assert.true(sandwichContent.hasFlags(SandwichContentType.enum.jam));
      Assert.false(sandwichContent.hasFlags(SandwichContentType.enum.salt));
   }
}

class SandwichContentType extends EnumType {
   static #enum = new SandwichContentType();
   static get enum() { return this.#enum; }

   get butter() { return this.getItem(1, "butter"); }
   get jam() { return this.getItem(2, "jam"); }
   get salt() { return this.getItem(4, "salt"); }
}
const SandwichContents = SandwichContentType.enum;
/** @typedef {EnumItem<SandwichContentType>} SandwichContent */