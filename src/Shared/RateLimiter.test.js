// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { RateLimiter } from "./RateLimiter.js";
import { AsyncUtils } from "../Utils/AsyncUtils.js";

export class RateLimiterTest {
   async halfSecondDelay_callOnce_executesOnceImmediately() {
      let start = performance.now();
      let limiter = new RateLimiter(500);
      let counter = 0;
      let callback = () => counter++;
   
      await limiter.executeThrottledAsync(callback);
   
      Assert.equals(1, counter);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 50, "testDuration<50");
   }

   async halfSecondDelay_callThriceWithQueueLimitedToTwo_executesTwice() {
      let limiter = new RateLimiter(500, 1);
      let counter = 0;
      let callback = () => counter++;

      let actualPromise2Error = null;

      let promise1 = limiter.executeThrottledAsync(callback);
      limiter.executeThrottledAsync(callback).catch(error => actualPromise2Error = error);
      let promise3 = limiter.executeThrottledAsync(callback);

      await Promise.all([promise1, promise3]);

      Assert.equalsNot(actualPromise2Error, null);
      Assert.equals(2, counter);
   }

   async halfSecondDelay_callAsyncWithResultOnce_executesOnceImmediatelyAndReturnsResult() {
      let start = performance.now();
      let limiter = new RateLimiter(500);
      let expectedResult = "aValidTestResult";
      let callback = async () => {
         await AsyncUtils.sleep(100);
         return expectedResult;
      }
   
      let actualResult = await limiter.executeThrottledAsync(callback);
   
      Assert.equals(expectedResult, actualResult);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 150, "testDuration<150");
   }

   async halfSecondDelay_callAsyncWithResultTwice_executesTwiceAndReturnsCorrectResults() {
      let start = performance.now();
      let limiter = new RateLimiter(500);
      let expectedResult1 = "aValidTestResult1";
      let expectedResult2 = "aValidTestResult2";
      let callback1 = async () => {
         await AsyncUtils.sleep(100);
         return expectedResult1;
      }
      let callback2 = async () => {
         await AsyncUtils.sleep(100);
         return expectedResult2;
      }
   
      let actualResult1 = await limiter.executeThrottledAsync(callback1);
      let actualResult2 = await limiter.executeThrottledAsync(callback2);
   
      Assert.equals(expectedResult1, actualResult1);
      Assert.equals(expectedResult2, actualResult2);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 650, "testDuration<650");
   }

   async halfSecondDelay_callThriceWithoutDelay_executesThrice() {
      let start = performance.now();
      let throttler = new RateLimiter(500);
      let counter = 0;
      let callback = () => counter++;
   
      let task1 = throttler.executeThrottledAsync(callback);
      let task2 = throttler.executeThrottledAsync(callback);
      let task3 = throttler.executeThrottledAsync(callback);
   
      await Promise.all([task1, task2, task3]);

      Assert.equals(3, counter);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 1050, "testDuration<1050");
   }

   async halfSecondDelay_callThriceWithIncludedDelay_executesThrice() {
      let start = performance.now();
      let throttler = new RateLimiter(500);
      let counter = 0;
      let callback = async () => {
         counter++; await AsyncUtils.sleep(250);
      };
   
      let task1 = throttler.executeThrottledAsync(callback);
      let task2 = throttler.executeThrottledAsync(callback);
      let task3 = throttler.executeThrottledAsync(callback);
   
      await Promise.all([task1, task2, task3]);

      Assert.equals(3, counter);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 1300, "testDuration<1300");
   }

   async halfSecondDelay_callThriceWithSmallerDelayInBetween_executesThrice() {
      let start = performance.now();
      let throttler = new RateLimiter(500);
      let counter = 0;
      let callback = () => counter++;
   
      let task1 = throttler.executeThrottledAsync(callback);
      await AsyncUtils.sleep(400);
      let task2 = throttler.executeThrottledAsync(callback);
      await AsyncUtils.sleep(400);
      let task3 = throttler.executeThrottledAsync(callback);
   
      await Promise.all([task1, task2, task3]);

      Assert.equals(3, counter);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 1050, "testDuration<1050");
   }

   async halfSecondDelay_callThriceWithBiggerDelayInBetween_executesThrice() {
      let start = performance.now();
      let throttler = new RateLimiter(500);
      let counter = 0;
      let callback = () => counter++;
   
      let task1 = throttler.executeThrottledAsync(callback);
      await AsyncUtils.sleep(1000);
      let task2 = throttler.executeThrottledAsync(callback);
      await AsyncUtils.sleep(1000);
      let task3 = throttler.executeThrottledAsync(callback);
   
      await Promise.all([task1, task2, task3]);

      Assert.equals(3, counter);
      let testDuration = performance.now() - start;
      Assert.true(testDuration < 2050, "testDuration<2050");
   }
}