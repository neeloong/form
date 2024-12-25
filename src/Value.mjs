
/**
 * 
 * @param {import('./types.mjs').Component[]} components 
 * @returns {import('./types.mjs').Component?}
 */
export function merge(components) {
	const component = components.find(v => typeof v.tagName === 'function') || components.find(v => v.tagName);
	if (!component) { return null }
	/** @type {Record<string, Attr>} */
	const attrs = Object.assign({}, ...components.map(v => v.attrs));
	return {tagName: component.tagName, is: component.is, attrs };
}
export default class Value {
	/** @type {Value} */
	root;
	/** @type {Value?} */
	parent = null;
	schema = {};
	isArray = false;
	invalid = false;
	/** @type {Record<string, Value>} */
	vars;
	/**
	 *
	 * @param {*} schema
	 * @param {*} parent
	 */
	constructor(schema, parent) {
		this.schema = schema;
		if (parent instanceof Value) {
			this.parent = schema;
			this.root = schema.root;
			this.vars = { ...parent.vars };
		} else {
			this.root = this;
			this.vars = {};
		}
	}


	/**
	 *
	 * @param {string} childname
	 */
	child(childname) {
		if (!this.invalid && this.isArray) {
			// TODO: 警告
		}
		const child = new Value();
		child.root = this.root;
		child.parent = this;
		if (!this.invalid && child.invalid) {
			// TODO: 警告
		}
		return child;
	}
	/**
	 *
	 * @param {string} childname
	 * @param {import('./types.mjs').Layout} layout
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	renderChild(childname, layout, componentPath, componentMap) {
		const child = this.child(childname);
		const { attrs, children, directives } = layout;
		const { item, name } = directives;
		if (item) {
			return child.renderItems(name, layout, componentPath, componentMap);
		}
		if (name) {
			child.vars[name] = child;
		}
		// TODO: 追加上下文名称
		return child._render(layout, componentPath, componentMap);
	}
	/**
	 *
	 * @param {string | undefined} name
	 * @param {import('./types.mjs').Layout} layout
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	renderItems(name, layout, componentPath, componentMap) {
		if (!this.invalid && !this.isArray) {
			// TODO: 警告
		}
		const child = new Value();
		child.root = this.root;
		child.parent = this;
		if (!this.invalid && child.invalid) {
			// TODO: 警告
		}
		if (name) {
			child.vars[name] = child;
		}
		return child._render(layout, componentPath, componentMap);
	}
	/**
	 *
	 * @param {import('./types.mjs').Layout} layout
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	_render(layout, componentPath, componentMap) {
		const { name, attrs, children } = layout;
		const path = [...componentPath, name];
		/** @type {import('./types.mjs').Component[]} */
		const list = [];
		for (let i = path.length - 1; i >= 0; i--) {
			const define = componentMap.get(path.slice(i).join('/'));
			if (!define) { continue; }
			list.push(define);
		}
		const component = merge(list);
		if (!component) { return null; }
		for (const [name, attr] of Object.entries(attrs)) {
			// TODO: 整理属性
		}
		// TODO: 创建组件
	}
	/**
	 *
	 * @param {import('./types.mjs').Layout} layout
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	render(layout, componentPath, componentMap) {

		const { directives } = layout;
		const { value } = directives;
		if (value) {
			return this.renderChild(value, layout, componentPath, componentMap);
		}
		const { item } = directives;
		if (item) {
			/** @type {Value} */
			let value = this;
			if (typeof item === 'string') {
				value = this.child(item);
			}
			return value.renderItems(directives.name, layout, componentPath, componentMap);
		}

		return this._render(layout, componentPath, componentMap);
	}
}
