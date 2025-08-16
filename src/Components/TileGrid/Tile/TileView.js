// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../../../Errors/AbstractMemberNotImplementedError.js";
import { EventController } from "../../../Shared/Event.js";
import { InteractivePresenterView } from "../../Shared/InteractivePresenterView.js";
import { TilePresenter } from "./TilePresenter.js";

/**
 * @typedef {object} TileViewContentUpdatedEventArgs
 * @property {boolean} hasContentSize
 * @property {boolean} hasError
 */

/** 
 * Renders the actual tile (including content). Does not "decide" about its visibility/position,
 * that's the grid's responsibility. It just renders, loads, and then tells the presenter about its
 * "natural" size or any error that occurred.
 * @abstract
 * @template {HTMLElement} [TMedia=HTMLElement]
 * @extends {InteractivePresenterView<TilePresenter>} 
 */
export class TileView extends InteractivePresenterView {
   /** @abstract @type {TMedia?} */
   get mediaContent() { throw new AbstractMemberNotImplementedError(); }

   get onMediaContentUpdated() { return this.#onMediaContentUpdated.event; }

   get inputEventsGroupTargetType() { return TileView; }

   /**
    * @template {any} TEventArgs
    * @typedef {import("../../../Shared/Event.js").EventHandler<TEventArgs>} EventHandler<TEventArgs>
    */
   /** @template T @typedef {import("../../../Shared/Event.js").ValueChangedEventArgs<T>} ValueChangedEventArgs<T>*/
   /** @template T @typedef {import("../../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @type {EventController<void>} */
   #onMediaContentUpdated = new EventController();

   /**
    * @param {ClassType<HTMLElement>} [inputEventsGroupTargetType] Gets the type which is used to retrieve the 
    * correct {@link inputEventsGroup} from the assigned {@link inputManager}. If unspecified, the class
    * type of the current (derived) class is used.
    * @param {boolean} [openShadowRoot=false] 
    */
   constructor(inputEventsGroupTargetType, openShadowRoot = false) {
      super(TilePresenter, inputEventsGroupTargetType ?? TileView, openShadowRoot);

      this.onPresenterChanged.subscribe(this.#handleOnPresenterChanged);
   }

   /** @type {EventHandler<ValueChangedEventArgs<TilePresenter>>} */
   #handleOnPresenterChanged = (args) => {
      args.oldValue?.onContentUpdated.unsubscribe(this.#handleOnContentUpdated);
      args.newValue?.onContentUpdated.subscribe(this.#handleOnContentUpdated);
   };

   /** @type {EventHandler<import("./TilePresenter.js").TileContentUpdatedEventArgs>} */
   #handleOnContentUpdated = () => {
      if (this.presenter === null) { return; }
      this.#onMediaContentUpdated.trigger();
   };
}