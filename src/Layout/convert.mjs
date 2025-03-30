/** @import * as Layout from './index.mjs' */

/** @import { OldNode } from './createElement.mjs' */

/**
 * @param {(OldNode | string)[]} [layouts]
 * @returns {Layout.Child[]}
 */
function renderList(layouts) {
	if (!layouts?.length) { return []; }
	/** @type {Layout.Child[]} */
	const children = [];
	/** @type {[Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value | null, OldNode][]} */
	let ifList = [];
	/** @type {Record<string, Layout.Template>} */
	let templates = Object.create(null);
	let hasTemplate = false;
	for (const layout of layouts) {
		if (typeof layout === 'string') { continue; }
		const name = layout.template;
		if (!name) { continue; }
		hasTemplate = true;
		const children = convertItem(layout);
		templates[name] = { params: layout.params, children: children ? [children] : [] };
	}

	/** @param {[Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value | null, OldNode][]} list */
	function renderIf(list) {
		if (!list.length) { return; }
		children.push({
			type: 'divergent',
			children: list.map(([a, b]) => {
				const child = convertItem(b);
				if (!child) { return [{ children: [] }, a]; }
				if (typeof child !== 'string' && child.type === 'fragment') {
					return [child, a];
				}
				return [{ children: [child] }, a];
			}),
		});
	}
	for (const layout of layouts) {
		if (typeof layout === 'string') {
			renderIf(ifList);
			ifList = [];
			children.push(layout);
			continue;
		}
		if (layout.template) {
			renderIf(ifList);
			ifList = [];
			continue;
		}
		if (ifList.length && layout.else) {
			const ifv = layout.if || null;
			ifList.push([ifv, layout]);
			if (!ifv) {
				renderIf(ifList);
				ifList = [];
			}
			continue;
		}
		renderIf(ifList);
		ifList = [];
		const ifv = layout.if;
		if (ifv) {
			ifList.push([ifv, layout]);
			continue;
		}
		const s = convertItem(layout);
		if (s)
			children.push(s);
	}
	renderIf(ifList);
	if (hasTemplate) {
		return [{ type: 'fragment', templates, children }];
	}
	return children;
}


/**
 * @param {OldNode} layout
 * @returns {Layout.Child | undefined}
 */
function renderFillDirectives({ text, html }) {
	if (text != null) { return { type: 'content', value: text }; }
	if (html != null) { return { type: 'content', value: html, html: true }; }
}

/**
 * @param {OldNode} layout
 * @returns {Layout.Child?}
 */
function convertNode(layout) {
	const fragment = layout.fragment;
	if (fragment && typeof fragment === 'string') {
		return { type: 'template', template: fragment, attrs: layout.attrs, children: [] };
	}
	const child = renderFillDirectives(layout);
	const children = child ? [child] : renderList(layout.children);
	if (!layout.name || fragment) { return child || { type: 'fragment', children }; }
	return {
		name: layout.name,
		is: layout.is,
		attrs: layout.attrs,
		events: layout.events,
		classes: layout.classes,
		styles: layout.styles,
		enhancements: layout.enhancements,
		bind: layout.bind,
		comment: layout.comment,
		children,
	};
}
/**
 *
 * @param {OldNode} layout
 * @returns {Layout.Child?}
 */
function convertItem(layout) {
	let child = convertNode(layout);
	/** @type {Layout.Variable[]?} */
	let vars = layout.vars;
	if (vars.length && child && typeof child !== 'string') {
		if (child.vars) {
			child.vars = [...vars, ...child.vars];
		} else if (child) {
			child.vars = vars;
		} else {
			child = { type: 'fragment', vars, children: [] };
		}
		vars = null;
	}
	const enumValue = layout.enum;
	const name = layout.value;
	if (enumValue) { child = { type: 'enum', value: enumValue, vars, children: child ? [child] : [] }; vars = null; }
	if (name) { child = { type: 'value', name, vars, children: child ? [child] : [] }; vars = null; }
	if (vars?.length) {
		child = { type: 'fragment', vars, children: child ? [child] : [] };
	}
	return child;
}

/**
 * @param {(OldNode | string)[]} layouts 布局信息
 * @returns {Layout.Child[]}
 */
export default function convert(layouts) {
	return renderList(layouts);
}
