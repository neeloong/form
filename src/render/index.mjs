/** @import Value from '../Value/index.mjs' */
import Environment from './Environment.mjs';
import { ArrayValue } from '../Value/index.mjs';
/** @import { Component } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */
import bindAttrs from './bindAttrs.mjs';
import bindBaseAttrs from './bindBaseAttrs.mjs';
import bindClasses from './bindClasses.mjs';
import bindStyles from './bindStyles.mjs';
import createContext from './createContext.mjs';
import createTagComponent from './createTagComponent.mjs';
import renderArray from './renderArray.mjs';
import renderFillDirectives from './renderFillDirectives.mjs';
import renderList from './renderList.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {Environment} env
 * @param {(layout: Layout.Node) => () => void} renderItem
 * @returns {() => void}
 */
function renderFragment(layout, parent, next, schema, env, renderItem) {
	return renderFillDirectives(parent, next, schema, env, layout.directives) || 
	renderList(layout.children || [], parent, next, schema, env, renderItem);

}
/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {Environment} env
 * @param {string[]} componentPath
 * @param {((path: string[]) => Component?)?} [getComponent]
 */
function renderItem(layout, parent, next, schema, env, componentPath, getComponent) {
	env = env.set(layout.aliases, layout.vars);
	if (!layout.name || layout.directives.fragment) {
		return renderFragment(layout, parent, next, schema, env, l => {
			return render(l, parent, next, schema, env, componentPath, getComponent);
		});
	}
	const path = [...componentPath, layout.name];
	const component = getComponent?.(path);
	if (getComponent && !component) { return () => { }; }
	const { context, handler } = createContext(component ? component : layout.name, env);


	const componentAttrs = component?.attrs
	const attrs = componentAttrs
		? bindAttrs(handler, schema, env, layout.attrs, componentAttrs, layout.directives.bind)
		: bindBaseAttrs(handler, schema, env, layout.attrs, layout.directives.bind)

	for (const [name, event] of Object.entries(layout.events)) {
		const fn = env.getEvent(event);
		if (fn) { handler.addEvent(name, fn); }
	}

	const r = component ?
		typeof component.tag === 'function'
			? component.tag(context)
			: createTagComponent(context, component.tag, component.is)
		: createTagComponent(context, layout.name, layout.is);
	const root = Array.isArray(r) ? r[0] : r;
	const slot = Array.isArray(r) && r[1] || root;
	parent.insertBefore(root, next);
	const children =
		renderFillDirectives(slot, null, schema, env, layout.directives)
		|| renderList(layout.children || [], slot, null, schema, env, l => {
			return render(l, slot, null, schema, env, componentPath, getComponent);
		});


	bindClasses(root, layout.classes, schema, env);
	bindStyles(root, layout.styles, schema, env);

	handler.init();
	// TODO: 创建组件
	return () => {
		root.remove();
		handler.destroy();
		attrs();
		children();
	};
}
/**
 *
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {Environment} env
 * @param {string[]} componentPath
 * @param {((path: string[]) => Component?)?} [getComponent]
 * @returns {() => void}
 */
function render(layout, parent, next, schema, env, componentPath, getComponent) {
	const { directives } = layout;
	const { value } = directives;
	if (value) {
		schema = schema.child(value, true);
		env = env.setValue(schema);
	}
	if (!directives.enum) {
		return renderItem(layout, parent, next, schema, env, componentPath, getComponent);
	}
	if (!(schema instanceof ArrayValue)) { return () => { }; }
	return renderArray(layout, parent, next, schema, env, (a, b, c, d, env) => {
		return renderItem(a, b, c, d, env, componentPath, getComponent);
	});
}

/**
 * @param {Value} schema
 * @param {(Layout.Node | string)[]} layouts 
 * @param {Element} parent 
 * @param {Record<string, Value | {get?(): any; set?(v: any): void; exec(...p: any[]): any; calc(...p: any[]): any }>?} [global] 
 * @param {((path: string[]) => Component?)?} [components] 
 */
export default function (schema, layouts, parent, global, components) {
	// TODO: 全局环境
	const env = new Environment(global).setValue(schema);
	return renderList(layouts, parent, null, schema, env, l => {
		return render(l, parent, null, schema, env, [], components);
	});
}
