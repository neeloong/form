/** @import * as Layout from './index.mjs' */
import createAttributeAdder from './createAttributeAdder.mjs';
import createElement from './createElement.mjs';
import entityMap from './entityMap.mjs';
import ParseError from './ParseError.mjs';

const tagNamePattern = /^(?<name>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_:]*)(?:|(?<is>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_]*))?$/u;

/**
 * 
 * @param {string} c 
 * @returns 
 */
function isSpace(c) {
	return c === '0x80' || c <= ' ';
}
/**
 * 
 * @param {string} c 
 * @returns 
 */
function isIdCode(c) {
	return c !== '=' && c !== '/' && c !== '>' && c && c !== '\'' && c !== '"' && !isSpace(c);
}

/**
 * 
 * @param {string} source 
 * @param {number} elStartEnd 
 * @param {string} name 
 * @param {*} closeMap 
 * @returns 
 */
function fixSelfClosed(source, elStartEnd, name, closeMap) {
	let pos = closeMap[name];
	if (pos == null) {
		pos = source.lastIndexOf('</' + name + '>');
		if (pos < elStartEnd) {
			pos = source.lastIndexOf('</' + name);
		}
		closeMap[name] = pos;
	}
	return pos < elStartEnd;
}

/**
 * @param {ConstructorParameters<typeof ParseError>} p 
 */
function error(...p) {
	console.error(new ParseError(...p));
}

/**
 *
 * @param {string} a
 * @returns {string}
 */
function entityReplacer(a) {
	const k = a.slice(1, -1);
	if (k.charAt(0) === '#') {
		return String.fromCodePoint(parseInt(k.substring(1).replace('x', '0x')));
	}
	if (k in entityMap) { return entityMap[k]; }
	error('ENTITY', a);
	return a;
}
/**
 *
 * @param {string} source
 * @param {Layout.Options} [options]
 * @returns {(Layout.Node | string)[]}
 */
export default function parse(source, {
	createCalc = () => { throw new ParseError('CALC'); },
	createEvent = () => { throw new ParseError('EVENT'); },
	simpleTag = new Set,
} = {}) {
	/** @type {(Layout.Node | string)[]} */
	const children = [];

	const doc = { children };
	/** @type {(Layout.Node | null)[]} */
	const stack = [];
	/** @type {Layout.Node?} */
	let currentNode = null;
	/** @type {typeof doc | Layout.Node} */
	let current = doc;
	function endElement() {
		currentNode = stack.pop() || null;
		current = currentNode || doc;
	}
	/**
	 * 
	 * @param {string} chars 
	 * @returns 
	 */
	function characters(chars) {
		chars = chars.replace(/^\n|(?<=\n)\t+|\n\t*$/g, '');
		if (!chars) { return; }
		current.children.push(chars);
	}

	let closeMap = {};
	let index = 0;
	/**
	 * 
	 * @param {number} end 
	 */
	function appendText(end) {
		if (end <= index) { return; }
		const xt = source.substring(index, end).replace(/&#?\w+;/g, entityReplacer);
		characters(xt);
		index = end;
	}
	for (; ;) {
		const tagStart = source.indexOf('<', index);
		if (tagStart < 0) {
			const text = source.substring(index);
			if (!text.match(/^\s*$/)) {
				characters(text);
			}
			break;
		}
		if (tagStart > index) {
			appendText(tagStart);
		}
		const nextChar = source.charAt(tagStart + 1);
		if (nextChar === '!') {
			let begin = tagStart + 2;
			let sign = '>';
			if (source.slice(tagStart + 2, tagStart + 4) === '--') {
				begin += 4;
				sign = '-->'
			}
			index = source.indexOf(sign, begin);
			if (index < 0) { break; }
			index++;
			continue;
		}
		if (nextChar === '/') {
			index = source.indexOf('>', tagStart + 3);
			let name = source.substring(tagStart + 2, index);
			if (index < 0) {
				name = source.substring(tagStart + 2).replace(/[\s<].*/, '');
				error('UNCOMPLETED', name, currentNode?.name);
				index = tagStart + 1 + name.length;
			} else if (name.match(/\s</)) {
				name = name.replace(/[\s<].*/, '');
				error('UNCOMPLETED', name);
				index = tagStart + 1 + name.length;
			}
			if (currentNode) {
				const currentName = currentNode.name;
				if (currentName === name) {
					endElement();
				} else if (currentName.toLowerCase() == name.toLowerCase()) {
					endElement();
				} else {
					throw new ParseError('CLOSE', name, currentNode.name);
				}
			}
			index++;
			continue;
		}
		index = tagStart + 1;
		/**
		 * 
		 * @param {string} c 
		 * @returns 
		 */
		function getQuote(c) {
			let start = index + 1;
			index = source.indexOf(c, start);
			if (index < 0) { throw new ParseError('QUOTE', c); }
			const value = source.slice(start, index).replace(/&#?\w+;/g, entityReplacer);
			index++;
			return value;
		}
		function skipSpace() {
			let c = source.charAt(index);
			for (; c <= ' ' || c === '\u0080'; c = source.charAt(++index)) { }
			return c;

		}
		function getId() {
			let start = index;
			let c = source.charAt(index);
			while (isIdCode(c)) {
				index++;
				c = source.charAt(index);
			}
			return source.slice(start, index);
		}
		let c = source.charAt(index);
		switch (c) {
			case '=': throw new ParseError('EQUAL');
			case '"': case '\'': throw new ParseError('ATTR_VALUE');
			case '>': case '/': throw new ParseError('SYMBOL', c);
			case '': throw new ParseError('EOF');
		}
		const name = getId();
		const tagRes = tagNamePattern.exec(name)?.groups;
		if (!tagRes) { throw new ParseError('TAG', name); }
		stack.push(currentNode);
		currentNode = createElement(tagRes.name, tagRes.is);
		current.children.push(currentNode);
		current = currentNode;
		const addAttribute = createAttributeAdder(currentNode, createCalc, createEvent);

		let run = true;
		let closed = false;
		parseAttr: for (; run;) {
			let c = skipSpace();
			switch (c) {
				case '': error('EOF'); index++; break parseAttr;
				case '>': index++; break parseAttr;
				case '/': closed = true; break parseAttr;
				case '"': case '\'': throw new ParseError('ATTR_VALUE');
				case '=': throw new ParseError('SYMBOL', c);
			}
			const id = getId();
			if (!id) { error('EOF'); index++; break parseAttr; }
			c = skipSpace();
			switch (c) {
				case '': error('EOF'); index++; break parseAttr;
				case '>': addAttribute(id, ''); index++; break parseAttr;
				case '/': addAttribute(id, ''); closed = true; break parseAttr;
				case '=': index++; break;
				case '\'': case '"': addAttribute(id, getQuote(c)); continue;
				default: addAttribute(id, ''); continue;
			}
			c = skipSpace();
			switch (c) {
				case '': addAttribute(id, ''); error('EOF'); index++; break parseAttr;
				case '>': addAttribute(id, ''); index++; break parseAttr;
				case '/': addAttribute(id, ''); closed = true; break parseAttr;
				case '\'': case '"': addAttribute(id, getQuote(c)); continue;
			}
			addAttribute(id, getId());
		}
		if (closed) {
			while (true) {
				index++;
				const c = source.charAt(index);
				if (c === '/') { continue; }
				if (c <= ' ' || c === '\u0080') { continue; }
				break;
			}
			const c = source.charAt(index);
			switch (c) {
				case '=': throw new ParseError('EQUAL');
				case '"': case '\'': throw new ParseError('ATTR_VALUE'); // No known test case
				case '': error('EOF'); break;
				case '>': index++; break;
				default: throw new ParseError('CLOSE_SYMBOL');
			}
			endElement();
		} else if (simpleTag.has(name) || fixSelfClosed(source, index, name, closeMap)) {
			endElement();
		}
	}
	return children;
}
