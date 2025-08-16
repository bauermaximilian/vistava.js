// SPDX-License-Identifier: GPL-3.0-or-later

import { removePrivateJsdocImports, getAllModules, copyAsset, removeMatches } from "./rollup.plugins.js";

export default [
	{
		input: `./src/**/*`,
		plugins: [
			removePrivateJsdocImports(),
			removeMatches(/^\/\/\sSPDX-License-Identifier:\s.*$\n*/gm),
			getAllModules(),
			copyAsset("./src/Components/GuiIcon/GuiIconResources.svg", "./bundle/vistava.svg")
		],
		output: {
			file: "./bundle/vistava.js",
			format: "es",
			intro: "/* SPDX-License-Identifier: GPL-3.0-or-later */\n/**\n * @file vistava.js is a multimedia viewer library, supporting flexible layouts and infinite scrolling.\n * @copyright Maximilian Bauer 2025\n */\n//@ts-check"
		},
		onwarn: warning => {
			if (warning.code !== 'CIRCULAR_DEPENDENCY') {
				console.warn(`(!) ${warning.message}`);
			}
		}
	}
]