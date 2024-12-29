import { entityMap } from './entities.mjs';

const tagNamePattern = /^(?<name>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_:]*)(?:|(?<is>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_]*))?$/u;
const attrPattern = /^(?<decorator>:|@|!|class:|style:)?(?<name>[-\w\p{Unified_Ideograph}_][-\.\d\w\p{Unified_Ideograph}_:]*)$/u;
const namePattern = /^(?<name>[\w\p{Unified_Ideograph}_][\.\d\w\p{Unified_Ideograph}_]*)$/u;


const computedIdRegex = /^(?<name>[\w\p{Unified_Ideograph}_][\.\d\w\p{Unified_Ideograph}_]*)(?::(?:readonly|hidden|disabled))?$/u
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
 * 
 * @param {string} source 
 * @param {(t: string) => Function} creteExec
 * @param {(t: string) => Function} creteEvent
 * @returns {(LayoutNode | string)[]}
 */
function parse(
	source,
	creteExec = value => new Function('$event', 'env', value),
	creteEvent = value => new Function('$event', 'env', value),
) {
	/** @type {(LayoutNode | string)[]} */
	const list = []

	const doc = {
		/** @param {LayoutNode | string} newChild */
		add(newChild){ list.push(newChild); }
	}
	/** @type {(LayoutNode | null)[]} */
	const stack = [];
	/** @type {LayoutNode?} */
	let currentNode = null;
	/** @type {typeof doc | LayoutNode} */
	let current = doc;
	function endElement() {
		currentNode = stack.pop() || null;
		current = currentNode || doc;
	}
	function characters(chars) {
		chars = chars.replace(/^[\n\t]+|[\n\t]+$/g, '');
		if (!chars) { return; }
		current.add(chars);
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
			let name = source.substring(tagStart + 2, end);
			if (end < 0) {
				name = source.substring(tagStart + 2).replace(/[\s<].*/, '');
				error("end tag name: " + name + ' is not complete:' + currentNode?.name);
				end = tagStart + 1 + name.length;
			} else if (name.match(/\s</)) {
				name = name.replace(/[\s<].*/, '');
				error("end tag name: " + name + ' maybe not complete');
				end = tagStart + 1 + name.length;
			}
			if (currentNode) {
				const currentName = currentNode.name;
				if (currentName === name) {
					endElement();
				} else if (currentName.toLowerCase() == name.toLowerCase()) {
					endElement();
					throw new Error("end tag name: " + name + ' is not match the current start tagName:' + currentNode.name);
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
			const name = getId();
			const tagRes = tagNamePattern.exec(name)?.groups;
			if (!tagRes) { throw new Error('invalid tagName:' + name); }
			stack.push(currentNode);
			currentNode = new LayoutNode(tagRes.name, tagRes.is);
			current.add(currentNode);
			current = currentNode;
			const { attrs, directives, events, classes, styles } = currentNode;
			/**
			 * @param {string} qName
			 * @param {string} value
			 */
			function addAttribute(qName, value) {
				const attr = attrPattern.exec(qName)?.groups;
				if (!attr) { throw new Error('无效的属性:' + qName); }
				const {decorator, name} = attr;
				if (!decorator) {
					attrs[name] = value;
				} else if (decorator === ':') {
					attrs[name] = computedIdRegex.test(value) ? Symbol(value) : creteExec(value);
				} else if (decorator === 'class:') {
					classes[name] = computedIdRegex.test(value) ? value : creteExec(value);
				} else if (decorator === 'style:') {
					styles[name] = computedIdRegex.test(value) ? value : creteExec(value);
				} else if (decorator === '!') {
					directives[name] = computedIdRegex.test(value) ? value : creteExec(value);
				} else if (decorator === '@') {
					events[name] = namePattern.test(value) ? value : creteEvent(value);
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
					default:  throw new Error("elements closed character '/' and '>' must be connected to");
				}
				endElement();
			} else if (fixSelfClosed(source, end, name, closeMap)) {
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
/** @import { Directives, Layout } from './types.mjs' */
/**
 * @implements {Layout}
 */
export default class LayoutNode {
	/**
	 * 
	 * @param {string} source 
	 * @returns {(LayoutNode | string)[]}
	 */
	static parse(source) { return parse(source); }
	/**
	 * @param {string} name
	 * @param {string?} [is]
	 * 
	*/
	constructor(name, is) {
		this.name = name;
		this.is = is;
	}
	/**@type {Record<string, any>} */
	attrs = Object.create(null);
	/**@type {Record<string, any>} */
	events = Object.create(null);
	/**@type {Directives} */
	directives = Object.create(null);
	/** @type {(LayoutNode | string)[]} */
	children = [];
	/**@type {Record<string, any>} */
	classes = Object.create(null);
	/**@type {Record<string, any>} */
	styles = Object.create(null);
	/**
	 * 
	 * @param {LayoutNode | string} newChild 
	 * @returns 
	 */
	add(newChild){
		this.children.push(newChild);
		return newChild;
	}
	toString() {
		let node = this;
		const { name, is } = this;
		if (!name) {
			// return ["<!-- ",is," -->"].join('');
			return ''

		}
		var buf = [];
		
		buf.push('<',name);
		if (is) { buf.push('|', is) }
		
		for(const [name, value] of Object.entries(node.attrs)){
			buf.push(' ', name, '="', value.replace(/[<&"]/g,_xmlEncoder), '"');
		}
		
		const { children } = this;
		var child = children[0];
		
		if(child || !/^(?:meta|link|img|br|hr|input)$/i.test(name)){
			buf.push('>');
			for(const child of children){
				if (typeof child === 'string') {
					buf.push(child.replace(/[<&]/g,_xmlEncoder).replace(/]]>/g, ']]&gt;'));
				} else{ 
					buf.push(child.toString());
				}
			}
			buf.push('</',name,'>');
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
