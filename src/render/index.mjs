import { Schema, SchemaArray } from '../schema.mjs';
import bindAttrs from './bindAttrs.mjs';
import bindClasses from './bindClasses.mjs';
import bindStyles from './bindStyles.mjs';
import createContext from './createContext.mjs';
import createTagComponent from './createTagComponent.mjs';
import renderArray from './renderArray.mjs';
import renderChildrenDirectives from './renderChildrenDirectives.mjs';
import renderList from './renderList.mjs';
import renderTag from './renderTag.mjs';
import renderTemplate from './renderTemplate.mjs';

/**
 * @param {import('../types.mjs').Layout} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 */
function renderItem(layout, parent, next, schema, envs, componentPath, getComponent) {
	const path = [...componentPath, layout.name];
	if (!layout.name || layout.directives.fragment != null) {
		return renderList(layout.children || [], parent, next, schema, envs, l => {
			return render(l, parent, next, schema, envs, componentPath, getComponent);
		});
	}
	const template = layout.directives.template;
	if (template != null) {
		return renderTemplate(parent, next, template, schema, envs);
	}
	if (!getComponent) {
		return renderTag(layout, parent, next, schema, envs, (l, p) => {
			return renderList(l, p, null, schema, envs, l => {
				return render(l, p, null, schema, envs, path, getComponent);
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
		renderChildrenDirectives(slot, schema, envs, layout.directives)
		|| renderList(layout.children || [], slot, null, schema, envs, l => {
			return render(l, slot, null, schema, envs, componentPath, getComponent);
		});


	const attrs = bindAttrs(rContext, component.attrs, schema, envs, layout.attrs);
	for (const [name, event] of Object.entries(layout.events)) {
		if (typeof event === 'string') {
			// TODO: 事件名
		} else {
			// TODO: 事件名
			rContext.addEvent(name, event);
		}
	}
	bindClasses(root, layout.classes, schema, envs);
	bindStyles(root, layout.styles, schema, envs);

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
 * @param {import('../types.mjs').Layout} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Schema} schema
 * @param {any} envs
 * @param {string[]} componentPath
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [getComponent]
 * @returns {() => void}
 */
function render(layout, parent, next, schema, envs, componentPath, getComponent) {
	const { directives } = layout;
	const { value } = directives;
	const { item, name, index: noName } = directives;
	if (value) {
		schema = schema.child(value, true);
		envs = [...envs, { schema, name, noName }];
	}
	if (item == null) {
		return renderItem(layout, parent, next, schema, envs, componentPath, getComponent);

	}
	if (!(schema instanceof SchemaArray)) { return () => { }; }
	return renderArray(layout, parent, next, schema, envs, (a, b, c, d, e) => {
		return renderItem(a, b, c, d, e, componentPath, getComponent);
	});
}

/**
 * @param {Schema} schema
 * @param {(import('../types.mjs').Layout | string)[]} layouts 
 * @param {Element} parent 
 * @param {((path: string[]) => import('../getComponent.mjs').Component?)?} [components] 
 */
export default function (schema, layouts, parent, components) {
	const envs = [{ schema }];
	return renderList(layouts, parent, null, schema, envs, l => {
		return render(l, parent, null, schema, envs, [], components);
	});
}
