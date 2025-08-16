// SPDX-License-Identifier: GPL-3.0-or-later

import { VectorUtils } from "./VectorUtils.js";
import { Assert } from "../Shared/Assert.js";

export class VectorTest {
   createNew_validValues() {
      let vector = VectorUtils.new(1, 2);
      Assert.equals(1, vector[0], "vector[0]");
      Assert.equals(2, vector[1], "vector[1]");
   }

   test_throws() {
      Assert.throws(() => {
         throw new Error("ye");
      });
   }
}

export class OtherTest {
   doSomething_yey() {
      return "Optional result string."
   }

   doAndFailPls() {
      throw new Error("Failed successfully.");
   }

   doSomethingSlowlyAsync() {
      return new Promise(resolve => {
         setTimeout(resolve, 2000);
      });
   }

   doSomethingSlowlyAndFailAsync() {
      return new Promise((resolve, reject) => {
         setTimeout(() => {
            reject(new Error("Failed successfully."));
         }, 1000);
      });
   }
}