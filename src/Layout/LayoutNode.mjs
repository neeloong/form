
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
	/**@type {Node['attrs']} */
	attrs = Object.create(null);
	/**@type {Node['events']} */
	events = Object.create(null);
	/**@type {Node['directives']} */
	directives = Object.create(null);
	/** @type {(Node | string)[]} */
	children = [];
	/**@type {Node['classes']} */
	classes = Object.create(null);
	/**@type {Node['styles']} */
	styles = Object.create(null);
	/**@type {Node['vars']} */
	vars = Object.create(null);
	/**@type {Node['aliases']} */
	aliases = Object.create(null);
	/** @return {string} */
	toString() { return toString(this) }
	
}
