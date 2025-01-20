/** @import Store from '../Store/index.mjs' */
import Environment from './Environment/index.mjs';
import { ArrayStore, ObjectStore } from '../Store/index.mjs';
/** @import { Component, Relatedness } from '../types.mjs' */
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
import bindBase from './bindBase.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {string[]} componentPath
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 */
function renderItem(layout, parent, next, env, templates, componentPath, relate, getComponent) {
	env = env.set(layout.aliases, layout.vars);
	const bind = layout.directives.bind;
	const fragment = layout.directives.fragment;
	if (fragment && typeof fragment === 'string') {
		const template = templates[fragment];
		if (!template) { return () => {}; }
		const [templateLayout, templateEnv] = template;
		const newEnv = templateEnv.params(templateLayout, layout, env, bind);
		return render(templateLayout, parent, next, newEnv, templates, componentPath, relate, getComponent);
	}
	if (!layout.name || layout.directives.fragment) {
		return renderFillDirectives(parent, next, env, layout.directives) || 
			renderList(layout.children || [], parent, next, env, templates, (layout, templates) => {
				return render(layout, parent, next, env, templates, componentPath, relate, getComponent);
			});
	}
	const path = [...componentPath, layout.name];
	const component = getComponent?.(path);
	if (getComponent && !component) { return () => { }; }
	const { context, handler } = createContext(
		component ? component : layout.name,
		env,
		env.getStore(bind),
		relate
	);

	const componentAttrs = component?.attrs
	const attrs = componentAttrs
		? bindAttrs(handler, env, layout.attrs, componentAttrs, bind)
		: bindBaseAttrs(handler, env, layout.attrs)

	for (const [name, event] of Object.entries(layout.events)) {
		const fn = env.getEvent(event);
		if (fn) { handler.addEvent(name, fn); }
	}

	const base = bindBase(handler, env, bind);


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
			return render(layout, slot, null, env, templates, componentPath, relate, getComponent);
		}) : () => {};


	bindClasses(root, layout.classes, env);
	bindStyles(root, layout.styles, env);

	handler.mount();
	
	return () => {
		root.remove();
		handler.destroy();
		attrs();
		children();
		base();
	};
}
/**
 *
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {string[]} componentPath
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 * @returns {() => void}
 */
function render(layout, parent, next, env, templates, componentPath, relate, getComponent) {
	const { directives } = layout;
	const newEnv = env.child(directives.value);
	if (!newEnv) { return () => {}; }
	const list = newEnv.enum(directives.enum);
	/** @type {(next: Node | null, env: any) => () => void} */
	const r = (next, env) => renderItem(layout, parent, next, env, templates, componentPath, relate, getComponent);
	if (list === true) {
		return r(next, newEnv);
	}
	if (list instanceof ArrayStore) {
		return renderArray(parent, next, list, newEnv, r);
	}
	if (list instanceof ObjectStore) {
		return renderObject(parent, next, list, newEnv, r);
	}
	if (typeof list === 'function') {
		return renderEnum(parent, next, list, newEnv, r);
	}
	return () => { };
}

/**
 * @param {Store} store
 * @param {(Layout.Node | string)[]} layouts 
 * @param {Element} parent 
 * @param {object} [options] 
 * @param {Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }>} [options.global] 
 * @param {(path: string[]) => Component?} [options.component] 
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]
 * @returns {() => void}
 */
export default function (store, layouts, parent, {component, global, relate} = {}) {
	const env = new Environment(store, global);
	const templates = Object.create(null)
	const relateFn = typeof relate  === 'function' ? relate : null;
	return renderList(layouts, parent, null, env, templates, (layout, templates) => {
		return render(layout, parent, null, env, templates, [], relateFn, component);
	});
}
