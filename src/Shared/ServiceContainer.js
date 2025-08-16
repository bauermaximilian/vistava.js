// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { ArgumentError } from "../Errors/ArgumentError.js";
import { ImplementationError } from "../Errors/ImplementationError.js";
import { InvalidOperationError } from "../Errors/InvalidOperationError.js";

/**
 * @template {any} T
 * @typedef {(serviceContainer:ServiceContainer)=>T} ServiceFactory<T>
 */
export class ServiceContainer {
   /**
    * @template {any} TService
    * @typedef {object} ServiceDefinition
    * @property {ServiceFactory<TService>} serviceFactory
    * @property {boolean} isSingleton
    */

   /** 
    * @template {any} T
    * @typedef {import("../Utils/ClassUtils.js").ClassType<T>} ClassType<T> 
    */

   static #defaultContainer = new ServiceContainer();

   /** @readonly @type {number} */
   #pendingResolvesTreshold = 100;
   /** @type {Map<ClassType<any>, null>} */
   #pendingResolves = new Map();

   /** @type {Map<ClassType<any>, any>} */
   #services = new Map();
   /** @type {Map<ClassType<any>, ServiceDefinition<any>>} */
   #serviceFactories = new Map();

   /**
    * Gets the default {@link ServiceContainer} instance.
    */
   static get default() { return this.#defaultContainer; }

   get serviceCount() {
      return this.#serviceFactories.size;
   }

   /**
    * Register a service of a specific type in the current container.
    * @template {any} TService The t
    * @param {ClassType<TService>} serviceClassType 
    * @param {ServiceFactory<TService>} serviceFactory 
    * @param {boolean} [isSingleton=true] 
    * @throws {ArgumentError} Is thrown when the specified {@link serviceClassType} 
    * is already registered.
    */
   register(serviceClassType, serviceFactory, isSingleton = true) {
      Assert.classType(serviceClassType, "serviceClassType");
      Assert.function(serviceFactory, "serviceFactory");

      if (this.#serviceFactories.has(serviceClassType)) {
         throw new ArgumentError("The specified service class type is already registered.");
      }

      this.#serviceFactories.set(serviceClassType, { serviceFactory, isSingleton });
   }

   /**
    * @param {ClassType<any>} serviceClassType 
    * @returns {boolean}
    */
   unregister(serviceClassType) {
      return this.#serviceFactories.delete(serviceClassType);
   }

   /**
    * @template {any} TService
    * @param {ClassType<TService>} serviceClassType 
    * @returns {TService?}
    * @throws {InvalidOperationError}
    */
   resolve(serviceClassType) {
      // Return any previously inintialized (singleton) service instance, if available.
      /** @type {TService?} */
      let serviceInstance = this.#services.get(serviceClassType) ?? null;
      if (serviceInstance !== null) {
         return serviceInstance;
      }

      // If the service wasn't registered, return null.
      let serviceDefinition = this.#serviceFactories.get(serviceClassType) ?? null;
      if (serviceDefinition === null) {
         return null;
      }

      // Perform a few checks to avoid endless loops due to cyclic dependencies.
      let isFirstResolveInChain = this.#pendingResolves.size === 0;
      if (this.#pendingResolves.has(serviceClassType)) {
         throw new InvalidOperationError("One or more services had a cyclic dependency on each " + 
            "other that couldn't be resolved.");
      }
      if (this.#pendingResolves.size > this.#pendingResolvesTreshold) {
         throw new InvalidOperationError("The dependency chain exceeded the maximum limit and " + 
            "can't be resolved.");
      }
      this.#pendingResolves.set(serviceClassType, null);

      try {
         // Attempt to initialize the service using its factory and store the new instance in this
         // container, if it was defined as singleton during registering.
         serviceInstance = serviceDefinition.serviceFactory(this);
         if (serviceDefinition.isSingleton) {
            this.#services.set(serviceClassType, serviceInstance);
         }
      } finally {
         this.#pendingResolves.delete(serviceClassType);
      }

      if (!(serviceInstance instanceof serviceClassType) || serviceInstance === null) {
         throw new InvalidOperationError("The requested service factory returned an " + 
            "invalid service instance value.")
      }

      if (isFirstResolveInChain && this.#pendingResolves.size !== 0) {
         throw new ImplementationError();
      }

      return serviceInstance;
   }

   /**
    * @template {any} TService
    * @param {ClassType<TService>} serviceClassType 
    * @returns {TService}
    * @throws {ArgumentError} 
    * @throws {InvalidOperationError}
    */
   resolveRequired(serviceClassType) {
      Assert.classType(serviceClassType, "serviceClassType");

      let service = this.resolve(serviceClassType);
      if (service === null) {
         throw new ArgumentError("No service with the specified class type is available.");
      } else {
         return service;
      }
   }
}