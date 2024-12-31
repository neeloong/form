/** @import Value from '../Value/index.mjs' */
import ENV from '../ENV.mjs';
import { ArrayValue } from '../Value/index.mjs';
/** @import { Component } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */
import bindAttrs from './bindAttrs.mjs';
import bindClasses from './bindClasses.mjs';
import bindStyles from './bindStyles.mjs';
import createContext from './createContext.mjs';
import createTagComponent from './createTagComponent.mjs';
import renderArray from './renderArray.mjs';
import renderFillDirectives from './renderFillDirectives.mjs';
import renderList from './renderList.mjs';
import renderTag from './renderTag.mjs';

/**
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {ENV} env
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
 * @param {ENV} env
 * @param {string[]} componentPath
 * @param {((path: string[]) => Component?)?} [getComponent]
 */
function renderItem(layout, parent, next, schema, env, componentPath, getComponent) {
	env = env.set(layout.aliases, layout.vars);
	const path = [...componentPath, layout.name];
	if (!layout.name || layout.directives.fragment) {
		return renderFragment(layout, parent, next, schema, env, l => {
			return render(l, parent, next, schema, env, componentPath, getComponent);
		});
	}
	if (!getComponent) {
		return renderTag(layout, parent, next, schema, env, (l, p) => {
			return renderList(l, p, null, schema, env, l => {
				return render(l, p, null, schema, env, path, getComponent);
			});
		});

	}
	const component = getComponent(path);
	if (!component) { return () => { }; }
	const { cContext, rContext } = createContext(component);



	const r = typeof component.tag === 'function'
		? component.tag(cContext)
		: createTagComponent(cContext, component.tag, component.is);
	const root = Array.isArray(r) ? r[0] : r;
	const slot = Array.isArray(r) && r[1] || root;
	parent.insertBefore(root, next);
	const children =
		renderFillDirectives(slot, null, schema, env, layout.directives)
		|| renderList(layout.children || [], slot, null, schema, env, l => {
			return render(l, slot, null, schema, env, componentPath, getComponent);
		});


	const attrs = bindAttrs(rContext, component.attrs, schema, env, layout.attrs);
	for (const [name, event] of Object.entries(layout.events)) {
		rContext.addEvent(name, env.getEvent(event));
	}
	bindClasses(root, layout.classes, schema, env);
	bindStyles(root, layout.styles, schema, env);

	rContext.init();
	// TODO: 创建组件
	return () => {
		root.remove();
		rContext.remove();
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
 * @param {ENV} env
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
	const env = new ENV(global).setValue(schema);
	return renderList(layouts, parent, null, schema, env, l => {
		return render(l, parent, null, schema, env, [], components);
	});
}
