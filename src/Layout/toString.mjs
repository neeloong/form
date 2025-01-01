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
 * 
 * @param {Layout.Node} node 
 * @param {number} [level] 
 * @returns {Iterable<string>}
 */
export function* nodeToString(node, level = 0) {
	const { attrs, events, directives, children, is, name, classes, styles, aliases, vars } = node;
	const pad = ''.padEnd(level, '\t');

	yield pad;
	yield* ['<', name || '-'];
	if (is) { yield* ['|', is]; }

	for (const [name, value] of Object.entries(directives)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			yield* [' !', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(aliases)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			yield* [' *', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(vars)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			yield* [' +', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(attrs)) {
		if (typeof value === 'string') {
			yield* [' ', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"'];
			continue;
		}
		const val = typeof value === 'function' ? String(value) : typeof value === 'object' ? value.name : value;
		if (typeof val === 'string') {
			yield* [' :', name, '="', val.replace(/[<&"]/g, _xmlEncoder) || '', '"'];
		}
	}
	for (const [name, value] of Object.entries(events)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			yield* [' @', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(classes)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			yield* [' .', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(styles)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			yield* [' style:', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	if (!children.length) {
		yield '/>\n';
		return;
	}
	if (children.length === 1) {
		const [child] = children;
		if (typeof child === 'string' && child.length < 80 && !child.includes('\n')) {
			yield '>';
			yield* [child.replace(/[<&\t]/g, _xmlEncoder).replace(/]]>/g, ']]&gt;')];
			yield* ['</', name, '>\n'];
			return;
		}
	}
	yield '>\n';
	yield* listToString(children, level + 1);
	yield* [pad, '</', name, '>\n'];

}
/**
 * 
 * @param {(Layout.Node |string)[]} nodes 
 * @param {number} [level] 
 * @returns {Iterable<string>}
 */
function* listToString(nodes, level = 0) {
	if (!nodes.length) { return ''; }

	const pad = ''.padEnd(level, '\t');
	for (const child of nodes) {
		if (typeof child === 'string') {
			let text = child.replace(/[<&\t]/g, _xmlEncoder).replace(/]]>/g, ']]&gt;');
			if (pad) {
				text = text.replace(/(?<=^|\n)/g, pad);
			}
			yield text;
			yield '\n';
		} else {
			yield* nodeToString(child, level);
		}
	}
}
/**
 * 
 * @param {Layout.Node | (Layout.Node |string)[]} value 
 * @returns {string}
 */
export default function toString(value) {
	if (Array.isArray(value)) { return [...listToString(value)].join(''); }
	return [nodeToString(value)].join();

}
