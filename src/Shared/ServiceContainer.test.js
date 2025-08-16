// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { ArgumentError } from "../Errors/ArgumentError.js";
import { InvalidOperationError } from "../Errors/InvalidOperationError.js";
import { ServiceContainer } from "./ServiceContainer.js";

export class ServiceContainerTest {
   register_oneSingleton_getsRegistered() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());

      Assert.equals(1, serviceContainer.serviceCount);
   }

   registerAndResolve_oneSingleton_getsRegisteredAndResolved() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());      
      let serviceInstance1 = serviceContainer.resolve(FirstService);
      let serviceInstance2 = serviceContainer.resolve(FirstService);

      Assert.equals(1, serviceContainer.serviceCount);
      Assert.equals(serviceInstance1, serviceInstance2);
      Assert.class(serviceInstance1, FirstService);
      Assert.class(serviceInstance2, FirstService);
   }

   registerAndResolve_oneNonSingleton_getsRegisteredAndResolved() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService(), false);
      let serviceInstance1 = serviceContainer.resolve(FirstService);
      let serviceInstance2 = serviceContainer.resolve(FirstService);

      Assert.equals(1, serviceContainer.serviceCount);
      Assert.equalsNot(serviceInstance1, serviceInstance2);
      Assert.class(serviceInstance1, FirstService);
      Assert.class(serviceInstance2, FirstService);
   }

   register_twoSingletons_getsRegistered() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());
      serviceContainer.register(SecondService, c => new SecondService(new FirstService()));

      Assert.equals(2, serviceContainer.serviceCount);
   }

   registerTwice_oneSingleton_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());
      Assert.throws(() => serviceContainer.register(FirstService, c => new FirstService()),
         ArgumentError);

      Assert.equals(1, serviceContainer.serviceCount);
   }

   registerTwice_oneSingletonOneNonSingleton_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService(), true);
      Assert.throws(() => serviceContainer.register(FirstService, c => new FirstService(), false),
         ArgumentError);

      Assert.equals(1, serviceContainer.serviceCount);
   }

   registerAndResolve_twoDependentSingletons_getsRegisteredAndResolved() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());
      serviceContainer.register(SecondService, 
         c => new SecondService(c.resolveRequired(FirstService)));
      let firstService = serviceContainer.resolveRequired(FirstService);
      let secondService = serviceContainer.resolveRequired(SecondService);

      Assert.equals(2, serviceContainer.serviceCount);
      Assert.class(firstService, FirstService);
      Assert.class(secondService, SecondService);
      Assert.equals(firstService, secondService.firstService);
   }

   registerAndResolveInverted_twoDependentSingletons_getsRegisteredAndResolved() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new FirstService());
      serviceContainer.register(SecondService, 
         c => new SecondService(c.resolveRequired(FirstService)));
      let secondService = serviceContainer.resolveRequired(SecondService);
      let firstService = serviceContainer.resolveRequired(FirstService);

      Assert.equals(2, serviceContainer.serviceCount);
      Assert.class(firstService, FirstService);
      Assert.class(secondService, SecondService);
      Assert.equals(firstService, secondService.firstService);
   }

   registerAndResolve_twoCyclicDependentSingletons_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(CyclicDependentServiceA, 
         c => new CyclicDependentServiceA(c.resolveRequired(CyclicDependentServiceB)));
      serviceContainer.register(CyclicDependentServiceB, 
         c => new CyclicDependentServiceA(c.resolveRequired(CyclicDependentServiceA)));

      Assert.throws(() => serviceContainer.resolveRequired(CyclicDependentServiceA), 
         InvalidOperationError);
      Assert.equals(2, serviceContainer.serviceCount);
   }

   registerAndResolve_selfDependentSingleton_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(SelfDependentService, 
         c => new SelfDependentService(c.resolveRequired(SelfDependentService)));

      Assert.throws(() => serviceContainer.resolveRequired(SelfDependentService), 
         InvalidOperationError);
      Assert.equals(1, serviceContainer.serviceCount);         
   }

   registerAndResolve_typeAndFactoryReturnTypeMismatch_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => new SecondService(new FirstService()));

      Assert.throws(() => serviceContainer.resolveRequired(FirstService), 
         InvalidOperationError);
      Assert.equals(1, serviceContainer.serviceCount);
   }

   registerAndResolve_factoryReturnsNull_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => null);

      Assert.throws(() => serviceContainer.resolve(FirstService), 
         InvalidOperationError);
      Assert.throws(() => serviceContainer.resolveRequired(FirstService), 
         InvalidOperationError);
      Assert.equals(1, serviceContainer.serviceCount);
   }

   registerAndResolve_factoryReturnsUndefined_throwsError() {
      let serviceContainer = new ServiceContainer();

      serviceContainer.register(FirstService, c => undefined);

      Assert.throws(() => serviceContainer.resolve(FirstService), 
         InvalidOperationError);
      Assert.throws(() => serviceContainer.resolveRequired(FirstService), 
         InvalidOperationError);
      Assert.equals(1, serviceContainer.serviceCount);
   }
}

class FirstService {
}

class SecondService {
   #firstService;

   get firstService() { return this.#firstService; }

   /**
    * @param {FirstService} firstService 
    */
   constructor(firstService) {
      this.#firstService = firstService;
   }
}

class CyclicDependentServiceA {
   constructor(cyclicDependentServiceB) { }
}

class CyclicDependentServiceB {
   constructor(cyclicDependentServiceA) { }
}

class SelfDependentService {
   constructor(selfDependentService) { }
}