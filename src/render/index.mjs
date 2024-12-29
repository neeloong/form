import computed from '../computed/index.mjs';
import getComponent from '../getComponent.mjs';
import { Schema, SchemaArray } from '../schema.mjs';
import createContext from './createContext.mjs';

/**
 * 
 * @param {any} val 
 * @returns 
 */
function toAttrValue(val) {
	if (typeof val === 'number') {
		return String(val);
	}
	if (typeof val === 'bigint') {
		return String(val);
	}
	if (typeof val === 'boolean') {
		return val ? '' : null;
	}
	if (typeof val === 'string') {
		return val;
	}
	if ((val ?? null) === null) {
		return null;
	}
	return String(val);
}
/**
 * 
 * @param {any} val 
 * @returns 
 */
function toText(val) {
	if ((val ?? null) === null) {
		return "";
	}
	return String(val);
}

/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {(import('../types.mjs').Layout | string)[]} layouts
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderList(parent, next, schema, envs, layouts, componentPath, getComponent) {

	let bkList = new Set()
	/** @type {[string | Function, import('../types.mjs').Layout][]} */
	let ifList = [];

	/** @param {[string | Function, import('../types.mjs').Layout][]} list */
	function renderIf(list) {
		if(!list.length) { return; }
		const end = parent.insertBefore(document.createComment(''), next);
		let result = computed(() => list.findIndex(v => {
			const ifv = v[0];
			if (!ifv) { return true; }
			if (typeof ifv === 'string') {
				return Boolean(schema.child(ifv)?.value);
			}
			return ifv();
		}));
		let lastIndex = result.value;
		let destroy = () => {}
		bkList.add(() => {
			result.stop();
			destroy();
			destroy = () => {};
			end.remove();
		})
		/**
		 * 
		 * @param {number} index 
		 * @returns 
		 */
		function renderIndex(index) {
			const layout = list[index]?.[1];
			if (!layout) { return; }
			destroy = render(parent, end, schema, envs, layout, componentPath, getComponent);
		}
		renderIndex(lastIndex);
		result.listen((index) => {
			if (index === lastIndex) { return; }
			lastIndex = index;
			destroy();
			destroy = () => {}
			renderIndex(lastIndex);
		});
	}
	for (const layout of layouts) {
		if (typeof layout === 'string') {
			renderIf(ifList)
			ifList = [];
			const node = document.createTextNode(layout);
			parent.insertBefore(node, next);
			continue;
		}
		if (ifList.length&& layout.directives.else != null) {
			const ifv = layout.directives.if || '';
			ifList.push([ifv, layout])
			if (!ifv) {
				renderIf(ifList)
				ifList = [];
			}
			continue;
		}
		renderIf(ifList);
		ifList = [];
		const ifv = layout.directives.if;
		if (ifv) {
			ifList.push([ifv, layout])
			continue;
		}
		bkList.add(
			render(parent, next, schema, envs, layout, componentPath, getComponent)
		);
	}

	return ()=> {
		const list = bkList;
		bkList = new Set();
		for (const s of list) {
			s();
		}
	}
}

/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {string | Function} template
 * @param {Schema} schema
 * @param {any} envs
 */
function renderTemplate(parent, next, template, schema, envs) {

	let bk = new Set();
	const node = parent.insertBefore(document.createTextNode('111'), next);
	const fn = !template ? () => schema.value : typeof template === 'function' ? template : () => schema.child(template)?.value
	const result = computed(() => fn(envs));
	let value = toText(result.value);
	node.textContent = value;
	bk.add(() => result.stop());
	result.listen((val) => {
		const newVal = toText(val);
		if (newVal === value) { return; }
		value = newVal;
		node.textContent = value;
	});
	bk.add(() => node.remove());
	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}

}

/**
 * @param {Element} node
 * @param {Element} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {import('../types.mjs').Layout} layout
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderChildren(node, next, schema, envs, layout, componentPath, getComponent) {
	const { children, directives: {text, html} } = layout;
	if (text) {
		const fn = typeof text === 'function' ? text : () => schema.child(text)?.value
		const result = computed(() => fn(envs));
		let value = toText(result.value);
		const n = node.insertBefore(document.createTextNode('value'), next)
		result.listen((val) => {
			const newVal = toText(val);
			if (newVal === value) { return; }
			value = newVal;
			n.textContent = value;
		});
		return () => result.stop();
	} else if (html) {
		const fn = typeof html === 'function' ? html : () => schema.child(html)?.value
		const result = computed(() => fn(envs));
		let value = toText(result.value);
		node.innerHTML = value;
		result.listen((val) => {
			const newVal = toText(val);
			if (newVal === value) { return; }
			value = newVal;
			node.innerHTML = value;
		});
		return () => result.stop();
	} else if (children) {
		return renderList(node, next, schema, envs, children, componentPath, getComponent);
	}
	return () => {};
}
/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {import('../types.mjs').Layout} layout
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderTag(parent, next, schema, envs, layout, componentPath, getComponent) {

	const { name, is, attrs, events } = layout;
	const node = document.createElement(name, {is: is || undefined});
	let bk = new Set();
	bk.add(() => node.remove())
	bk.add(renderChildren(node, null, schema, envs, layout, componentPath, getComponent));
	
	for (const [name, attr] of Object.entries(attrs)) {
		if (typeof attr !== 'function' && typeof attr !== 'symbol') {
			let value = toAttrValue(attr);
			if (value !== null) {
				node.setAttribute(name, value);
			}
			continue;
		}
		const fn = typeof attr === 'function' ? attr : () => schema.child(attr.description || '')?.value
		const result = computed(() => fn(envs));
		let value = toAttrValue(result.value);
		if (value !== null) {
			node.setAttribute(name, value);
		}
		bk.add(() => result.stop());
		result.listen((val) => {
			const newVal = toAttrValue(val);
			if (newVal === value) { return; }
			value = newVal;
			if (value === null) {
				node.removeAttribute(name);
			} else {
				node.setAttribute(name, value);
			}
		});
	}
	for (const [name, event] of Object.entries(events)) {
		if (typeof event === 'string') {
			// TODO: 事件名
		} else {
			// TODO: 事件名
			node.addEventListener(name, $event => event($event, envs));
		}
	}
	parent.insertBefore(node, next);
	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
/**
 * 
 * @param {ReturnType<typeof createContext>['cContext']} cContext 
 * @param {*} name 
 * @param {*} is 
 */
function createTagComponent2(cContext, name, is) {
	const node = document.createElement(name, {is: is || undefined});
	const {event, props, watchProp, listenRemove, } = cContext;

	for (const a of Object.keys(event)) {
		node.addEventListener(a, event[a]);
	}
	for (const a of Object.keys(props)) {
		watchProp(a, v => {
			const val = toAttrValue(v);
			if (val == null) {
				node.removeAttribute(a);
			} else {
				node.setAttribute(a, val);

			}
		})
		const val = toAttrValue(props[a]);
		if (val !== null) {
			node.setAttribute(a, val);
		}
	}
	return node;
}
/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {import('../types.mjs').Layout} layout
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderItem(parent, next, schema, envs, layout, componentPath, getComponent) {
	const path = [...componentPath, layout.name];
	if (layout.directives.fragment != null) {
		return renderList(parent, next, schema, envs, layout.children || [], componentPath, getComponent);
	}
	const template = layout.directives.template;
	if (template != null) {
		return renderTemplate(parent, next, template, schema, envs);
	}
	if (!getComponent) {
		return renderTag(parent, next, schema, envs, layout, path, getComponent);

	}
	const component = getComponent(path);
	if (!component) { return () => {}; }
	const {cContext, rContext} = createContext(component);

	let bk = new Set();
	bk.add(() => rContext.remove());


	const r = typeof component.tag === 'function'
	 ? component.tag(cContext)
	 : createTagComponent2(cContext, component.tag, component.is)
	const root = Array.isArray(r) ? r[0] : r;
	const slot = Array.isArray(r) && r[1] || root;
	const nextNode = Array.isArray(r) && r[2] || null;
	parent.insertBefore(root, next);
	bk.add(renderChildren(slot, nextNode, schema, envs, layout, componentPath, getComponent));

	const { attrs, events } = layout;
	
	for (const [name, attr] of Object.entries(attrs)) {
		if (typeof attr !== 'function' && typeof attr !== 'symbol') {
			rContext.set(name, attr);
			continue;
		}
		const fn = typeof attr === 'function' ? attr : () => schema.child(attr.description || '')?.value
		const result = computed(() => fn(envs));
		let value = result.value;
		rContext.set(name, value);
		bk.add(() => result.stop());
		result.listen((val) => {
			if (val === value) { return; }
			value = val;
			rContext.set(name, value);
		});
	}
	for (const [name, event] of Object.entries(events)) {
		if (typeof event === 'string') {
			// TODO: 事件名
		} else {
			// TODO: 事件名
			rContext.addEvent(name, event);
		}
	}
	// TODO: 创建组件
	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {SchemaArray} schema
 * @param {any} envs
 * @param {import('../types.mjs').Layout} layout
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderArray(parent, next, schema, envs, layout, componentPath, getComponent) {
	let bk = new Set()
	const start = parent.insertBefore(document.createComment(''), next);
	const end = parent.insertBefore(document.createComment(''), next);
	const childrenResult = computed(() => schema.children);
	let t = Math.random();

	/** @type {Map<Schema, [Comment, Comment, () => void]>} */
	let seMap = new Map();
	/** @param {Map<Schema, [Comment, Comment, () => void]>} map */
	function destroyMap(map) {
		for (const [s,e,d] of map.values()) {
			d();
			s.remove();
			e.remove();
		}

	}
	function render() {
		const children = childrenResult.value;
		let nextNode = start.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const ItemStart = parent.insertBefore(document.createComment(''), nextNode);
				const itemEnd = parent.insertBefore(document.createComment(''), nextNode);
				const d = renderItem(parent, itemEnd, child, envs, layout, componentPath, getComponent);
				seMap.set(child, [ItemStart, itemEnd, d]);
				continue;
			}
			oldSeMap.delete(child);
			seMap.set(child, old);
			if (nextNode === old[0]) {
				nextNode = old[1].nextSibling;
				continue;
			}
			/** @type {Node?} */
			let c = old[0];
			while (c && c !== old[1]) {
				const o = c;
				c = c.nextSibling;
				parent.insertBefore(o, nextNode);
			}
			parent.insertBefore(old[1], nextNode);
		}
		destroyMap(oldSeMap);
	}
	render();
	childrenResult.listen(() => render());
	
	return ()=> {
		const list = bk;
		bk = new Set();
		childrenResult.stop();
		for (const s of list) {
			s();
		}
	}
}
/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {import('../types.mjs').Layout} layout
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function render(parent, next, schema, envs, layout, componentPath, getComponent) {
	const { directives } = layout;
	const { value } = directives;
	const { item, name, no: noName } = directives;
	if (value) {
		schema = schema.child(value, true);
		envs =[...envs, {schema, name, noName}];
	}
	if (item == null) {
		return renderItem(parent, next, schema, envs, layout, componentPath, getComponent);

	}
	if (!(schema instanceof SchemaArray)) { return () => {}; }
	return renderArray(parent, next, schema, envs, layout, componentPath, getComponent);
}

/**
 * @param {Schema} schema
 * @param {(import('../types.mjs').Layout | string)[]} layouts 
 * @param {Element} parent 
 * @param {Node?} next 
 * @param {{roots: Record<string, import('../getComponent.mjs').Component>, common: Record<string, import('../getComponent.mjs').Component>}} [components] 
 */
export default function(schema, layouts, parent, next, components) {
	const gc = getComponent(components)
	return renderList(parent, next, schema, [{schema}],layouts, [], gc)
}
