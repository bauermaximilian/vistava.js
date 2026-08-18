// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { EventController } from "../../../Shared/Event.js";
import { InputEventsGroup } from "./InputEventsGroup.js";
import { InputManager } from "./InputManager.js";

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    initialOffset:Vector, 
*    position:Vector?, 
*    target:EventTarget?
* }} MoveStartEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    offset:Vector, 
*    duration:number,
*    noFurtherAction:boolean
* }} MoveEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice
* }} MoveEndEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,  
*    position:Vector, 
*    target:EventTarget?,
*    noFurtherAction:boolean
* }} ClickEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    position:Vector, 
*    target:EventTarget?,
*    noFurtherAction:boolean
* }} DoubleClickEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    position:Vector, 
*    target:EventTarget?,
*    noFurtherAction:boolean
* }} ClickSecondaryEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    position:Vector, 
*    target:EventTarget?,
*    noFurtherAction:boolean
* }} ClickTertiaryEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    target:EventTarget?
* }} ScrollStartEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,
*    position:Vector, 
*    factor:number,
*    smoothingHint:boolean,
*    noFurtherAction:boolean
* }} ScrollEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice
* }} ScrollEndEventArgs
*/

/**
* @typedef {{
*    inputDeviceType:InputDevice,  
*    action:string,
*    noFurtherAction:boolean
* }} ActionEventArgs
*/

export class InputEventsGroupController {
  /** @type {EventController<MoveStartEventArgs>} */
  #onMoveStart = new EventController();
  /** @type {EventController<MoveEventArgs>} */
  #onMove = new EventController();
  /** @type {EventController<MoveEndEventArgs>} */
  #onMoveEnd = new EventController();
  /** @type {EventController<ClickEventArgs>} */
  #onClick = new EventController();
  /** @type {EventController<DoubleClickEventArgs>} */
  #onDoubleClick = new EventController();
  /** @type {EventController<ClickSecondaryEventArgs>} */
  #onClickSecondary = new EventController();
  /** @type {EventController<ClickTertiaryEventArgs>} */
  #onClickTertiary = new EventController();
  /** @type {EventController<ScrollStartEventArgs>} */
  #onScrollStart = new EventController();
  /** @type {EventController<ScrollEventArgs>} */
  #onScroll = new EventController();
  /** @type {EventController<ScrollEndEventArgs>} */
  #onScrollEnd = new EventController();
  /** @type {EventController<ActionEventArgs>} */   
  #onAction = new EventController();

  /** @type {InputManager} */
  #inputManager;
  /** @type {ClassType<any>} */
  #targetType;
  /** @type {number} */
  #priority;

  /** @type {InputEventsGroup} */
  #events;

  /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */
  /** @typedef {import("./InputDeviceType.js").InputDevice} InputDevice */
  /** @template T @typedef {import("../../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

  get onMoveStart() { return this.#onMoveStart; }
  get onMove() { return this.#onMove; }
  get onMoveEnd() { return this.#onMoveEnd; }
  get onClick() { return this.#onClick; }
  get onDoubleClick() { return this.#onDoubleClick; }
  get onClickSecondary() { return this.#onClickSecondary; }
  get onClickTertiary() { return this.#onClickTertiary; }
  get onScrollStart() { return this.#onScrollStart; }
  get onScroll() { return this.#onScroll; }
  get onScrollEnd() { return this.#onScrollEnd; }   
  get onAction() { return this.#onAction; }

  get inputManager() { return this.#inputManager; }
  get targetType() { return this.#targetType; }
  get events() { return this.#events; }
  get priority() { return this.#priority; }

  /**
   * @param {ClassType<any>} targetType 
   * @param {number} priority
   * @param {InputManager} inputManager
   */
  constructor(targetType, priority, inputManager) {
     Assert.classType(targetType, "targetType");
     this.#targetType = targetType;

     Assert.number(priority, "priority");
     this.#priority = priority;

     Assert.class(inputManager, InputManager, "inputManager");
     this.#inputManager = inputManager;

     this.#events = new InputEventsGroup(this);
  }
}