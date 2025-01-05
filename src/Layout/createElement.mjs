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
		directives: Object.create(null),
		classes: Object.create(null),
		styles: Object.create(null),
		vars: Object.create(null),
		aliases: Object.create(null),
		params: Object.create(null),
	};
}
