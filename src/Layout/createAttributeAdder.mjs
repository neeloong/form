/** @import * as Layout from './index.mjs' */

import ParseError from './ParseError.mjs';
const attrPattern = /^(?<decorator>[:@!+*\.?]|style:|样式：)?(?<name>-?[\w\p{Unified_Ideograph}_][-\w\p{Unified_Ideograph}_:\d\.]*)$/u;
const nameRegex = /^(?<name>[a-zA-Z$\p{Unified_Ideograph}_][\da-zA-Z$\p{Unified_Ideograph}_]*)?$/u;
/**
 * @param {Layout.Node} node
 * @param {Exclude<Layout.Options['createCalc'], undefined>} createCalc
 * @param {Exclude<Layout.Options['createEvent'], undefined>} createEvent
 */
export default function createAttributeAdder(node, createCalc, createEvent) {
	const { attrs, directives, events, classes, styles, vars, aliases, params } = node;
	/**
	 * @param {string} qName
	 * @param {string} value
	 */
	function addAttribute(qName, value) {
		const attr = attrPattern.exec(qName
			.replace(/．/g,'.')
			.replace(/：/g,':')
			.replace(/＠/g,'@')
			.replace(/＋/g,'+')
			.replace(/－/g,'-')
			.replace(/[＊×]/g,'*')
			.replace(/！/g, '!'))?.groups;
		if (!attr) { throw new ParseError('ATTR', qName); }
		const { name } = attr;
		const decorator = attr.decorator?.toLowerCase();
		if (!decorator) {
			attrs[name] = value;
		} else if (decorator === ':') {
			attrs[name] = nameRegex.test(value) ? {name: value} : createCalc(value);
		} else if (decorator === '.') {
			classes[name] = !value ? true : nameRegex.test(value) ? value : createCalc(value);
		} else if (decorator === 'style:') {
			styles[name] = nameRegex.test(value) ? value : createCalc(value);
		} else if (decorator === '@') {
			events[name] = nameRegex.test(value) ? value : createEvent(value);
		} else if (decorator === '+') {
			vars[name] = !value ? '' : nameRegex.test(value) ? value : createCalc(value);
		} else if (decorator === '*') {
			aliases[name] = nameRegex.test(value) ? value : createCalc(value);
		} else if (decorator === '?') {
			params[name] = nameRegex.test(value) ? value : createCalc(value);
		} else if (decorator === '!') {
			const key = name.toString();
			switch (key) {
				case 'fragment': directives.fragment = value || true; break;
				case 'else': directives.else = true; break;
				case 'enum':
					directives.enum = value ? nameRegex.test(value) ? value : createCalc(value) : true;
					break;
				case 'if':
				case 'text':
				case 'html':
					directives[key] = nameRegex.test(value) ? value : createCalc(value);
					break;
				case 'template':
				case 'bind':
				case 'value':
				case 'comment':
					directives[key] = value;
					break;
			}
		}
	}
	return addAttribute;
}
