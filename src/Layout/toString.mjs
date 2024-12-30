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
	const { attrs, events, directives, children, is, name, classes, styles } = node;
	if (!name) {
		return '';

	}
	const buf = [];

	buf.push('<', name);
	if (is) { buf.push('|', is); }

	for (const [name, value] of Object.entries(directives)) {
		if (typeof value === 'string') {
			buf.push(' !', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
		} else if (typeof value === 'function') {
			buf.push(' !', name, '="', String(value).replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	for (const [name, value] of Object.entries(attrs)) {
		if (typeof value === 'string') {
			buf.push(' ', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
		} else if (typeof value === 'symbol') {
			buf.push(' :', name, '="', value.description?.replace(/[<&"]/g, _xmlEncoder) || '', '"');
		} else if (typeof value === 'function') {
			buf.push(' :', name, '="', String(value).replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	for (const [name, value] of Object.entries(events)) {
		if (typeof value === 'string') {
			buf.push(' @', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
		} else if (typeof value === 'function') {
			buf.push(' @', name, '="', String(value).replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	for (const [name, value] of Object.entries(classes)) {
		if (typeof value === 'string') {
			buf.push(' class:', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
		} else if (typeof value === 'function') {
			buf.push(' class:', name, '="', String(value).replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	for (const [name, value] of Object.entries(styles)) {
		if (typeof value === 'string') {
			buf.push(' style:', name, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
		} else if (typeof value === 'function') {
			buf.push(' style:', name, '="', String(value).replace(/[<&"]/g, _xmlEncoder) || '', '"');
		}
	}
	// 

	const child = children[0];

	if (child || !/^(?:meta|link|img|br|hr|input)$/i.test(name)) {
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
