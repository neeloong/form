
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
/**
 * 
 * @param {string} name 
 * @param {Node[]} children 
 * @returns {Node?}
 */
function createElement(name, children) {
	const node = document.createElement(name);
	for (const child of children) {
		node.appendChild(child);
	}
	return node;
}
export default class EnvValue {
	/** @type {EnvValue} */
	root;
	/** @type {EnvValue?} */
	parent = null;
	isArray = false;
	invalid = false;
	/** @type {Record<string, EnvValue>} */
	vars;
	/**
	 *
	 * @param {*} [schema]
	 * @param {*} [parent]
	 */
	constructor(schema, parent) {
		this.schema = schema;
		if (parent instanceof EnvValue) {
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
		const child = new EnvValue();
		child.root = this.root;
		child.parent = this;
		if (!this.invalid && child.invalid) {
			// TODO: 警告
		}
		return child;
	}
	/**
	 *
	 * @param {string} childName
	 * @param {import('./types.mjs').Layout} layout
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	renderChild(childName, layout, componentPath, componentMap) {
		const child = this.child(childName);
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
		const child = new EnvValue();
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
	nodes = [];
	/**
	 * @param {(import('./types.mjs').Layout | string)[]} layouts
	 * @param {string[]} componentPath
	 * @param {Map<string, import('./types.mjs').Component>} componentMap
	 */
	_renderList(layouts, componentPath, componentMap) {
		/** @type {Node[]} */
		const children = [];
		const nodes = this.nodes;
		for (const layout of layouts) {
			if (typeof layout === 'string') {
				const node = document.createTextNode(layout);
				children.push(node);
				nodes.push(node);
				continue;
			}
			const node = this.render(layout, componentPath, componentMap);
			if (!node) { continue }
			children.push(node);
			nodes.push(node);
		}
		return children;
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
		// /** @type {import('./types.mjs').Component[]} */
		// const list = [];
		// for (let i = path.length - 1; i >= 0; i--) {
		// 	const define = componentMap.get(path.slice(i).join('/'));
		// 	if (!define) { continue; }
		// 	list.push(define);
		// }
		// const component = merge(list);
		// if (!component) { return null; }
		for (const [name, attr] of Object.entries(attrs)) {
			// TODO: 整理属性
		}
		// TODO: 函数组件需要创建上下文
		const childNodes = children ? this._renderList(children, path, componentMap) : [];
		const node = createElement(name, childNodes);
		return node;
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
			/** @type {EnvValue} */
			let value = this;
			if (typeof item === 'string') {
				value = this.child(item);
			}
			return value.renderItems(directives.name, layout, componentPath, componentMap);
		}

		return this._render(layout, componentPath, componentMap);
	}
}
