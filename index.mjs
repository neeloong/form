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
/**
 * 
 * @param {Component[]} components 
 * @returns {Component?}
 */
function merge(components) {
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

class Value {
	/** @type {Value} */
	root
	/** @type {Value?} */
	parent = null;
	schema = {};
	isArray = false;
	invalid = false;
	/** @type {Record<string, Value>} */
	vars
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
			this.vars = {...parent.vars}
		} else {
			this.root = this;
			this.vars = {}
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
	 * @param {Layout} layout 
	 * @param {string[]} componentPath 
	 * @param {Map<string, Component>} componentMap 
	 */
	renderChild(childname, layout, componentPath, componentMap) {
		const child = this.child(childname);
		const { attrs, children, directives } = layout;
		const {item, name} = directives
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
	 * @param {Layout} layout 
	 * @param {string[]} componentPath 
	 * @param {Map<string, Component>} componentMap 
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
	 * @param {Layout} layout 
	 * @param {string[]} componentPath 
	 * @param {Map<string, Component>} componentMap 
	 */
	_render(layout, componentPath, componentMap) {

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
		for (const [name, attr] of Object.entries(attrs)) {
			// TODO: 整理属性
		}
		// TODO: 创建组件
	}
	/**
	 * 
	 * @param {Layout} layout 
	 * @param {string[]} componentPath 
	 * @param {Map<string, Component>} componentMap 
	 */
	render(layout, componentPath, componentMap) {

		const { attrs, children, directives } = layout;
		let thisValue = this;
		const {value} = directives
		if (value) {
			return this.renderChild(value, layout, componentPath, componentMap);
		}
		const {item} = directives
		if (item) {
			/** @type {Value} */
			let value = this;
			if (typeof item === 'string') {
				value = this.child(item)
			}
			return value.renderItems(directives.name, layout, componentPath, componentMap);
		}

		return this._render(layout, componentPath, componentMap);
	}
	
}
