// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "./Assert.js";
import { Disposable } from "./Disposable.js";

/**
 * @template TValue
 * @typedef {object} FieldValueChangedEventArgs
 * @property {keyof(TValue)} key
 * @property {any|null|undefined} oldValue
 * @property {any|null|undefined} newValue
 */

/**
 * @template TValue
 * @typedef {object} FieldsChangedEventArgs
 * @property {(keyof(TValue))[]} keys
 */

/**
 * @template TValue
 * @typedef {object} ValueChangedEventArgs
 * @property {TValue|null|undefined} oldValue
 * @property {TValue|null|undefined} newValue
 */

/** 
 * @template TEventArgs
 * @typedef {(args:TEventArgs) => void} EventHandler
 */

/** 
 * @template TEventArgs
 * @typedef {(args:TEventArgs) => void} EventTrigger
 */

/** 
 * Provides an event controller that can be used to trigger its controlled event.
 * @template TEventArgs
 * @implements {IDisposable}
 */
export class EventController {
   /** @type {boolean} */
   get isDisposed() { return this.#handlers.isDisposed; }
   /** @type {EventSubject<TEventArgs>} */
   get event() { return this.#event; }

   /** @typedef {import("./Disposable.js").IDisposable} IDisposable */
   
   /** @type {EventSubject<TEventArgs>} */
   #event;
   /** @type {EventHandlers<TEventArgs>} */
   #handlers = new EventHandlers();

   /**
    * Initializes a new {@link EventController} instance.
    */
   constructor() {
      this.#event = new EventSubject(this.#handlers);
   }

   /**
    * Triggers the {@link EventController.event} of the current instance.
    * @param {TEventArgs} args 
    * @throws {ObjectDisposedError}
    */
   trigger(args) {
      this.#handlers.trigger(args);
   }

   dispose() {
      return this.#handlers.dispose();
   }
}

/** 
 * Provides an event that can be subscribed to from the outside, but can only be triggered 
 * by its creator.
 * @template TEventArgs
 */
export class EventSubject {
   /** @type {boolean} */
   get isDisposed() { return this.#handlers.isDisposed; }
   /** @type {boolean} */
   get hasSubscribers() { return this.#handlers.hasSubscribers; }

   /** @type {EventHandlers<TEventArgs>} */
   #handlers = new EventHandlers();

   /**
    * Initializes a new {@link EventSubject} instance.
    * Should only be used by {@link EventController}.
    * @package
    * @param {EventHandlers} handlers 
    * @throws {ArgumentError}
    */
   constructor(handlers) {
      Assert.class(handlers, EventHandlers, "handlers");
      this.#handlers = handlers;
   }

   /**
    * @param {EventHandler<TEventArgs>} handler 
    * @throws {ArgumentError}
    * @throws {ObjectDisposedError}
    */
   subscribe(handler) {
      this.#handlers.add(handler);
   }

   /**
    * @param {EventHandler<TEventArgs>} handler 
    * @throws {ArgumentError}
    * @throws {ObjectDisposedError}
    */
   unsubscribe(handler) {
      this.#handlers.remove(handler);
   }
}

/**
 * @template TEventArgs
 */
class EventHandlers extends Disposable {
   /** 
    * Should be treated as immutable/read-only array to avoid unexpected behavior when
    * (un-)subscribing inside an event handler.
    * @type {EventHandler<TEventArgs>[]} 
    */
   #handlers = [];

   get hasSubscribers() { return this.#handlers.length > 0; }

   /**
    * @param {EventHandler<TEventArgs>} handler 
    * @throws {ArgumentError}
    * @throws {ObjectDisposedError}
    */
   add(handler) {
      Assert.function(handler, "handler");
      this.throwIfDisposed();

      let handlerIndex = this.#handlers.indexOf(handler);
      if (handlerIndex < 0) {
         this.#handlers = [...this.#handlers, handler];
      }
   }

   /**
    * @param {EventHandler<TEventArgs>} handler 
    * @throws {ArgumentError}
    * @throws {ObjectDisposedError}
    */
   remove(handler) {
      Assert.function(handler, "handler");
      this.throwIfDisposed();
      
      let handlerIndex = this.#handlers.indexOf(handler);
      if (handlerIndex >= 0) {
         this.#handlers = this.#handlers.slice(0, handlerIndex)
            .concat(this.#handlers.slice(handlerIndex + 1));
      }
   }

   /**
    * Triggers the {@link EventController.event} of the current instance.
    * @param {TEventArgs} args 
    * @throws {ObjectDisposedError}
    */
   trigger(args) {
      let handlers = this.#handlers;
      for (let i = 0; i < handlers.length; i++) {
         handlers[i](args);
      }
   }
   
   dispose() {
      if (!super.dispose()) {
         this.#handlers = [];
         return true;
      } else {
         return false;
      }
   }
}