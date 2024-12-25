import { entityMap } from './entities.js';

var tagNamePattern = /^(?<tagName>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_:]*)(?:|(?<is>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_]*))?$/u;
var attrPattern = /^(?<decorator>:|@|!)?(?<name>[\w\p{Unified_Ideograph}_][-\.\d\w\p{Unified_Ideograph}_:]*)$/u;

function isSpace(c) {
	return c === '0x80' || c <= ' ';
}
function isIdCode(c) {
	return c !== '=' && c !== '/' && c !== '>' && c && c !== '\'' && c !== '"' && !isSpace(c);
}

/**
 * 
 * @param {string} source 
 * @param {number} elStartEnd 
 * @param {string} tagName 
 * @param {*} closeMap 
 * @returns 
 */
function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
	let pos = closeMap[tagName];
	if (pos == null) {
		pos = source.lastIndexOf('</' + tagName + '>');
		if (pos < elStartEnd) {
			pos = source.lastIndexOf('</' + tagName);
		}
		closeMap[tagName] = pos;
	}
	return pos < elStartEnd;
}

/**
 * 
 * @param {string} source 
 * @returns {(Node | string)[]}
 */
function parse(source) {
	/** @type {(Node | string)[]} */
	const list = []

	const doc = {
		/** @param {Node | string} newChild */
		appendChild(newChild){ list.push(newChild); }
	}
	/** @type {(Node | null)[]} */
	const stack = [];
	/** @type {Node?} */
	let currentElement = null;
	/** @type {typeof doc | Node} */
	let current = doc;
	/**
	 * @param {string} tagName 
	 */
	function startElement(tagName) {
		const tagRes = tagNamePattern.exec(tagName)?.groups;
		if (!tagRes) { throw new Error('invalid tagName:' + tagName); }
		stack.push(currentElement);
		currentElement = new Node(tagRes.tagName, tagRes.is);
		current.appendChild(currentElement);
		current = currentElement;
		return currentElement;
	}
	function endElement() {
		currentElement = stack.pop() || null;
		current = currentElement || doc;
	}
	function characters(chars) {
		chars = chars.replace(/^[\n\t]+|[\n\t]+$/g, '');
		if (!chars) { return; }
		current.appendChild(chars);
	}

	function error(error) {
		console.error('[xmldom error]\t' + error);
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
		error('entity not found:' + a);
		return a;
	}
	function appendText(end) {
		if (end > start) {
			const xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
			characters(xt);
			start = end;
		}
	}
	let closeMap = {};
	let start = 0;
	for (;;) {
		let end = 0;
		let tagStart = source.indexOf('<', start);
		if (tagStart < 0) {
			const text = source.substring(start);
			if (!text.match(/^\s*$/)) {
				characters(text);
			}
			break;
		}
		if (tagStart > start) {
			appendText(tagStart);
		}
		if (source.charAt(tagStart + 1) === '/') {
			end = source.indexOf('>', tagStart + 3);
			let tagName = source.substring(tagStart + 2, end);
			if (end < 0) {
				tagName = source.substring(tagStart + 2).replace(/[\s<].*/, '');
				error("end tag name: " + tagName + ' is not complete:' + currentElement?.tagName);
				end = tagStart + 1 + tagName.length;
			} else if (tagName.match(/\s</)) {
				tagName = tagName.replace(/[\s<].*/, '');
				error("end tag name: " + tagName + ' maybe not complete');
				end = tagStart + 1 + tagName.length;
			}
			if (currentElement) {
				if (currentElement.tagName == tagName) {
					endElement();
				} else if (currentElement.tagName.toLowerCase() == tagName.toLowerCase()) {
					endElement();
					throw new Error("end tag name: " + tagName + ' is not match the current start tagName:' + currentElement.tagName);
				}
			}
			end++;
		} else {
			end = tagStart + 1;
			function getQu(c) {
				let start = end + 1;
				end = source.indexOf(c, start);
				if (end < 0) { throw new Error('attribute value no end \'' + c + '\' match'); }
				const value = source.slice(start, end).replace(/&#?\w+;/g, entityReplacer);
				end++;
				return value;
			}
			function skipSpace() {
				let c = source.charAt(end);
				for (;c <= ' ' || c === '\u0080';c = source.charAt(++end)) {}
				return c;

			}
			function getId() {
				let start = end;
				let c = source.charAt(end);
				while (isIdCode(c)) {
					end++;
					c = source.charAt(end);
				}
				return source.slice(start, end);
			}
			let c = source.charAt(end);
			switch (c) {
				case '=': throw new Error('attribute equal must after attrName');
				case '"': case '\'': throw new Error('attribute value must after "="');
				case '=': case '>': case '/': throw new Error(`意外的 "${c}"`);
				case '': throw new Error('意外的文件结束');
			}
			const tagName = getId();
			const { attributes, directives, events } = startElement(tagName);
			/**
			 * @param {string} qName
			 * @param {string} value
			 */
			function addAttribute(qName, value) {
				const attr = attrPattern.exec(qName)?.groups;
				if (!attr) { throw new Error('无效的属性:' + qName); }
				const {decorator, name} = attr;
				if (!decorator) {
					attributes[qName] = value;
				} else if (decorator === ':') {
					attributes[qName] = {value};
				} else if (decorator === '!') {
					directives[name] = value;
				} else if (decorator === '@') {
					events[name] = value;
				}
			}
			let run = true;
			let closed = false;
			parseAttr: for (;run;) {
				let c = skipSpace();
				switch (c) {
					case '': error('意外的文件结束'); end++; break parseAttr;
					case '>': end++; break parseAttr;
					case '/': closed = true; break parseAttr;
					case '"': case '\'': throw new Error('attribute value must after "="');
					case '=': throw new Error(`意外的 "${c}"`);
				}
				const id = getId();
				if (!id) { error('意外的文件结束'); end++; break parseAttr; }
				c = skipSpace();
				switch (c) {
					case '': error('意外的文件结束'); end++; break parseAttr;
					case '>': addAttribute(id, ''); end++; break parseAttr;
					case '/': addAttribute(id, ''); closed = true; break parseAttr;
					case '=': end++; break;
					case '\'': case '"': addAttribute(id, getQu(c)); continue;
					default: addAttribute(id, ''); continue;
				}
				c = skipSpace();
				switch (c) {
					case '': addAttribute(id, '');error('意外的文件结束'); end++; break parseAttr;
					case '>': addAttribute(id, '');end++; break parseAttr;
					case '/': addAttribute(id, '');closed = true; break parseAttr;
					case '\'': case '"': addAttribute(id, getQu(c)); continue;
				}
				addAttribute(id, getId());
			}
			if (closed) {
				while (true) {
					end++;
					const c = source.charAt(end);
					if (c === '/') { continue; }
					if (c <= ' ' || c === '\u0080') { continue; }
					break;
				}
				const c = source.charAt(end);
				switch (c) {
					case '=': throw new Error('attribute equal must after attrName');
					case '"': case '\'': throw new Error('attribute value must after "="'); // No known test case
					case '': error('意外的文件结束'); break;
					case '>': end++; break;
					default:  console.log(end, c, source.slice(end)); throw new Error("elements closed character '/' and '>' must be connected to");
				}
				endElement();
			} else if (fixSelfClosed(source, end, tagName, closeMap)) {
				endElement();
			}

		}
		if (end > start) {
			start = end;
		} else {
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(Math.max(tagStart, start) + 1);
		}
	}
	return list;
}
export default class Node {
	/**
	 * 
	 * @param {string} source 
	 * @returns {(Node | string)[]}
	 */
	static parse(source) {
		return parse(source);
		}
	/**
	 * @param {string | null} tagName
	 * @param {string?} [is]
	 * 
	*/
	constructor(tagName, is) {
		this.tagName = tagName;
		this.is = is;
	}
	/**@type {Record<string, any>} */
	attributes = Object.create(null);
	/**@type {Record<string, any>} */
	events = Object.create(null);
	/**@type {Record<string, any>} */
	directives = Object.create(null);
	/** @type {(Node | string)[]} */
	children = [];
	/**
	 * 
	 * @param {Node | string} newChild 
	 * @returns 
	 */
	appendChild(newChild){
		this.children.push(newChild);
		return newChild;
	}
	toString() {
		let node = this;
		const { tagName, is } = this;
		if (!tagName) {
			// return ["<!-- ",is," -->"].join('');
			return ''

		}
		var buf = [];
		
		buf.push('<',tagName);
		if (is) { buf.push('|', is) }
		
		for(const [name, value] of Object.entries(node.attributes)){
			buf.push(' ', name, '="', value.replace(/[<&"]/g,_xmlEncoder), '"');
		}
		
		const { children } = this;
		var child = children[0];
		
		if(child || !/^(?:meta|link|img|br|hr|input)$/i.test(tagName)){
			buf.push('>');
			for(const child of children){
				if (typeof child === 'string') {
					buf.push(child.replace(/[<&]/g,_xmlEncoder).replace(/]]>/g, ']]&gt;'));
				} else{ 
					buf.push(child.toString());
				}
			}
			buf.push('</',tagName,'>');
		}else{
			buf.push('/>');
		}
		return buf.join('');
	}
	
}

function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
		c == '>' && '&gt;' ||
		c == '&' && '&amp;' ||
		c == '"' && '&quot;' ||
		'&#'+c.charCodeAt()+';'
}
