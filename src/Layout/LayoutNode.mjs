
/** @import { Directives, Node } from './index.mjs' */

import { nodeToString } from './stringify.mjs';

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
	/**@type {Node['attrs']} */
	attrs = Object.create(null);
	/**@type {Node['events']} */
	events = Object.create(null);
	/**@type {Directives} */
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
	/** @param {number} [level]  @return {string} */
	toString(level) { return [
		...nodeToString(this, typeof level === 'number' && Math.floor(level) || 0)
	].join(''); }
	
}
