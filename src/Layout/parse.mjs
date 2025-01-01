
/** @import * as Layout from './index.mjs' */
import entityMap from './entityMap.mjs';
import LayoutNode from './LayoutNode.mjs';

const tagNamePattern = /^(?<name>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_:]*)(?:|(?<is>[\w\p{Unified_Ideograph}_][-\.\|:|d\w\p{Unified_Ideograph}_]*))?$/u;
const attrPattern = /^(?<decorator>[:@!+*\.]|class:|类名?:|style:|样式：)?(?<name>-?[\w\p{Unified_Ideograph}_][-\w\p{Unified_Ideograph}_:\d\.]*)$/u;
const nameRegex = /^(?<name>[a-zA-Z$\p{Unified_Ideograph}_][\da-zA-Z$\p{Unified_Ideograph}_]*)?$/u;


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
 *
 * @param {string} source
 * @param {Layout.Options} [options]
 * @returns {(Layout.Node | string)[]}
 */
export default function parse(source, {
	creteCalc = () => { throw new Error('无 creteCalc 选项,不支持表达式解析') },
	creteEvent = () => { throw new Error('无 creteEvent 选项,不支持事件解析') },
	simpleTag = new Set,
} = {}) {
	/** @type {(LayoutNode | string)[]} */
	const list = [];

	const doc = { children: list };
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
	/**
	 * 
	 * @param {string} error 
	 */
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
	/**
	 * 
	 * @param {number} end 
	 */
	function appendText(end) {
		if (end > start) {
			const xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
			characters(xt);
			start = end;
		}
	}
	let closeMap = {};
	let start = 0;
	for (; ;) {
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
			/**
			 * 
			 * @param {string} c 
			 * @returns 
			 */
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
				for (; c <= ' ' || c === '\u0080'; c = source.charAt(++end)) { }
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
			current.children.push(currentNode);
			current = currentNode;
			const { attrs, directives, events, classes, styles, vars, aliases } = currentNode;
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
				if (!attr) { throw new Error('无效的属性:' + qName); }
				const { name } = attr;
				const decorator = attr.decorator?.toLowerCase();
				if (!decorator) {
					attrs[name] = value;
				} else if (decorator === ':') {
					attrs[name] = nameRegex.test(value) ? {name: value} : creteCalc(value);
				} else if (decorator === 'class:' || decorator === '.') {
					classes[name] = nameRegex.test(value) ? value : creteCalc(value);
				} else if (decorator === 'style:') {
					styles[name] = nameRegex.test(value) ? value : creteCalc(value);
				} else if (decorator === '@') {
					events[name] = nameRegex.test(value) ? value : creteEvent(value);
				} else if (decorator === '+') {
					vars[name] = nameRegex.test(value) ? value : creteCalc(value);
				} else if (decorator === '*') {
					aliases[name] = value;
				} else if (decorator === '!') {
					const key = name.toString();
					switch (key) {
						case 'fragment':
						case 'else':
						case 'enum':
							directives[key] = true;
							break;
						case 'if':
						case 'text':
						case 'html':
							directives[key] = nameRegex.test(value) ? value : creteCalc(value);
							break;
						case 'bind':
						case 'value':
							directives[key] = value;
							break;
					}
				}
			}
			let run = true;
			let closed = false;
			parseAttr: for (; run;) {
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
					case '': addAttribute(id, ''); error('意外的文件结束'); end++; break parseAttr;
					case '>': addAttribute(id, ''); end++; break parseAttr;
					case '/': addAttribute(id, ''); closed = true; break parseAttr;
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
					default: throw new Error("elements closed character '/' and '>' must be connected to");
				}
				endElement();
			} else if (simpleTag.has(name) || fixSelfClosed(source, end, name, closeMap)) {
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
