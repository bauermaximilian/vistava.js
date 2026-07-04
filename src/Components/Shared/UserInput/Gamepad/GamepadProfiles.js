// SPDX-License-Identifier: GPL-3.0-or-later

import { GamepadProfile } from "./GamepadProfile.js";

export const GamepadProfiles = Object.freeze([
   new GamepadProfile(/xbox/i, p => {
      p.buttonActions.set("0", "confirm");//A
      p.buttonActions.set("1", "back");//B
      p.buttonActions.set("3", "zoom");//Y
      p.buttonActions.set("4", "zoomIn");//LB
      p.buttonActions.set("5", "zoomOut");//RB
      p.buttonActions.set("9", "contextMenu");//Menu button
      p.buttonActions.set("14", "left");//D-Pad
      p.buttonActions.set("15", "right");//D-Pad
      p.buttonActions.set("12", "up");//D-Pad
      p.buttonActions.set("13", "down");//D-Pad
      p.axisActions.set("0-", "left");//Stick L
      p.axisActions.set("0", "right");//Stick L
      p.axisActions.set("1-", "up");//Stick L
      p.axisActions.set("1", "down");//Stick L
      p.axisMoveHorizontal = 2;
      p.axisMoveVertical = 3;
      p.invertHorizontal = true;
      p.invertVertical = true;
   }),
   new GamepadProfile(/GameSir-G7 SE/, p => {
      p.buttonActions.set("0", "confirm");//A
      p.buttonActions.set("1", "back");//B
      p.buttonActions.set("3", "zoom");//Y
      p.buttonActions.set("4", "zoomIn");//LB
      p.buttonActions.set("5", "zoomOut");//RB
      p.buttonActions.set("9", "contextMenu");//Menu button
      p.axisActions.set("0-", "left");//Stick L
      p.axisActions.set("0", "right");//Stick L
      p.axisActions.set("1-", "up");//Stick L
      p.axisActions.set("1", "down");//Stick L
      p.axisActions.set("6-", "left");//D-Pad
      p.axisActions.set("6", "right");//D-Pad
      p.axisActions.set("7-", "up");//D-Pad
      p.axisActions.set("7", "down");//D-Pad
      p.axisMoveHorizontal = 3;
      p.axisMoveVertical = 4;
      p.invertHorizontal = true;
      p.invertVertical = true;
   }),
   new GamepadProfile(/joy-con\s*\(l\)/i, p => {
      p.buttonActions.set("3", "confirm");//ZL
      p.buttonActions.set("1", "back");//L
      p.buttonActions.set("0", "zoom");
      p.buttonActions.set("6", "zoom");//Analog Stick
      p.buttonActions.set("9", "left");//D-Pad
      p.buttonActions.set("10", "right");//D-Pad
      p.buttonActions.set("7", "up");//D-Pad
      p.buttonActions.set("8", "down");//D-Pad
      p.buttonActions.set("5", "fullscreen");
      p.axisMoveHorizontal = 0;
      p.axisMoveVertical = 1;
      p.invertHorizontal = true;
      p.invertVertical = true;
   }),
   new GamepadProfile(/joy-con\s*\(r\)/i, p => {
      p.buttonActions.set("0", "confirm");//B
      p.buttonActions.set("1", "back");//A
      p.buttonActions.set("2", "zoom");//Y
      p.buttonActions.set("9", "contextMenu");//X
      p.buttonActions.set("5", "zoomIn");//R
      p.buttonActions.set("7", "zoomOut");//ZR
      p.buttonActions.set("9", "fullscreen");//Plus
      p.buttonActions.set("11", "confirm");//Analog stick
      p.buttonActions.set("16", "back");//Home
      p.axisActions.set("2-", "left");//Analog stick
      p.axisActions.set("2", "right");//Analog stick
      p.axisActions.set("3-", "up");//Analog stick
      p.axisActions.set("3", "down");//Analog stick
      p.axisMoveHorizontal = 2;
      p.axisMoveVertical = 3;
      p.invertHorizontal = true;
      p.invertVertical = true;
      p.axisActivationTreshold = 0.2;
      p.axisActionTriggerTreshold = 0.65;
   }),
   new GamepadProfile(/8BitDo Micro gamepad/i, p => {
      p.axisActions.set("0-", "up");//D-Pad axis
      p.axisActions.set("0", "down");//D-Pad axis
      p.axisActions.set("1-", "right");//D-Pad axis
      p.axisActions.set("1", "left");//D-Pad axis
      p.buttonActions.set("0", "up");//A
      p.buttonActions.set("1", "right");//B
      p.buttonActions.set("3", "left");//X
      p.buttonActions.set("4", "down");//Y
      p.buttonActions.set("6", "confirm");//L1
      p.buttonActions.set("7", "confirm");//R1
      p.buttonActions.set("8", "back");//L2
      p.buttonActions.set("9", "back");//R2
      p.buttonActions.set("10", "zoom");//-
      p.buttonActions.set("11", "zoom");//+
      p.buttonActions.set("12", "fullscreen");//Select
   })
]);