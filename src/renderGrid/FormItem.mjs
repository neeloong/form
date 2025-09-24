
/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFormItemTemplate } from './types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import SubFieldFormItem from './Table.mjs';
import Form from './Form.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFormItemTemplate?} template
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]
 * @param {boolean} [inline]
 * @returns {[HTMLElement, () => void]}
 */
export default function FormItem(store, fieldRenderer, editable, template, options, inline = false) {
	const subFields = template?.subFields;
	const { type, component } = store;
	if (inline) {
		if (component) {
			return fieldRenderer(store, component, options);
		}
		return [document.createElement('div'), () => {}];
	}
	if (type && typeof type === 'object') {
		const root = document.createElement('details');
		root.open = true;
		const summary = root.appendChild(document.createElement('summary'))
		summary.innerText = store.label || '';
		root.hidden = store.hidden;
		if (!Array.isArray(subFields) && typeof component === 'function') {
			const [el, destroy] = fieldRenderer(store, component, options)
			root.appendChild(el);
			return [root, destroy];
		}
		if (store instanceof ArrayStore) {
			const [table, destroy] = SubFieldFormItem(store, fieldRenderer, editable, template, options)
			root.appendChild(table);
			return [root, destroy];
		} else {
			const [form, destroy] = Form(store, fieldRenderer, editable, Array.isArray(subFields) ? subFields : null, options)
			root.appendChild(form);
			return [root, destroy];
		}
	}

	const root = document.createElement('div');
	root.className = "GridForm-item"
	root.hidden = store.hidden;
	const colSpan = store.meta.colSpan;
	if (colSpan) {
		root.style.gridColumn = `span ${colSpan}`;
	}
	const label = root.appendChild(document.createElement('div'))
	label.className = 'GridForm-item-label'
	label.innerText = store.label || '';


	const content = root.appendChild(document.createElement('div'))
	content.className = 'GridForm-item-content';

	const description = root.appendChild(document.createElement('div'))
	description.className = 'GridForm-item-description'
	description.innerText = store.description || '';
	if (typeof component === 'function') {
		const [el, destroy] = fieldRenderer(store, component, options);
		content.appendChild(el);
		return [root, destroy];
	}
	return [root, () => {}];
}
