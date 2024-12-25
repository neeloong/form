/**
 * @typedef {object} Component
 * @property {string | (() => Element)} tagName
 * @property {string} [is]
 * @property {Record<string, Attr>} attrs
 * @property {Record<string, Component>} [children]
 */
/**
 * @typedef {object} Attr
 * @property {string} type
 * // TODO: 可否计算，可否关联
 */
/**
 * @typedef {object} Layout
 * @property {string} name
 * @property {string} [id]
 * @property {Record<string, LayoutAttr>} attrs
 * @property {Directives} directives
 * @property {Record<string, Layout>} [children]
 */
/**
 * @typedef {object} LayoutAttr
 * @property {any} [value]
 * @property {string} [bind]
 * @property {string} [computed]
 */
/**
 * @typedef {object} Directives
 * @property {string | true} [item] 列表循环的项目名
 * @property {string} [name] 
 * @property {string} [key] 
 * @property {string} [no]
 * @property {string} [value] 值关联（关联为列表）
 */

import Value from './src/Value.mjs';

/**
 * 
 * @param {Component[]} components 
 * @returns {Component?}
 */
export function merge(components) {
	const component = components.find(v => typeof v.tagName === 'function') || components.find(v => v.tagName);
	if (!component) { return null }
	/** @type {Record<string, Attr>} */
	const attrs = Object.assign({}, ...components.map(v => v.attrs));
	return {tagName: component.tagName, is: component.is, attrs };
}
/**
 * 
 * @param {Layout[]} layouts 
 * @param {*} schemas 
 * @param {{roots: Record<string, Component>, connom: Record<string, Component>}} componentDefines 
 */
export default function create(layouts, schemas, componentDefines) {
	const rootValue = new Value(schemas);
	/** @type {Map<string, Component>}  */
	const componentMap = new Map();
	/**
	 * 
	 * @param {string[]} path 
	 * @param {Record<string, Component>} components 
	 */
	function getComponents(path, components) {
		for (const [name, component] of Object.entries(components)) {
			const p = [...path, name];
			componentMap.set(p.join('/'), component);
			const children = component.children;
			if (!children) { continue; }
			getComponents(p, children);
		}
	}
	getComponents(['#'], componentDefines.roots);
	getComponents([], componentDefines.connom);
	/**
	 * 
	 * @param {Component} component 
	 * @param {Record<string, any>} attrs
	 * @param {Record<string, any>} attrs 
	 */
	function create(component) {

	}
	/**
	 * 
	 * @param {Layout} layout 
	 * @param {*} schema 
	 * @param {string[]} componentPath 
	 * @param {Value} parentValue 
	 */
	function render(layout, schema, componentPath, parentValue) {
		const { name, attrs, children, directives } = layout;
		const path = [...componentPath, name];
		/** @type {Component[]} */
		const list = [];
		for (let i = path.length - 1; i >= 0; i--) {
			const define = componentMap.get(path.slice(i).join('/'));
			if (!define) { continue; }
			list.push(define);
		}
		const component = merge(list);
		if (!component) { return null; }
		let thisValue = parentValue;
		if (directives.value) {
				thisValue = thisValue.child(directives.value);

		}
		if (directives.item) {
			// TODO: 循环处理
		}
		// TODO: 指令
		for (const [name, attr] of Object.entries(attrs)) {
			// TODO: 整理属性
		}
		// TODO: 创建组件
	}

	for (const layout of layouts) {
		render(layout, schemas, [], rootValue);
	}
}
