
/**
 * @typedef {object} Attr
 * @property {string} type
 * // TODO: 可否计算，可否关联
 * @property {'value' | 'readonly' | 'disabled' | 'hidden'} [bind]
 * @property {string} [event]
 * @property {Function} [set]
 * 
 */
/**
 * @typedef {object} Event
 * @property {Record<string, any>} filters 过滤器
 * 
 */
/**
 * @typedef {object} Component
 * @property {string | ((ctx: any) => Element)} tag
 * @property {string} [is]
 * @property {Record<string, Attr>} attrs
 * @property {Record<string, Event>} events
 */

/**
 * @typedef {object} DComponent
 * @property {string[]} [attrs]
 * @property {string[]} [events]
 * @property {Record<string, DComponent>} [children]
 */

/**
 * @param {Record<string, Component>} [defines]
 * @param {{roots: Record<string, DComponent>, common: Record<string, DComponent>}} [components] 
 * @returns {((path: string[]) => Component?)?}
 */
export default function(defines, components) {
	if (!defines) { return null; }
		
	/** @type {Map<string, DComponent>}  */
	const componentMap = new Map();
	/**
	 * 
	 * @param {string[]} path 
	 * @param {Record<string, DComponent>} [components] 
	 */
	function getComponents(path, components) {
		if (!components) { return; }
		for (const [name, component] of Object.entries(components)) {
			const p = [...path, name];
			componentMap.set(p.join('/'), component);
			const children = component.children;
			if (!children) { continue; }
			getComponents(p, children);
		}
	}
	getComponents(['#'], components?.roots);
	getComponents([], components?.common);
	if (!componentMap.size) {
		return (path) => {
			const name = path[path.length - 1];
			if (!name) { return null; }
			const main = defines[name];
			if (!main) { return null; }
			/** @type {Component} */
			const component = {...main};
			return component;
	};
	}
	return (path) => {
		const name = path[path.length - 1];
		if (!name) { return null; }
		const main = defines[name];
		if (!main) { return null; }

		/** @type {DComponent[]} */
		const components = [];
		for (let i = path.length - 1; i >= 0; i--) {
			const define = componentMap.get(path.slice(i).join('/'));
			if (!define) { continue; }
			components.push(define);
		}
		if (!components.length) { return null; }
		/** @type {Component} */
		const component = {...main};
		const attrs = new Set(components.flatMap(v => v.attrs));
		const events = new Set(components.flatMap(v => v.events));
		component.attrs = Object.fromEntries(Object.entries(component.attrs).filter(v => attrs.has(v[0])))
		component.events = Object.fromEntries(Object.entries(component.events).filter(v => events.has(v[0])))
		return component;
	}

}
