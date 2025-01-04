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
	const pad = level > 0 ? ''.padEnd(level, '\t') : '';

	yield pad;
	yield* ['<', name || '-'];
	if (is) { yield* ['|', is]; }

	for (const [name, value] of Object.entries(directives)) {
		if (value === false || value == null) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		yield* [' !', name];
		if (val && typeof val === 'string') {
			yield* ['="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(aliases)) {
		if (value == null) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		yield* [' *', name];
		if (val && typeof val === 'string') {
			yield* ['="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(vars)) {
		if (value == null) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		yield* [' +', name];
		if (val && typeof val === 'string') {
			yield* ['="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(attrs)) {
		if (value == null) { continue; }
		if (typeof value === 'string') {
			yield* [' ', name];
			if (value) {
				yield* ['="', value.replace(/[<&"]/g, _xmlEncoder), '"'];
			}
			continue;
		}
		const val = typeof value === 'function' ? String(value) : typeof value === 'object' ? value.name : value;
		if (val && typeof val === 'string') {
			yield* [' :', name, '="', val.replace(/[<&"]/g, _xmlEncoder) || '', '"'];
		}
	}
	for (const [name, value] of Object.entries(events)) {
		if (value == null) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			yield* [' @', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(classes)) {
		if (value == null || value == false) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		yield* [' .', name];
		if (val && typeof val === 'string') {
			yield* [' .', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
	for (const [name, value] of Object.entries(styles)) {
		if (value == null) { continue; }
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			yield* [' style:', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"'];
		}
	}
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
