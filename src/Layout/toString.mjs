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
 */
export default function toString(node) {
	const { attrs, events, directives, children, is, name, classes, styles, aliases, vars, simple } = node;
	if (!name) {
		return '';

	}
	const buf = [];

	buf.push('<', name);
	if (is) { buf.push('|', is); }

	for (const [name, value] of Object.entries(directives)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			buf.push(' !', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	for (const [name, value] of Object.entries(vars)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			buf.push(' +', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	for (const [name, value] of Object.entries(aliases)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (val && typeof val === 'string') {
			buf.push(' *', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	for (const [name, value] of Object.entries(attrs)) {
		if (typeof value === 'string') {
			buf.push(' ', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
			continue;
		}
		const val = typeof value === 'function' ? String(value) : typeof value === 'object' ? value.name : value;
		if (typeof val === 'string') {
			buf.push(' :', name, '="', val.replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	for (const [name, value] of Object.entries(events)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			buf.push(' @', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	for (const [name, value] of Object.entries(classes)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			buf.push(' class:', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	for (const [name, value] of Object.entries(styles)) {
		const val = typeof value === 'function' ? String(value) : value;
		if (typeof val === 'string') {
			buf.push(' style:', name, '="', val.replace(/[<&"]/g, _xmlEncoder), '"');
		}
	}
	const child = children[0];

	if (child || !simple) {
		buf.push('>');
		for (const child of children) {
			if (typeof child === 'string') {
				buf.push(child.replace(/[<&]/g, _xmlEncoder).replace(/]]>/g, ']]&gt;'));
			} else {
				buf.push(child.toString());
			}
		}
		buf.push('</', name, '>');
	} else {
		buf.push('/>');
	}
	return buf.join('');
}
