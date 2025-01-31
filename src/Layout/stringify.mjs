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
function toValue({name, calc, event}) {
	return toAttrValue(name || calc || event);
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
 */
function *values(values, prefix) {
	if (prefix) {
		for (const [key, {name, calc, event}] of Object.entries(values)) {
			yield* [' ', prefix, key];
			if (!name || calc || event) { continue; }
			yield* ['="', String(name || calc || event).replace(/[<&"]/g, _xmlEncoder), '"'];
		}
		return;
	}
	for (const [key, attr] of Object.entries(values)) {
		if (!attr) { continue; }
		const {name, value, calc} = attr;
		if (name || calc || typeof value !== 'string') {
			yield* [' :', key, '="', toAttrValue(name || calc || value), '"'];
			continue;
		}
		yield* [' ', key];
		if (value) {
			yield* ['="', toAttrValue(value), '"'];
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
		yield* values(node.params, '?');
	}
	if (node.fragment) { yield node.fragment === true ? ` !fragment` : ` !fragment="${toAttrValue(node.fragment)}"`; }
	if (node.else) { yield ` !else`; }
	if (node.if) { yield ` !if="${toValue(node.if)}"`; }
	if (node.value) { yield ` !value="${toAttrValue(node.value)}"`; }
	if (node.enum) { yield node.enum.value === true ? ` !enum` : ` !enum="${toValue(node.enum)}"`; }
	yield* values(node.aliases, '*');
	yield* values(node.vars, '+');
	if (node.bind) { yield node.bind === true ? ` !bind` : ` !bind="${toAttrValue(node.bind)}"`; }
	yield* values(node.attrs);
	yield* values(node.events, '@');
	yield* values(node.classes, '.');
	yield* values(node.styles, 'style:');
	for (const [k, en] of Object.entries(node.enhancements)) {
		if (en.bind) { yield en.bind === true ? ` ~${k}!bind` : ` ~${k}!bind="${toAttrValue(en.bind)}"`; }
		if (en.value) { yield ` ~${k}="${toValue(en.value)}"`; }
		yield* values(en.attrs, `~${k}:`);
		yield* values(en.events, `~${k}@`);
	}
	if (node.text) { yield ` !text="${toValue(node.text)}"`; }
	if (node.html) { yield ` !html="${toValue(node.html)}"`; }
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
 * 
 * @param {Layout.Node | (Layout.Node |string)[]} value 
 * @param {boolean} [formable] 
 * @returns {string}
 */
export default function toString(value, formable) {
	const level = formable ? 0 : -1;
	if (Array.isArray(value)) { return [...listToString(value, level)].join(''); }
	return [nodeToString(value, level)].join();

}
