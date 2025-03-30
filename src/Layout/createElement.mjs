/** @import * as Layout from './index.mjs' */

/**
 * @param {string} name
 * @param {string?} [is]
 * @returns {Layout.Node}
 * 
 */
export default function createElement(name, is) {
	return {
		name,
		is,
		children: [],
		attrs: Object.create(null),
		events: Object.create(null),
		classes: Object.create(null),
		styles: Object.create(null),
		vars: [],
		params: Object.create(null),
		enhancements: Object.create(null),
	};
}
