/** @import * as Layout from './index.mjs' */

/**
 * 
 * @param {*} c 
 * @returns 
 */
function _xmlEncoder(c) {
	return c == '<' && '&lt;' ||
		c == '>' && '&gt;' ||
		c == '&' && '&amp;' ||
		c == '"' && '&quot;' ||
		'&#' + c.charCodeAt() + ';';
}

/**
 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Event | Layout.Node.Value} def 
 */
function toValue({name, calc, event, value}) {
	if (value === true || value === undefined) { return ''; }
	const val = typeof value === 'string' ? JSON.stringify(value) : name || calc || event || value;
		return `="${toAttrValue(val)}"`;
}
/**
 * @param {string | Function | null} [value] 
 */
function toAttrValue(value) {
	return String(value).replace(/[<&"]/g, _xmlEncoder);
}

/**
 * @param {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Event | Layout.Node.Value>} values
 * @param {string} [prefix]
 * @param {boolean | null} [isName]
 */
function *values(values, prefix, isName = false) {
	if (prefix) {
		for (const [key, {name, calc, event, value}] of Object.entries(values)) {
			yield ` ${prefix}${key}`;
			if (isName && name === key) { continue; }
			const val = value && typeof value === 'string' ? JSON.stringify(value) : name || calc || event || value;
			if (val == null) { continue; }
			if (isName === false && val === true) { continue; }
			yield `="${toAttrValue(val)}"`;
		}
		return;
	}
	for (const [key, attr] of Object.entries(values)) {
		if (!attr) { continue; }
		const {name, value, calc} = attr;
		if (name === key) { yield ` :${key}`; continue; }
		if (name || calc || typeof value !== 'string') {
			yield ` :${key}="${toAttrValue(name || calc || value)}"`;
			continue;
		}
		yield ` ${key}`;
		if (value) {
			yield `="${toAttrValue(value)}"`;
		}
	}
}


/**
 * 
 * @param {Layout.Node} node 
 * @param {number} [level] 
 * @returns {Iterable<string>}
 */
export function* nodeToString(node, level = 0) {
	const { children, is, name } = node;
	const pad = level > 0 ? ''.padEnd(level, '\t') : '';

	yield pad;
	yield* ['<', name || '-'];
	if (is) { yield* ['|', is]; }
	if (node.template) {
		yield ` !template="${toAttrValue(node.template)}"`;
		yield* values(node.params, '?', null);
	}
	if (node.fragment) { yield node.fragment === true ? ` !fragment` : ` !fragment="${toAttrValue(node.fragment)}"`; }
	if (node.else) { yield ` !else`; }
	if (node.if) { yield ` !if${toValue(node.if)}`; }
	if (node.value) { yield ` !value="${toAttrValue(node.value)}"`; }
	if (node.enum) { yield ` !enum${toValue(node.enum)}`; }
	for (const {variable, name, calc, value, init} of node.vars) {
		const prefix = init ? '+' : '*';
		yield ` ${prefix}${variable}`;
		/** @type {*} */
		const val = value && typeof value === 'string' ? JSON.stringify(value) : name || calc || value;
		if (val == null) { continue; }
		yield `="${toAttrValue(val)}"`;
	}
	if (node.bind) { yield node.bind === true ? ` !bind` : ` !bind="${toAttrValue(node.bind)}"`; }
	yield* values(node.attrs);
	yield* values(node.events, '@', true);
	yield* values(node.classes, '.', true);
	yield* values(node.styles, 'style:');
	for (const [k, en] of Object.entries(node.enhancements)) {
		if (en.bind) { yield en.bind === true ? ` ~${k}!bind` : ` ~${k}!bind="${toAttrValue(en.bind)}"`; }
		if (en.value) { yield ` ~${k}${toValue(en.value)}`; }
		yield* values(en.attrs, `~${k}:`, true);
		yield* values(en.events, `~${k}@`, true);
	}
	if (node.text) { yield ` !text${toValue(node.text)}`; }
	if (node.html) { yield ` !html${toValue(node.html)}`; }
	if (node.comment) { yield ` !comment="${toAttrValue(node.comment)}"`; }
	if (!children.length) {
		yield '/>';
		if (level >= 0) { yield '\n'; }
		return;
	}
	if (children.length === 1) {
		const [child] = children;
		if (typeof child === 'string' && child.length < 80 && !child.includes('\n')) {
			yield '>';
			yield* [child.replace(/[<&\t]/g, _xmlEncoder).replace(/]]>/g, ']]&gt;')];
			yield* ['</', name, '>'];
			if (level >= 0) { yield '\n'; }
			return;
		}
	}
	yield '>';
	if (level >= 0) { yield '\n'; }
	yield* listToString(children, level >= 0 ? level + 1 : -1);
	yield* [pad, '</', name, '>'];
	if (level >= 0) { yield '\n'; }

}
/**
 * 
 * @param {(Layout.Node |string)[]} nodes 
 * @param {number} [level] 
 * @returns {Iterable<string>}
 */
function* listToString(nodes, level = 0) {
	if (!nodes.length) { return ''; }

	const pad = level > 0 ? ''.padEnd(level, '\t') : '';
	for (const child of nodes) {
		if (typeof child === 'string') {
			let text = child.replace(/[<&\t]/g, _xmlEncoder).replace(/]]>/g, ']]&gt;');
			if (pad) {
				text = text.replace(/(?<=^|\n)/g, pad);
			}
			yield text;
			if (level >= 0) { yield '\n'; }
		} else {
			yield* nodeToString(child, level);
		}
	}
}
/**
 * 将模板转为字符串
 * @param {Layout.Node | (Layout.Node |string)[]} value 要转换的节点或节点数组
 * @param {boolean} [formable] 是否对代码进行格式化
 * @returns {string}
 */
export default function stringify(value, formable) {
	const level = formable ? 0 : -1;
	if (Array.isArray(value)) { return [...listToString(value, level)].join(''); }
	return [nodeToString(value, level)].join();

}
