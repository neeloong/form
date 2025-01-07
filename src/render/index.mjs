/** @import Store from '../Store/index.mjs' */
import Environment from './Environment/index.mjs';
import { ArrayStore, ObjectStore } from '../Store/index.mjs';
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
import renderObject from './renderObject.mjs';
import renderEnum from './renderEnum.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Store} store
 * @param {Environment} env
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {string[]} componentPath
 * @param {((path: string[]) => Component?)?} [getComponent]
 */
function renderItem(layout, parent, next, store, env, templates, componentPath, getComponent) {
	env = env.set(layout.aliases, layout.vars);
	const fragment = layout.directives.fragment;
	if (fragment && typeof fragment === 'string') {
		const template = templates[fragment];
		if (!template) { return () => {}; }
		const [templateLayout, templateEnv] = template;
		const newEnv = templateEnv.params(templateLayout, layout, env);
		return render(templateLayout, parent, next, store, newEnv, templates, componentPath, getComponent);
	}
	if (!layout.name || layout.directives.fragment) {
		return renderFillDirectives(parent, next, env, layout.directives) || 
			renderList(layout.children || [], parent, next, env, templates, (layout, templates) => {
				return render(layout, parent, next, store, env, templates, componentPath, getComponent);
			});
	}
	const path = [...componentPath, layout.name];
	const component = getComponent?.(path);
	if (getComponent && !component) { return () => { }; }
	const { context, handler } = createContext(component ? component : layout.name, env);


	const componentAttrs = component?.attrs
	const attrs = componentAttrs
		? bindAttrs(handler, env, layout.attrs, componentAttrs, layout.directives.bind)
		: bindBaseAttrs(handler, env, layout.attrs, layout.directives.bind)

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
	const slot = Array.isArray(r) ? r[1] : root;
	parent.insertBefore(root, next);
	const children = slot ? 
		renderFillDirectives(slot, null, env, layout.directives)
		|| renderList(layout.children || [], slot, null, env,  templates, (layout, templates) => {
			return render(layout, slot, null, store, env, templates, componentPath, getComponent);
		}) : () => {};


	bindClasses(root, layout.classes, env);
	bindStyles(root, layout.styles, env);

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
 * @param {Store} store
 * @param {Environment} env
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {string[]} componentPath
 * @param {((path: string[]) => Component?)?} [getComponent]
 * @returns {() => void}
 */
function render(layout, parent, next, store, env, templates, componentPath, getComponent) {
	const { directives } = layout;
	const { value } = directives;
	if (value) {
		const newStore = store.child(value);
		if (!newStore) { return () => {}; }
		store = newStore;
		env = env.setStore(store);
	}
	const enumValue = directives.enum;
	if (!enumValue) {
		return renderItem(layout, parent, next, store, env, templates, componentPath, getComponent);
	}
	const newStore = enumValue === true ? store : env.enum(enumValue);
	if (newStore instanceof ArrayStore) {
		return renderArray(layout, parent, next, newStore, env, (a, b, c, store, env) => {
			return renderItem(a, b, c, store, env, templates, componentPath, getComponent);
		});
	}
	if (newStore instanceof ObjectStore) {
		return renderObject(layout, parent, next, newStore, env, (a, b, c, store, env) => {
			return renderItem(a, b, c, store, env, templates, componentPath, getComponent);
		});
	}
	if (typeof newStore === 'function') {
		return renderEnum(layout, parent, next, store, newStore, env, (a, b, c, store, env) => {
			return renderItem(a, b, c, store, env, templates, componentPath, getComponent);
		});
	}
	return () => { };
}

/**
 * @overload
 * @param {Store} store
 * @param {(Layout.Node | string)[]} layouts 
 * @param {Element} parent 
 * @param {Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }>} [global] 
 * @param {(path: string[]) => Component?} [components] 
 * @returns {() => void}
 */
/**
 * @overload
 * @param {Store} store
 * @param {(Layout.Node | string)[]} layouts 
 * @param {Element} parent 
 * @param {((path: string[]) => Component?)?} [components] 
 * @returns {() => void}
 */
/**
 * @param {Store} store
 * @param {(Layout.Node | string)[]} layouts 
 * @param {Element} parent 
 * @param {((path: string[]) => Component?) | Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }> | null} [opt1] 
 * @param {((path: string[]) => Component?) | Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }> | null} [opt2] 
 */
export default function (store, layouts, parent, opt1, opt2) {
	const options = [opt1, opt2];
	const components = options.find(v => typeof v === 'function')
	const global = options.find(v => typeof v === 'object');
	const env = new Environment(store, global);
	const templates = Object.create(null)
	return renderList(layouts, parent, null, env, templates, (layout, templates) => {
		return render(layout, parent, null, store, env, templates, [], components);
	});
}
