/** @import * as Layout from './index.mjs' */

import ParseError from './ParseError.mjs';
const attrPattern = /^(?<decorator>[:@!+*\.?]|style:|样式：)?(?<name>-?[\w\p{Unified_Ideograph}_][-\w\p{Unified_Ideograph}_:\d\.]*)$/u;
const enhancementPattern = /^~(?<enhancement>[\w\p{Unified_Ideograph}_][-\w\p{Unified_Ideograph}_\d\.]*)(?:(?<decorator>[:@!])(?<name>-?[\w\p{Unified_Ideograph}_][-\w\p{Unified_Ideograph}_:\d\.]*))?$/u;
const nameRegex = /^(?<name>[a-zA-Z$\p{Unified_Ideograph}_][\da-zA-Z$\p{Unified_Ideograph}_]*)?$/u;

/**
 * 
 * @param {Record<string, Layout.Enhancement>} enhancements 
 * @param {string} name 
 */
function getEnhancement(enhancements, name) {
	const enhancement = enhancements[name];
	if (enhancement) { return enhancement; }
	/** @type {Layout.Enhancement} */
	const e = {
		attrs: Object.create(null),
		events: Object.create(null),
	};
	enhancements[name] = e;
	return e;
}

/**
 * @param {Layout.Node} node
 * @param {Exclude<Layout.Options['createCalc'], undefined>} createCalc
 * @param {Exclude<Layout.Options['createEvent'], undefined>} createEvent
 */
export default function createAttributeAdder(node, createCalc, createEvent) {
	const { attrs, events, classes, styles, vars, aliases, params, enhancements } = node;
	/**
	 * @param {string} qName
	 * @param {string} value
	 */
	function addAttribute(qName, value) {
		const qn = qName
		.replace(/．/g,'.')
		.replace(/：/g,':')
		.replace(/＠/g,'@')
		.replace(/＋/g,'+')
		.replace(/－/g,'-')
		.replace(/[＊×]/g,'*')
		.replace(/！/g, '!');
		const attr = (attrPattern.exec(qn) || enhancementPattern.exec(qn))?.groups;
		if (!attr) { throw new ParseError('ATTR', qName); }
		const { name, enhancement } = attr;
		const decorator = attr.decorator?.toLowerCase();
		if (enhancement) {
			if (decorator === ':') {
				getEnhancement(enhancements, enhancement).attrs[name] = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			} else if (decorator === '@') {
				getEnhancement(enhancements, enhancement).events[name] = nameRegex.test(value) ? {name: value} : {event: createEvent(value)};
			} else if (decorator === '!') {
				switch(name) {
					case 'bind':
						getEnhancement(enhancements, enhancement).bind = value || true;
						break;
				}
			} else {
				getEnhancement(enhancements, enhancement).value = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			}
			return;
		}
		if (!decorator) {
			attrs[name] = {value};
			return;
		}
		if (decorator === ':') {
			attrs[name] = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator === '.') {
			classes[name] = !value ? {value: true} : nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator === 'style:') {
			styles[name] = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator === '@') {
			events[name] = nameRegex.test(value) ? {name: value} : {event: createEvent(value)};
			return;
		}
		if (decorator === '+') {
			vars[name] = !value ? {null: true} : nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator === '*') {
			aliases[name] = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator === '?') {
			params[name] = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
			return;
		}
		if (decorator !== '!') {
			return;
		}
		const key = name.toString();
		switch (key) {
			case 'fragment': node.fragment = value || true; break;
			case 'else': node.else = true; break;
			case 'enum':
				node.enum = value ? nameRegex.test(value) ? {name: value} : {calc: createCalc(value)} : {null: true};
				break;
			case 'if':
				node.if = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
				break;
			case 'text':
				node.text = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
				break;
			case 'html':
				node.html = nameRegex.test(value) ? {name: value} : {calc: createCalc(value)};
				break;
			case 'template': node.template = value; break;
			case 'bind': node.bind = value || true; break;
			case 'value': node.value = value; break;
			case 'comment': node.comment = value; break;
		}
	}
	return addAttribute;
}
