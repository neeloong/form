
/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFormItemTemplate } from './types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import SubFieldFormItem from './Table.mjs';
import Form from './Form.mjs';
import effect from '../effect.mjs';

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
		return [document.createElement('div'), () => { }];
	}
	/** @type {(() => void)[]} */
	const destroyList = [];
	if (type && typeof type === 'object') {
		const root = document.createElement('details');
		root.open = true;
		const summary = root.appendChild(document.createElement('summary'));
		destroyList.push(effect(() => summary.innerText = store.label || ''));
		destroyList.push(effect(() => root.hidden = store.hidden));
		if (!Array.isArray(subFields) && typeof component === 'function') {
			const [el, destroy] = fieldRenderer(store, component, options);
			root.appendChild(el);
			destroyList.push(destroy);
		} else if (store instanceof ArrayStore) {
			const [table, destroy] = SubFieldFormItem(store, fieldRenderer, editable, template, options);
			root.appendChild(table);
			destroyList.push(destroy);
		} else {
			const [form, destroy] = Form(store, fieldRenderer, editable, Array.isArray(subFields) ? subFields : null, options);
			root.appendChild(form);
			destroyList.push(destroy);
		}
		return [root, () => {
			for (const destroy of destroyList) {
				destroy();
			}
		}];
	}

	const root = document.createElement('div');
	root.className = "GridForm-item";
	destroyList.push(effect(() => root.hidden = store.hidden));
	const { colStart, colSpan, colEnd, rowStart, rowSpan, rowEnd } = template || {};
	if (colStart) { root.style.gridColumnStart = `${colStart}`; }
	if (colEnd) {
		root.style.gridColumnEnd = `${colEnd}`;
	} else if (colSpan) {
		root.style.gridColumnEnd = `span ${colSpan}`;
	}
	if (rowStart) { root.style.gridRowStart = `${rowStart}`; }
	if (rowEnd) {
		root.style.gridRowEnd = `${rowEnd}`;
	} else if (rowSpan) {
		root.style.gridRowEnd = `span ${rowSpan}`;
	}
	const label = root.appendChild(document.createElement('div'));
	label.className = 'GridForm-item-label';
	destroyList.push(effect(() => label.innerText = store.label || ''));


	const content = root.appendChild(document.createElement('div'));
	content.className = 'GridForm-item-content';

	const description = root.appendChild(document.createElement('div'));
	description.className = 'GridForm-item-description';
	destroyList.push(effect(() => description.innerText = store.description || ''));
	if (typeof component === 'function') {
		const [el, destroy] = fieldRenderer(store, component, options);
		content.appendChild(el);
		destroyList.push(destroy);
	}
	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}];
}
