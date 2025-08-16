# vistava.js

A JavaScript library for multimedia viewers with customizable layout configurations, infinite scrolling and extensive platform support. 

It was developed to be a flexible core component for multimedia viewers with a pleasant user experience - independently of the platform (desktop, mobile or VR) or the input scheme (mouse, keyboard, touch or gamepad). It supports image and video formats commonly used in the web.

## Technologies

vistava.js is entirely written in OOP-style modern JavaScript (ECMAScript 2024), using [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes) with [JSDoc annotations](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) to allow for type-checking (in supported IDEs like [VSCode](https://code.visualstudio.com/)). It was built with [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) using the [model-view-presenter pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter). It does not use any dependencies besides [rollup.js](https://rollupjs.org/) for bundling.

The "examples" directory contains various interactive tutorials on how the library works and can be used - after starting a local HTTP server in the project directory, you can navigate to that subfolder and the demos in your preferred web browser (or debug them in your preferred IDE).

## Build instructions

This library doesn't necessarily need to be built, transpiled or bundled. However, for easier development, a rollup.js configuration was included for creating a single file bundle (including all documentation, type annotations and definitions), from which any required classes can be imported your JavaScript (or TypeScript) project. 

This library doesn't have any other dependencies besides rollup.js - so it can either be installed globally (`npm install rollup -g`) or locally (using `npm install`). Afterwards, run `npm run build` to create the bundled library file in `bundle/vistava.js` (and its accompanying icon package `bundle/vistava.svg`).

As no minification or other optimisations to reduce the bundled file size are done here, it is recommended to minify the application including this library to speed up page loading times.

## License

Copyright (C) 2025 Maximilian Bauer.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.