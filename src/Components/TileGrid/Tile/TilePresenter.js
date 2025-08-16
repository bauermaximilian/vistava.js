// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { Disposable } from "../../../Shared/Disposable.js";
import { EventController } from "../../../Shared/Event.js";
import { VU } from "../../../Utils/VectorUtils.js";
import { TileFocuses } from "../Shared/TileFocusType.js";
import { TileModel } from "./TileModel.js";

/**
 * @typedef {object} TileContentUpdatedEventArgs
 * @property {TilePresenter} tile
 */

export class TilePresenter extends Disposable {
   get contentSize() { return VU.clone(this.#contentSize); }
   set contentSize(value) {
      this.throwIfDisposed();
      
      if (value !== null) {
         Assert.vectorPositiveOrZero(value);
      }
      value = VU.clone(value);

      if ((value !== null && this.#contentSize !== null && !VU.equals(this.#contentSize, value)) ||
         value !== this.#contentSize) {
         this.#contentSize = value;
         this.#onContentUpdated.trigger({ tile: this });
      }
   }

   get contentError() { return this.#contentError; }
   set contentError(value) {
      this.throwIfDisposed();

      if (value !== null) {
         Assert.class(value, Error);
      }

      if (this.#contentError !== value) {
         this.#contentError = value;
         this.#onContentUpdated.trigger({ tile: this });
      }
   }

   get focus() { return this.#focus; }
   set focus(value) {
      this.throwIfDisposed();

      Assert.enumType(value, TileFocuses);
      let previousValue = this.#focus;
      if (value !== this.#focus) {
         this.#focus = value;
         this.#onFocusUpdated.trigger({ oldValue: previousValue, newValue: this.#focus });
      }
   }

   get model() { return this.#model; }

   get onContentUpdated() { return this.#onContentUpdated.event; }
   get onFocusUpdated() { return this.#onFocusUpdated.event; }

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
   /** 
    * @template TValue
    * @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<TValue>} ValueChangedEventArgs<TValue>
    */

   /** @type {TileModel} */
   #model;
   /** @type {Vector?} */
   #contentSize = null;
   /** @type {Error?} */
   #contentError = null;
   /** @type {import("../Shared/TileFocusType.js").TileFocus} */
   #focus = TileFocuses.none;
   
   /** @type {EventController<TileContentUpdatedEventArgs>} */
   #onContentUpdated = new EventController();
   /** @type {EventController<ValueChangedEventArgs<import("../Shared/TileFocusType.js").TileFocus>>} */
   #onFocusUpdated = new EventController();

   /**
    * @param {TileModel} model 
    * @throws {ArgumentError}
    */
   constructor(model) {
      super();
      Assert.class(model, TileModel, "model");
      this.#model = model;
   }

   dispose() {
      if (super.dispose()) {
         this.#onContentUpdated.dispose();
         this.#onFocusUpdated.dispose();
         return true;
      } else {
         return false;
      }
   }
}