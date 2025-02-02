/** @import Store from '../Store/index.mjs' */
import Environment from './Environment/index.mjs';
import { ArrayStore, ObjectStore } from '../Store/index.mjs';
/** @import { Component, Enhancement, Relatedness } from '../types.mjs' */
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
import bindEnhancements from './bindEnhancements.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {string[]} componentPath
 * @param {Record<string, Enhancement>} enhancements
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 */
function renderItem(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent) {
	env = env.set(layout.aliases, layout.vars);
	const bind = layout.bind;
	const fragment = layout.fragment;
	if (fragment && typeof fragment === 'string') {
		const template = templates[fragment];
		if (!template) { return () => {}; }
		const [templateLayout, templateEnv] = template;
		const newEnv = templateEnv.params(templateLayout, layout, env, bind);
		return render(templateLayout, parent, next, newEnv, templates, componentPath, enhancements, relate, getComponent);
	}
	if (!layout.name || layout.fragment) {
		return renderFillDirectives(parent, next, env, layout) || 
			renderList(layout.children || [], parent, next, env, templates, (layout, templates) => {
				return render(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent);
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
		renderFillDirectives(slot, null, env, layout)
		|| renderList(layout.children || [], slot, null, env,  templates, (layout, templates) => {
			return render(layout, slot, null, env, templates, componentPath, enhancements, relate, getComponent);
		}) : () => {};


	const classes = bindClasses(root, env, layout.classes, layout.attrs.class);
	const styles = bindStyles(root, env, layout.styles, layout.attrs.style);

	handler.mount();
	const enhancement = bindEnhancements(handler.tag, layout.enhancements, env, enhancements, root, slot);
	
	return () => {
		enhancement();
		handler.destroy();
		root.remove();
		attrs();
		children();
		base();
		classes();
		styles();
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
 * @param {Record<string, Enhancement>} enhancements
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 * @returns {() => void}
 */
function render(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent) {
	const newEnv = env.child(layout.value);
	if (!newEnv) { return () => {}; }
	const list = newEnv.enum(layout.enum);
	/** @type {(next: Node | null, env: any) => () => void} */
	const r = (next, env) => renderItem(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent);
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
 * @param {Record<string, Enhancement>} [options.enhancements]
 * @returns {() => void}
 */
export default function (store, layouts, parent, {component, global, relate, enhancements} = {}) {
	const env = new Environment(store, global);
	const templates = Object.create(null)
	const allEnhancements = enhancements || {}
	const relateFn = typeof relate  === 'function' ? relate : null;
	return renderList(layouts, parent, null, env, templates, (layout, templates) => {
		return render(layout, parent, null, env, templates, [], allEnhancements, relateFn, component);
	});
}
