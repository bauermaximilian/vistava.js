// SPDX-License-Identifier: GPL-3.0-or-later

import { AbstractMemberNotImplementedError } from "../../Errors/AbstractMemberNotImplementedError.js";

// HACK: During bundling, this module file gets imported in a node.js context to determine the 
// exported module names. In that context, HTMLElement doesn't exist and the bundler plugin would 
// crash there. For this reason, define the HTMLElementBase with an empty class in this case
// (as the actual functionality doesn't matter when just trying to get the names of the exports).
/** @type {typeof HTMLElement} */
let HTMLElementBase;
if (typeof(HTMLElement) !== "undefined") {
	HTMLElementBase = HTMLElement;
} else {
	//@ts-ignore
	HTMLElementBase = class { attachShadow(c) { return new ShadowRoot(); } }
}

/**
 * @abstract Must override static string getter {@link tagName}.
 * Provides closed {@link ShadowRoot} with protected getter {@link root}.
 * @example
 * const tagName = "my-view";
 * export class MyView extends ViewBase {
 * 	static get tagName() { return tagName; }
 * 	constructor() {
 * 		super();
 * 	}
 * }
 */
export class ViewBase extends HTMLElementBase {
	/** @type {string} */
	static get tagName() { throw new AbstractMemberNotImplementedError("tagName"); }
	
	/** @protected @type {ShadowRoot} */
	get root() { return this.#root; }
	
	/** @type {ShadowRoot} */
	#root;
	
	constructor(openShadowRoot = false) {
		super();
		
		this.#root = this.attachShadow({ mode: openShadowRoot ? "open" : "closed" });
	}
	
	/** @virtual The method base implementation in {@link ViewBase} is empty. */
	connectedCallback() {
	}
	
	/** @virtual The method base implementation in {@link ViewBase} is empty. */
	disconnectedCallback() {
	}
}