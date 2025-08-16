// SPDX-License-Identifier: GPL-3.0-or-later

import { Assert } from "../Shared/Assert.js";
import { ArgumentError } from "../Errors/ArgumentError.js";
import { ImplementationError } from "../Errors/ImplementationError.js";
import { InvalidOperationError } from "../Errors/InvalidOperationError.js";
import { NotSupportedError } from "../Errors/NotSupportedError.js";

const standardElementTypeTagNames = Object.freeze({
	HTMLAnchorElement: "a",
	//HTMLElement: "abbr",
	//HTMLSpanElement: "address",
	HTMLAreaElement: "area",
	//HTMLElement: "article",
	//HTMLElement: "aside",
	HTMLAudioElement: "audio",
	//HTMLElement: "b",
	HTMLBaseElement: "base",
	//HTMLElement: "bdi",
	//HTMLSpanElement: "bdo",
	//HTMLQuoteElement: "blockquote",
	HTMLBodyElement: "body",
	HTMLBRElement: "br",
	HTMLButtonElement: "button",
	HTMLCanvasElement: "canvas",
	HTMLTableCaptionElement: "caption",
	//HTMLSpanElement: "cite",
	//HTMLSpanElement: "code",
	HTMLTableColElement: "col",
	//HTMLTableColElement: "colgroup",
	HTMLDataElement: "data",
	HTMLDataListElement: "datalist",
	//HTMLElement: "dd",
	HTMLModElement: "del",
	HTMLDetailsElement: "details",
	//HTMLElement: "dfn",
	HTMLDialogElement: "dialog",
	HTMLDivElement: "div",
	HTMLDListElement: "dl",
	//HTMLSpanElement: "dt",
	//HTMLSpanElement: "em",
	HTMLEmbedElement: "embed",
	HTMLFieldSetElement: "fieldset",
	//HTMLElement: "figcaption",
	//HTMLElement: "figure",
	//HTMLElement: "footer",
	HTMLFormElement: "form",
	HTMLHeadingElement: "h1",
	HTMLHeadElement: "head",
	//HTMLElement: "header",
	//HTMLElement: "hgroup",
	HTMLHRElement: "hr",
	HTMLHtmlElement: "html",
	//HTMLElement: "i",
	HTMLIFrameElement: "iframe",
	HTMLImageElement: "img",
	HTMLInputElement: "input",
	//HTMLModElement: "ins",
	//HTMLElement: "kbd",
	HTMLLabelElement: "label",
	HTMLLegendElement: "legend",
	HTMLLIElement: "li",
	HTMLLinkElement: "link",
	//HTMLElement: "main",
	HTMLMapElement: "map",
	//HTMLElement: "mark",
	HTMLMenuElement: "menu",
	HTMLMetaElement: "meta",
	HTMLMeterElement: "meter",
	//HTMLElement: "nav",
	//HTMLElement: "noscript",
	HTMLObjectElement: "object",
	HTMLOListElement: "ol",
	HTMLOptGroupElement: "optgroup",
	HTMLOptionElement: "option",
	HTMLOutputElement: "output",
	HTMLParagraphElement: "p",
	HTMLPictureElement: "picture",
	HTMLPreElement: "pre",
	HTMLProgressElement: "progress",
	//HTMLQuoteElement: "q",
	//HTMLElement: "rp",
	//HTMLElement: "rt",
	//HTMLElement: "ruby",
	//HTMLElement: "s",
	//HTMLElement: "samp",
	HTMLScriptElement: "script",
	//HTMLElement: "search",
	//HTMLElement: "section",
	HTMLSelectElement: "select",
	HTMLSlotElement: "slot",
	//HTMLElement: "small",
	HTMLSourceElement: "source",
	HTMLSpanElement: "span",
	//HTMLElement: "strong",
	HTMLStyleElement: "style",
	//HTMLElement: "sub",
	//HTMLElement: "summary",
	//HTMLElement: "sup",
	HTMLTableElement: "table",
	//HTMLTableSectionElement: "tbody",
	//HTMLTableCellElement: "td",
	HTMLTemplateElement: "template",
	HTMLTextAreaElement: "textarea",
	//HTMLTableSectionElement: "tfoot",
	//HTMLTableCellElement: "th",
	//HTMLTableSectionElement: "thead",
	HTMLTimeElement: "time",
	HTMLTitleElement: "title",
	HTMLTableRowElement: "tr",
	HTMLTrackElement: "track",
	//HTMLElement: "u",
	HTMLUListElement: "ul",
	//HTMLElement: "var",
	HTMLVideoElement: "video",
	//HTMLElement: "wbr"
});

/**
 * @template T
 * @typedef {object} HTMLElementType
 * @prop {ClassType<T>} type
 * @prop {string} tagName
 */

/**
 * Provides common utility methods for browser-related tasks.
 */
export class BrowserUtils {
	/** @template T @typedef {import("./ClassUtils.js").ClassType<T>} ClassType<T> */

	/**
	 * @template {HTMLElement} [T=HTMLElement]
	 * @typedef {object} HTMLElementTypeProperties
	 * @property {string} tagName
	 * @property {ClassType<T>} elementConstructor
	 */

	/** @type {Map<any, HTMLElementTypeProperties>} */
	static #elementPropertiesCache = new Map();

	/**
	 * Gets a value specifying whether the current document is displayed full-screen (true) or not (false).
	 */
	static get isFullscreen() {
		return document.fullscreenElement != null;
	}

	/**
	 * Creates a new instance of a (registered) custom element for the current document.
	 * See the other overloads for instantiating common element instances.
	 * @template {HTMLElement} TClass The type of the custom element. 
	 * Must be defined before using {@link window.customElements.define}. 
	 * "Standard" element types (like {@link HTMLDivElement}) are not supported by this overload.
	 * @overload
	 * @param {ClassType<TClass>} elementType The class type (constructor) of the custom element. 
	 * Must be defined before using {@link window.customElements.define}. 
	 * "Standard" element types (like {@link HTMLDivElement}) are not supported by this overload.
	 * @param {((element:TClass, elementStyle:CSSStyleDeclaration)=>any)|null} [initializer] 
	 * A function which will be called once the new element was created and populated with all specified 
	 * {@link children}, before returning it. Optional.
	 * @param {...Array<(string|Element)>} children Any child elements that should be appended to the newly created 
	 * element, or strings that should be appended to the inner text of the element. Optional.
	 * @returns {TClass} A new HTMLElement instance of the specified {@link TClass} type.
	 * @throws {ArgumentError} Is thrown when the specified {@link TCLass} is no valid registered 
	 */
	/**
	 * Creates a new instance of a common element for the current document.
	 * See the other overloads for instantiating custom element instances.
	 * @template {keyof HTMLElementTagNameMap} TTag The name of the common element.
	 * @overload
	 * @param {TTag} elementType The name of the common element.
	 * @param {((element:HTMLElementTagNameMap[TTag], elementStyle:CSSStyleDeclaration)=>any)|null} [initializer] 
	 * A function which will be called once the new element was created and populated with all specified 
	 * {@link children}, before returning it. Optional.
	 * @param {...Array<(string|Element)>} children Any child elements that should be appended to the newly created 
	 * element, or strings that should be appended to the inner text of the element. Optional.
	 * @returns {HTMLElementTagNameMap[TTag]} A new HTMLElement instance of the specified {@link TTag} type.
	 */
	/**
	 * Creates a new instance of a common or (registered) custom element for the current document.
	 * @overload
	 * @param {string} elementType The name of the common or (registered) custom element.
	 * @param {((element:HTMLElement, elementStyle:CSSStyleDeclaration)=>any)|null} [initializer] 
	 * A function which will be called once the new element was created and populated with all specified 
	 * {@link children}, before returning it. Optional.
	 * @param {...Array<(string|Element)>} children Any child elements that should be appended to the newly created 
	 * element, or strings that should be appended to the inner text of the element. Optional.
	 * @returns {HTMLElement} A new HTMLElement instance.
	 */
	static createElement(elementType, initializer, ...children) {
		let elementTagName = null;
		if (typeof (elementType) === "string") {
			elementTagName = elementType;
		} else if (typeof (elementType) === "function" && elementType.prototype instanceof HTMLElement) {
			elementTagName = customElements.getName(elementType);
			if (elementTagName === null && "tagName" in elementType && typeof(elementType.tagName) === "string") {
				elementTagName = elementType.tagName;
				customElements.define(elementTagName, elementType);
			}
		}
		if (elementTagName == null) {
			throw new ArgumentError("The specified element type was neither a valid HTML tag name nor a " +
				"custom HTMLElement class with a static 'tagName' property.");
		}

		/** @type {HTMLElement|TClass|HTMLElementTagNameMap[TTag]} */
		let element = document.createElement(elementTagName);

		if (children != null) {
			for (let childElement of children) {
				if (childElement instanceof Element) {
					element.appendChild(childElement);
				} else {
					element.innerText += childElement?.toString() ?? "";
				}
			}
		}

		initializer?.(element, element.style);

		return element;
	}

	/**
	 * @template {HTMLElement} T
	 * @template {HTMLElement} TRequired
	 * @param {T?} currentElementValue 
	 * @param {ClassType<TRequired>|HTMLElementType<TRequired>} elementType 
	 * @param {Element|ShadowRoot|null} parentElement
	 * @param {((element:TRequired, elementStyle:CSSStyleDeclaration)=>void)?} [initializer=null]
	 * Initializes the element before inserting it into the DOM. Only executed when the element doesn't exist yet.
	 * @param {((element:TRequired, elementStyle:CSSStyleDeclaration)=>void)?} [updater=null]
	 * Updates the element (while already inside the DOM). Always executed, if provided.
	 * @param {((previousRemovedElement:T)=>void)?} [destructor=null] 
	 * @param {boolean} [prependOnCreate=false] 
	 * @returns {TRequired}
	 */
	static createOrUpdateElement(currentElementValue, elementType, parentElement, initializer = null,
		updater = null, destructor = null, prependOnCreate = false) {
		let elementTypeProperties = BrowserUtils.#getDefinedElementProperties(elementType);
		
		if (currentElementValue instanceof elementTypeProperties.elementConstructor) {
			//TODO: Ensure the parentElement matches with the currentElementValue.parentElement, adjust if necessary
			updater?.(currentElementValue, currentElementValue.style);
			return currentElementValue;
		} else {
			let newElement = document.createElement(elementTypeProperties.tagName);
			if (newElement instanceof elementTypeProperties.elementConstructor) {
				initializer?.(newElement, newElement.style);
			} else {
				throw new ImplementationError("The created element does not match with the expected type.");
			}

			if (parentElement !== null) {
				currentElementValue?.remove();
				if (prependOnCreate) {
					parentElement.prepend(newElement);
				} else {
					parentElement.append(newElement);
				}
			}
			
			if (currentElementValue != null) {
				destructor?.(currentElementValue);
			}

			updater?.(newElement, newElement.style);
			
			return newElement;
		}
	}

	/**
	 * Gets the session state of a specific class type.
	 * @param {ClassType<any>} senderType The class type for which the session state should be
	 * retrieved.
	 * @returns {object?} The session state object for the specified {@link senderType},
	 * or null.
	 * @throws {NotSupportedError} Is thrown when the browser doesn't support or allow using the 
	 * session storage.
	 * @throws {InvalidOperationError} Is thrown when the state for the specified class type is
	 * corrupted and must be manually cleared with {@link clearSessionState} before it can be 
	 * updated or retrieved.
	 */
	static getSessionState(senderType) {
		let stateKey = `state_${senderType.name}`;
		let stateString = null;
		try {
			stateString = sessionStorage.getItem(stateKey);
		} catch (sessionError) {
			throw new NotSupportedError("The session storage couldn't be accessed. " + 
				sessionError?.toString())
		}
		if (stateString !== null) {
			try {
				return JSON.parse(stateString) ?? null;
			} catch (parseError) {
				throw new InvalidOperationError("The session state for the class type " + 
					senderType.name + " is corrupted and can't be used. " + parseError?.toString());
			}
		} else {
			return null;
		}
	}

	/**
	 * Updates the session state of a specific class type.
	 * @param {ClassType<any>} senderType The class type for which the session state should be
	 * updated.
	 * @param {object} updateObject The object which should be used to update the current 
	 * session state object for the specified {@link senderType}.
	 * @returns {object} The updated session state object for the specified {@link senderType}.
	 * @throws {NotSupportedError} Is thrown when the browser doesn't support or allow using the 
	 * session storage.
	 * @throws {InvalidOperationError} Is thrown when the state for the specified class type is
	 * corrupted and must be manually cleared with {@link clearSessionState} before it can be 
	 * updated or retrieved.
	 */
	static setSessionState(senderType, updateObject) {
		let stateKey = `state_${senderType.name}`;
		let stateString = null;
		try {
			stateString = sessionStorage.getItem(stateKey);
		} catch (sessionError) {
			throw new NotSupportedError("The session storage couldn't be accessed. " + 
				sessionError?.toString())
		}

		let stateObject;
		if (stateString !== null) {
			try {
				stateObject = JSON.parse(stateString) ?? null;
			} catch (parseError) {
				throw new InvalidOperationError("The session state for the class type " + 
					senderType.name + " is corrupted and can't be used. " + parseError?.toString());
			}
		} else {
			stateObject = {};
		}

		stateObject = {
			...stateObject,
			...updateObject
		};

		try {
			stateString = JSON.stringify(stateObject);
			sessionStorage.setItem(stateKey, stateString);
		} catch (saveError) {
			throw new NotSupportedError("The session state couldn't be updated. " + 
				saveError?.toString());
		}

		return stateObject;
	}

	/**
	 * Clears the session state of a specific class type.
	 * @param {ClassType<any>} senderType The class type for which the session state should be
	 * cleared.
	 * @throws {NotSupportedError} Is thrown when the browser doesn't support or allow using the 
	 * session storage.
	 */
	static clearSessionState(senderType) {
		let stateKey = `state_${senderType.name}`;

		try {
			sessionStorage.removeItem(stateKey);
		} catch (sessionError) {
			throw new NotSupportedError("The session storage couldn't be accessed. " + 
				sessionError?.toString())
		}
	}

	static toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	/**
	 * @param {()=>void} handler 
	 */
	static subscribeToFullscreenChange(handler) {
		document.documentElement.addEventListener("fullscreenchange", handler);
	}

	/**
	 * @param {()=>void} handler 
	 */
	static unsubscribeFromFullscreenChange(handler) {
		document.documentElement.removeEventListener("fullscreenchange", handler);   
	}

	/**
	 * @param {EventTarget|null|undefined} eventTarget 
	 * @param {Element|null|undefined} parentElement 
	 * @param {number} depthSearchLimit
	 */
	static isChild(eventTarget, parentElement, depthSearchLimit = 50) {
		Assert.numberPositive(depthSearchLimit, "depthSearchLimit");

		if (eventTarget == null || parentElement == null || !(eventTarget instanceof Element)) {
			return false;
		} else {
			/** @type {HTMLElement|Element|null} */
			let element = eventTarget;
			for (let i = 0; i < depthSearchLimit; i++) {
				if (element === parentElement) {
					return true;
				} else if (element == null) {
					break;
				}
				element = element.parentElement;
			}
			return false;
		}
	}
	
	/**
	 * @param {HTMLElement?} element 
	 * @param {import("./VectorUtils.js").Vector} position 
	 */
	static isInside(element, position) {
		let elementBounds = element?.getBoundingClientRect();
		if (elementBounds != null) {
			return (position.x >= elementBounds.left && position.x <= elementBounds.right) &&
				(position.y >= elementBounds.top && position.y <= elementBounds.bottom);
		} else {
			return false;
		}
	}

	/**
	 * 
	 * @param {HTMLElement?} element 
	 * @param {import("./VectorUtils.js").Vector} position 
	 * @returns {{x:number, y:number}}
	 */
	static getInsideRatio(element, position) {
		let elementBounds = element?.getBoundingClientRect();
		if (elementBounds != null) {
			return {
				x: (position.x - elementBounds.left) / elementBounds.width,
				y: (position.y - elementBounds.top) / elementBounds.height
			}
		} else {
			return { x: 0, y: 0 };
		}
	}

	/**
	 * Executes a callback either when the page was loaded completely or, when the page is already
	 * loaded, the callback is executed immediately.
	 * @param {()=>void} callback 
	 */
	static executeWhenDocumentReady(callback) {
		if (document.body?.isConnected === true) {
			callback();
		} else {
			document.addEventListener("DOMContentLoaded", callback, { once: true });
		}
	}

	/**
	 * @param {HTMLElement} element 
	 * @param {string} attributeName 
	 */
	static hasAttribute(element, attributeName) {
		return element.getAttribute(attributeName) != null;
	}

	/**
	 * @param {HTMLElement} element 
	 * @param {string} attributeName
	 * @param {boolean} shouldHaveAttribute  
	 */
	static setHasAttribute(element, attributeName, shouldHaveAttribute) {
		if (element.getAttribute(attributeName) != null && !shouldHaveAttribute) {
			element.removeAttribute(attributeName);
		} else if (element.getAttribute(attributeName) == null && shouldHaveAttribute) {
			element.setAttribute(attributeName, "");
		}
	}

	/**
	 * @template {HTMLElement} TRequired
	 * @param {ClassType<TRequired>|HTMLElementType<TRequired>} elementType 
	 * @param {boolean} [ignoreCache = false]
	 * @returns {HTMLElementTypeProperties<TRequired>}
	 */
	static #getDefinedElementProperties(elementType, ignoreCache = false) {
		if (!ignoreCache) {
			let cachedProperties = BrowserUtils.#elementPropertiesCache.get(elementType);
			if (cachedProperties != null) {
				//@ts-ignore
				return cachedProperties;
			}
		}

		/** @type {ClassType<TRequired>} */
		let elementTypeConstructor;
		/** @type {string?} */
		let elementTypeTagName;

		if (typeof (elementType) === "function" && elementType.prototype instanceof HTMLElement) {         
			elementTypeConstructor = elementType;
			elementTypeTagName = standardElementTypeTagNames[elementType.name] ?? null;
			if (elementTypeTagName === null) {
				elementTypeTagName = customElements.getName(elementTypeConstructor);
				if (elementTypeTagName === null) {
					if ("tagName" in elementTypeConstructor && typeof (elementTypeConstructor.tagName) === "string") {
						elementTypeTagName = elementTypeConstructor.tagName;
						customElements.define(elementTypeTagName, elementTypeConstructor);
					} else {
						throw new ArgumentError("The specified elementType could neither be resolved into a default HTML " +
							"element nor was it a custom HTMLElement with a static 'tagName' property and must be specified " +
							"as HTMLElementType instead.");
					}
				} 
			}
		} else if ("type" in elementType && typeof (elementType.type) === "function" &&
			elementType.type.prototype instanceof HTMLElement) {
			elementTypeConstructor = elementType.type;
			elementTypeTagName = elementType.tagName;
		} else {
			throw new ArgumentError("The specified elementType is neither a valid HTMLElement nor " +
				"a valid HTMLElementType object (with 'type' and 'tagName' fields).");
		}

		let cachedProperties = {
			elementConstructor: elementTypeConstructor,
			tagName: elementTypeTagName
		};
		Object.freeze(cachedProperties);

		if (!ignoreCache) {
			this.#elementPropertiesCache.set(elementTypeTagName, cachedProperties);
			this.#elementPropertiesCache.set(elementTypeConstructor, cachedProperties);
		}

		return cachedProperties;
	}
}

/**
 * Creates a new instance of a common or (registered) custom element for the current document.
 * This is an alias for the {@link BrowserUtils.createElement} method.
 */
export const e = BrowserUtils.createElement;

export const c = BrowserUtils.createElement;
export const cu = BrowserUtils.createOrUpdateElement;

export { BrowserUtils as BU }