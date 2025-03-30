/** @import * as Layout from './index.mjs' */

import parseNumber from '../parseNumber.mjs';
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
 * 
 * @param {string} value 
 * @param {Exclude<Layout.Options['createCalc'], undefined>} createCalc 
 * @returns {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value}
 */
function parse(value, createCalc) {
	const text = value.replace(/$\s+|\s+$/gs,'');
	if (text === 'null') { return {value: null} }
	if (text === 'true') { return {value: true} }
	if (text === 'false') { return {value: false} }
	const t = parseNumber(text);
	if (!Number.isNaN(t)) { return {value: t}; }
	if (nameRegex.test(text)) { return {name: text} }
	return {calc: createCalc(value)};
}

/**
 * @param {Layout.Node} node
 * @param {Exclude<Layout.Options['createCalc'], undefined>} createCalc
 * @param {Exclude<Layout.Options['createInit'], undefined>} createInit
 * @param {Exclude<Layout.Options['createEvent'], undefined>} createEvent
 * @param {boolean} enableHTML
 */
export default function createAttributeAdder(node, createCalc, createInit, createEvent, enableHTML) {
	const { attrs, events, classes, styles, vars, params, enhancements } = node;
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
				getEnhancement(enhancements, enhancement).attrs[name] = value ? parse(value, createCalc) : {name};
			} else if (decorator === '@') {
				getEnhancement(enhancements, enhancement).events[name] = value ? nameRegex.test(value) ? {name: value} : {event: createEvent(value)} : {name};
			} else if (decorator === '!') {
				switch(name) {
					case 'bind':
						getEnhancement(enhancements, enhancement).bind = value || true;
						break;
				}
			} else {
				getEnhancement(enhancements, enhancement).value = parse(value, createCalc);
			}
			return;
		}
		if (!decorator) {
			attrs[name] = {value};
			return;
		}
		if (decorator === ':') {
			attrs[name] = value ? parse(value, createCalc) : {name};
			return;
		}
		if (decorator === '.') {
			classes[name] = value ? parse(value, createCalc) : {name}
			return;
		}
		if (decorator === 'style:') {
			styles[name] = parse(value, createCalc);
			return;
		}
		if (decorator === '@') {
			events[name] = value ? nameRegex.test(value) ? {name: value} : {event: createEvent(value)} : {name};
			return;
		}
		if (decorator === '+') {
			vars.push({...value ? parse(value, createInit) : {value: undefined}, variable: name, init: true});
			return;
		}
		if (decorator === '*') {
			vars.push({...parse(value, createCalc), variable: name, init: false });
			return;
		}
		if (decorator === '?') {
			params[name] = parse(value, createCalc);
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
				node.enum = value ? parse(value, createCalc) : {value: true};
				break;
			case 'if':
				node.if = parse(value, createCalc);
				break;
			case 'text':
				node.text = parse(value, createCalc);
				break;
			case 'html':
				if (enableHTML) { node.html = parse(value, createCalc); }
				break;
			case 'template': node.template = value; break;
			case 'bind': node.bind = value || true; break;
			case 'value': node.value = value; break;
			case 'comment': node.comment = value; break;
		}
	}
	return addAttribute;
}
