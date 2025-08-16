// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../../../Shared/Assert.js";
import { ClassUtils } from "../../../Utils/ClassUtils.js";
import { ArgumentError } from "../../../Errors/ArgumentError.js";
import { InvalidOperationError } from "../../../Errors/InvalidOperationError.js";
import { GamepadInputManager } from "./Gamepad/GamepadInputManager.js";
import { KeyboardInputManager } from "./KeyboardInputManager.js";
import { MouseInputManager } from "./MouseInputManager.js";
import { TouchInputManager } from "./TouchInputManager.js";
import { InputEventsGroup } from "./InputEventsGroup.js";
import { InputEventsGroupController } from "./InputEventsGroupController.js";
import { ArrayUtils } from "../../../Utils/ArrayUtils.js";
import { InputDeviceTypes } from "./InputDeviceType.js";

/** @typedef {()=>void} TargetElementDetacher */

/**
 * @typedef {{
 *    targetType: ClassType<any>,
 *    priority: number
 * }} InputEventGroupDefinition
 */

export class InputManager {
   /** @type {KeyboardInputManager} */
   #keyboard = new KeyboardInputManager();
   /** @type {MouseInputManager} */
   #mouse = new MouseInputManager();
   /** @type {TouchInputManager} */
   #touch = new TouchInputManager();
   /** @type {GamepadInputManager} */
   #gamepad = new GamepadInputManager();

   /** @type {HTMLElement?} */
   #targetElement = null;

   /** @type {Map<ClassType<any>, InputEventsGroupController>} */
   #inputEventGroupsMap;
   /** @type {InputEventsGroupController[]} */
   #inputEventGroupsList;

   /** @template T @typedef {import("../../../Utils/ClassUtils.js").ClassType<T>} ClassType<T> */

   /** @typedef {import("../../../Utils/VectorUtils.js").Vector} Vector */

   /** @typedef {import("./InputEventsGroupController.js").MoveStartEventArgs} MoveStartEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").MoveEventArgs} MoveEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").MoveEndEventArgs} MoveEndEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ClickEventArgs} ClickEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").DoubleClickEventArgs} DoubleClickEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ClickSecondaryEventArgs} ClickSecondaryEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ScrollStartEventArgs} ScrollStartEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ScrollEventArgs} ScrollEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ScrollEndEventArgs} ScrollEndEventArgs */

   /** @typedef {import("./InputEventsGroupController.js").ActionEventArgs} ActionEventArgs */

   /** @type {boolean} */
   get isAttached() { return this.#targetElement !== null; }
   
   get keyboard() { return this.#keyboard; }
   get mouse() { return this.#mouse; }
   get touch() { return this.#touch; }
   get gamepad() { return this.#gamepad; }

   constructor() {
      this.#inputEventGroupsMap = new Map();
      this.#inputEventGroupsList = [];
   }

   /**
    * @param {ClassType<any>} targetClassType 
    * @param {number} priority 
    * @param {boolean} [throwOnExisting=false] 
    * @returns {InputEventsGroup}
    */
   registerInputEventGroup(targetClassType, priority, throwOnExisting = false) {
      Assert.classType(targetClassType, "targetClassType");
      Assert.number(priority, "priority");

      let controller = this.#inputEventGroupsMap.get(targetClassType);
      if (controller != null) {
         if (throwOnExisting) {
            throw new ArgumentError("A event group target type was defined more than once.");
         } else {
            return controller.events;
         }
      }

      controller = new InputEventsGroupController(targetClassType, priority, this);
      this.#inputEventGroupsMap.set(targetClassType, controller);
      this.#inputEventGroupsList.push(controller);

      this.#inputEventGroupsList.sort((a, b) => a.priority - b.priority);

      return controller.events;
   }

   /**
    * @param {ClassType<any>} targetClassType 
    * @returns {boolean}
    */
   unregisterInputEventGroup(targetClassType) {
      Assert.classType(targetClassType, "targetType");

      this.#inputEventGroupsMap.delete(targetClassType);
      return ArrayUtils.removeWhere(this.#inputEventGroupsList, 
         item => item.targetType === targetClassType) > 0;
   }

   /**
    * @param {ClassType<any>} targetClassType 
    * @returns {InputEventsGroup}
    * @throws {ArgumentError}
    * @throws {InvalidOperationError}
    */
   getInputEventGroup(targetClassType) {
      let eventsGroup = this.#inputEventGroupsMap.get(targetClassType)?.events;
      if (eventsGroup == null) {
         let targetTypeName = ClassUtils.getClassName(targetClassType);
         if (targetTypeName !== null) {
            throw new InvalidOperationError("No input events group for the target type " + 
               targetTypeName + " was available.");
         } else {
            throw new ArgumentError(`The specified target type is no valid class type.`);
         }
      } else {
         return eventsGroup;
      }
   }

   /**
    * @param {HTMLElement} targetElement 
    * @returns {TargetElementDetacher} A callback which - when executed - will both detach the 
    * current instance from the specified {@link targetElement} and allow this instance to be 
    * reattached to another {@link HTMLElement}.
    * @throws {InvalidOperationError} Is thrown when {@link isAttached} is true.
    */
   attach(targetElement) {
      if (this.isAttached) {
         throw new InvalidOperationError("The current instance is already attached to another " + 
            "HTML element.");
      }

      this.#targetElement = targetElement;

      let mouseDetacher = this.#mouse.attach(targetElement);
      this.#mouse.onClick.subscribe(this.#handleOnClick);
      this.#mouse.onDoubleClick.subscribe(this.#handleOnDoubleClick);
      this.#mouse.onRightClick.subscribe(this.#handleOnClickSecondary);
      this.#mouse.onDragStart.subscribe(this.#handleOnPointerDeviceMoveStart);
      this.#mouse.onDrag.subscribe(this.#handleOnMove);
      this.#mouse.onDragEnd.subscribe(this.#handleOnMoveEnd);
      this.#mouse.onWheelStart.subscribe(this.#handleOnScrollStart);
      this.#mouse.onWheel.subscribe(this.#handleOnScroll);
      this.#mouse.onWheelEnd.subscribe(this.#handleOnScrollEnd);

      let touchDetacher = this.#touch.attach(targetElement);
      this.#touch.onTap.subscribe(this.#handleOnClick);
      this.#touch.onDoubleTap.subscribe(this.#handleOnDoubleClick);
      this.#touch.onLongTap.subscribe(this.#handleOnClickSecondary);
      this.#touch.onDragStart.subscribe(this.#handleOnPointerDeviceMoveStart);
      this.#touch.onDrag.subscribe(this.#handleOnMove);
      this.#touch.onDragEnd.subscribe(this.#handleOnMoveEnd);
      this.#touch.onPinchStart.subscribe(this.#handleOnPointerDeviceScrollStart);
      this.#touch.onPinch.subscribe(this.#handleOnScroll);
      this.#touch.onPinchEnd.subscribe(this.#handleOnScrollEnd);

      let keyboardDetacher = this.#keyboard.attach(targetElement);
      this.#keyboard.onMoveStart.subscribe(this.#handleOnMoveStart);
      this.#keyboard.onMove.subscribe(this.#handleOnMove);
      this.#keyboard.onMoveEnd.subscribe(this.#handleOnMoveEnd);
      this.#keyboard.onKeyAction.subscribe(this.#handleOnAction);

      let gamepadDetacher = this.#gamepad.attach(targetElement);     
      this.#gamepad.onMoveStart.subscribe(this.#handleOnMoveStart);
      this.#gamepad.onMove.subscribe(this.#handleOnMove);
      this.#gamepad.onMoveEnd.subscribe(this.#handleOnMoveEnd);
      this.#gamepad.onScrollStart.subscribe(this.#handleOnScrollStart);
      this.#gamepad.onScroll.subscribe(this.#handleOnScroll);
      this.#gamepad.onScrollEnd.subscribe(this.#handleOnScrollEnd);
      this.#gamepad.onButtonAction.subscribe(this.#handleOnAction);
      this.#gamepad.onAxisAction.subscribe(this.#handleOnAction);

      return () => this.#detach(targetElement, keyboardDetacher, mouseDetacher, 
         touchDetacher, gamepadDetacher);
   }

   /**
    * @param {any} sender
    * @returns {import("./InputDeviceType.js").InputDevice}
    */
   #getInputDeviceTypeFromSender(sender) {
      if (sender instanceof GamepadInputManager) {
         return InputDeviceTypes.gamepad;
      } else if (sender instanceof KeyboardInputManager) {
         return InputDeviceTypes.keyboard;
      } else if (sender instanceof MouseInputManager) {
         return InputDeviceTypes.mouse;
      } else if (sender instanceof TouchInputManager) {
         return InputDeviceTypes.touch;
      } else {
         return InputDeviceTypes.unknown;
      }
   }

   /**
    * @param {{sender: any, position:Vector, initialOffset:Vector, target: EventTarget?}} args 
    */
   #handleOnPointerDeviceMoveStart = (args) => {
      for (let controller of this.#inputEventGroupsList) {
         /** @type {MoveStartEventArgs} */
         let groupArgs = { 
            ...args,  
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onMoveStart.trigger(groupArgs);
      }
   };

   /**
    * @param {{sender:any, initialOffset:Vector}} args 
    */
   #handleOnMoveStart = (args) => {      
      for (let controller of this.#inputEventGroupsList) {
         /** @type {MoveStartEventArgs} */
         let groupArgs = { 
            ...args, 
            position: null,
            target: null,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onMoveStart.trigger(groupArgs);
      }
   };
   
   /**
    * @param {{sender:any, offset:Vector, duration:number}} args 
    */
   #handleOnMove = (args) => { 
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {MoveEventArgs} */
         let groupArgs = { 
            ...args, 
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onMove.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction;
      }
   };
   
   /**
    * @param {{sender:any}} args
    */
   #handleOnMoveEnd = (args) => { 
      for (let controller of this.#inputEventGroupsList) {
         /** @type {MoveEndEventArgs} */
         let groupArgs = {
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onMoveEnd.trigger(groupArgs);
      }
   };
   
   /**
    * @param {{sender:any, position:Vector, target:EventTarget?}} args 
    */
   #handleOnClick = (args) => { 
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ClickEventArgs} */
         let groupArgs = { 
            ...args, 
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onClick.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction
      }
   };
   
   /**
    * @param {{sender:any, position:Vector, target:EventTarget?}} args 
    */
   #handleOnDoubleClick = (args) => {
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {DoubleClickEventArgs} */
         let groupArgs = { 
            ...args, 
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onDoubleClick.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction;
      }
   };

   /**
    * @param {{sender:any, position:Vector, target:EventTarget?}} args 
    */   
   #handleOnClickSecondary = (args) => { 
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ClickSecondaryEventArgs} */
         let groupArgs = {
            ...args,
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onClickSecondary.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction;
      }
   };
   
   /**
    * @param {{sender:any, target: EventTarget?}} args 
    */
   #handleOnPointerDeviceScrollStart = (args) => {
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ScrollStartEventArgs} */
         let groupArgs = { 
            ...args,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onScrollStart.trigger(groupArgs);
      }
   };

   /**
    * @param {{sender:any, target?:EventTarget?}} args
    */
   #handleOnScrollStart = (args) => {
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ScrollStartEventArgs} */
         let groupArgs = { 
            target: args.target ?? null,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onScrollStart.trigger(groupArgs);
      }
   };

   /**
    * @param {{sender:any, position:Vector, factor:number, smoothingHint:boolean, target?: EventTarget?}} args 
    */
   #handleOnScroll = (args) => {
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ScrollEventArgs} */
         let groupArgs = { 
            ...args, 
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender)
         };
         controller.onScroll.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction;
      }
   };
   
   /**
    * @param {{sender:any}} args 
    */   
   #handleOnScrollEnd = (args) => {
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ScrollEndEventArgs} */
         let groupArgs = {
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onScrollEnd.trigger(groupArgs);
      }
   };
   
   /**
    * @param {{sender:any, action:string}} args 
    */
   #handleOnAction = (args) => { 
      let noFurtherAction = false;
      for (let controller of this.#inputEventGroupsList) {
         /** @type {ActionEventArgs} */
         let groupArgs = { 
            ...args, 
            noFurtherAction: noFurtherAction,
            inputDeviceType: this.#getInputDeviceTypeFromSender(args.sender) 
         };
         controller.onAction.trigger(groupArgs);
         noFurtherAction = groupArgs.noFurtherAction;
      }
   };

   /**
    * @param {HTMLElement} targetElement 
    * @param {TargetElementDetacher} keyboardDetacher 
    * @param {TargetElementDetacher} mouseDetacher 
    * @param {TargetElementDetacher} touchDetacher 
    * @param {TargetElementDetacher} gamepadDetacher 
    */
   #detach = (targetElement, keyboardDetacher, mouseDetacher, touchDetacher, gamepadDetacher) => {
      mouseDetacher();
      this.#mouse.onClick.unsubscribe(this.#handleOnClick);
      this.#mouse.onDoubleClick.unsubscribe(this.#handleOnDoubleClick);
      this.#mouse.onRightClick.unsubscribe(this.#handleOnClickSecondary);
      this.#mouse.onDragStart.unsubscribe(this.#handleOnPointerDeviceMoveStart);
      this.#mouse.onDrag.unsubscribe(this.#handleOnMove);
      this.#mouse.onDragEnd.unsubscribe(this.#handleOnMoveEnd);
      this.#mouse.onWheelStart.subscribe(this.#handleOnScrollStart);
      this.#mouse.onWheel.subscribe(this.#handleOnScroll);
      this.#mouse.onWheelEnd.subscribe(this.#handleOnScrollEnd);

      touchDetacher();
      this.#touch.onTap.unsubscribe(this.#handleOnClick);
      this.#touch.onDoubleTap.unsubscribe(this.#handleOnDoubleClick);
      this.#touch.onLongTap.unsubscribe(this.#handleOnClickSecondary);
      this.#touch.onDragStart.unsubscribe(this.#handleOnPointerDeviceMoveStart);
      this.#touch.onDrag.unsubscribe(this.#handleOnMove);
      this.#touch.onDragEnd.unsubscribe(this.#handleOnMoveEnd);
      this.#touch.onPinchStart.unsubscribe(this.#handleOnPointerDeviceScrollStart);
      this.#touch.onPinch.unsubscribe(this.#handleOnScroll);
      this.#touch.onPinchEnd.unsubscribe(this.#handleOnScrollEnd);

      keyboardDetacher();
      this.#keyboard.onMoveStart.unsubscribe(this.#handleOnMoveStart);
      this.#keyboard.onMove.unsubscribe(this.#handleOnMove);
      this.#keyboard.onMoveEnd.unsubscribe(this.#handleOnMoveEnd);
      this.#keyboard.onKeyAction.unsubscribe(this.#handleOnAction);

      gamepadDetacher();
      this.#gamepad.onMoveStart.unsubscribe(this.#handleOnMoveStart);
      this.#gamepad.onMove.unsubscribe(this.#handleOnMove);
      this.#gamepad.onMoveEnd.unsubscribe(this.#handleOnMoveEnd);
      this.#gamepad.onScrollStart.unsubscribe(this.#handleOnScrollStart);
      this.#gamepad.onScroll.unsubscribe(this.#handleOnScroll);
      this.#gamepad.onScrollEnd.unsubscribe(this.#handleOnScrollEnd);
      this.#gamepad.onButtonAction.unsubscribe(this.#handleOnAction);
      this.#gamepad.onAxisAction.unsubscribe(this.#handleOnAction);
      
      if (this.#targetElement = targetElement) {
         this.#targetElement = null;
      }
   };
}