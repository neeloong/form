
/** @import { Directives, Node } from './index.mjs' */

import toString from './toString.mjs';

/**
 * @implements {Node}
 */
export default class LayoutNode {
	/**
	 * @param {string} name
	 * @param {string?} [is]
	 * 
	*/
	constructor(name, is) {
		this.name = name;
		this.is = is;
	}
	simple = false;
	/**@type {Record<string, any>} */
	attrs = Object.create(null);
	/**@type {Record<string, any>} */
	events = Object.create(null);
	/**@type {Directives} */
	directives = Object.create(null);
	/** @type {(Node | string)[]} */
	children = [];
	/**@type {Record<string, any>} */
	classes = Object.create(null);
	/**@type {Record<string, any>} */
	styles = Object.create(null);
	/**@type {Record<string, any>} */
	vars = Object.create(null);
	/**@type {Record<string, any>} */
	aliases = Object.create(null);
	/** @return {string} */
	toString() { return toString(this) }
	
}
