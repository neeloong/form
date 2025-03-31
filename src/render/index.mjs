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
import renderObject from './renderObject.mjs';
import renderEnum from './renderEnum.mjs';
import bindBase from './bindBase.mjs';
import bindEnhancements from './bindEnhancements.mjs';
import divergent from './divergent.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {Record<string, [Layout.Template, Environment]>} templates
 * @param {string[]} componentPath
 * @param {Record<string, Enhancement>} enhancements
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 */
function renderNode(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent) {
	const bind = layout.bind;
	const path = [...componentPath, layout.name];
	const component = getComponent?.(path);
	if (getComponent && !component) { return () => { }; }
	const { context, handler } = createContext(
		component ? component : layout.name, env, env.getStore(bind), relate
	);

	const componentAttrs = component?.attrs;
	const attrs = componentAttrs
		? bindAttrs(handler, env, layout.attrs, componentAttrs, bind)
		: bindBaseAttrs(handler, env, layout.attrs);

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
		renderChildren(layout.children || [], slot, null, env, templates, componentPath, enhancements, relate, getComponent)
		: () => { };


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
 * @param {Environment} env
 * @param {Record<string, [Layout.Template, Environment]>} parentTemplates
 * @param {Record<string, Layout.Template>} [newTemplates]
 * @returns {Record<string, [Layout.Template, Environment]>}
 */
function createTemplates(env, parentTemplates, newTemplates) {
	if (!newTemplates) { return parentTemplates; };
	const layOutTemplates = Object.entries(newTemplates);
	if (!layOutTemplates.length) { return parentTemplates; }
	/** @type {Record<string, [Layout.Template, Environment]>} */
	const templates = Object.create(parentTemplates);
	for (const [name, template] of layOutTemplates) {
		templates[name] = [template, env];
	}
	return templates;
}
/**
 *
 * @param {Layout.Child} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} parentEnv
 * @param {Record<string, [Layout.Template, Environment]>} parentTemplates
 * @param {string[]} componentPath
 * @param {Record<string, Enhancement>} enhancements
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 * @returns {() => void}
 */
function renderChild(layout, parent, next, parentEnv, parentTemplates, componentPath, enhancements, relate, getComponent) {
	if (typeof layout === 'string') {
		const node = document.createTextNode(layout);
		parent.insertBefore(node, next);
		return () => node.remove();
	}
	const env = parentEnv.set(layout.vars);
	const templates = createTemplates(env, parentTemplates, layout.templates);
	if (layout.type === 'divergent') {
		return divergent(layout, parent, next, env, (list, vars, templates2) => {
			const listEnv = env.set(vars);
			const templates = createTemplates(listEnv, parentTemplates, templates2);
			return renderChildren(list, parent, next, listEnv, templates, componentPath, enhancements, relate, getComponent);
		});
	}
	if (layout.type === 'value') {
		const newEnv = env.child(layout.name);
		if (!newEnv) { return () => { }; }
		return renderChildren(layout.children, parent, next, newEnv, templates, componentPath, enhancements, relate, getComponent);
	}
	if (layout.type === 'enum') {
		const list = env.enum(layout.value);
		/** @type {(next: Node | null, env: any) => () => void} */
		const r = (next, env) => renderChildren(layout.children, parent, next, env, templates, componentPath, enhancements, relate, getComponent);
		if (list instanceof ArrayStore) {
			return renderArray(parent, next, list, env, r);
		}
		if (list instanceof ObjectStore) {
			return renderObject(parent, next, list, env, r);
		}
		if (typeof list === 'function') {
			return renderEnum(parent, next, list, env, r);
		}
		return () => { };
	}
	if (layout.type === 'content') {
		return renderFillDirectives(parent, next, env, layout.value, layout.html);
	}
	if (layout.type === 'template') {
		const template = templates[layout.template];
		if (!template) { return () => { }; }
		const [templateLayout, templateEnv] = template;
		const newEnv = templateEnv.params(templateLayout.params, layout.attrs, env, layout.bind);
		const subTemplates = createTemplates(newEnv, parentTemplates, templateLayout.templates);
		return renderChildren(templateLayout.children, parent, next, newEnv, subTemplates, componentPath, enhancements, relate, getComponent);
	}
	if (layout.type === 'fragment') {
		return renderChildren(layout.children, parent, next, env, templates, componentPath, enhancements, relate, getComponent);
	}
	return renderNode(layout, parent, next, env, templates, componentPath, enhancements, relate, getComponent);
}

/**
 *
 * @param {Layout.Child[]} layouts
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {Record<string, [Layout.Template, Environment]>} templates
 * @param {string[]} componentPath
 * @param {Record<string, Enhancement>} enhancements
 * @param {((store: Store, el: Element | Relatedness) => () => void)?} [relate]
 * @param {Component.Getter?} [getComponent]
 * @returns {() => void}
 */
function renderChildren(layouts, parent, next, env, templates, componentPath, enhancements, relate, getComponent) {
	const list = layouts.map(v => renderChild(v, parent, next, env, templates, componentPath, enhancements, relate, getComponent));
	let removed = false;
	return () => {
		if (removed) { return; }
		removed = true;
		for (const k of list) {
			k();
		}
	};
}

/**
 * @param {Store} store 存储实例
 * @param {Layout.Child[]} layouts 布局信息
 * @param {Element} parent 渲染节点
 * @param {object} [options] 选项
 * @param {Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }>} [options.global] 全局数据
 * @param {Component.Getter?} [options.component]  自定义组件
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate] 关联函数
 * @param {Record<string, Enhancement>} [options.enhancements] 增强信息
 * @returns {() => void}
 */
export default function render(store, layouts, parent, { component, global, relate, enhancements } = {}) {
	const env = new Environment(store, global);
	const templates = Object.create(null);
	const allEnhancements = enhancements || {};
	const relateFn = typeof relate === 'function' ? relate : null;
	return renderChildren(layouts, parent, null, env, templates, [], allEnhancements, relateFn, component);
}
