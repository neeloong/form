/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridLayout } from './types.mjs' */
import FormItem from './FormItem.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridLayout?} layout
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]
 * @param {HTMLElement} [options.parent]
 * @returns {[HTMLElement, () => void]}
 */
export default function Form(store, fieldRenderer, editable, layout, {parent, relate}) {
	const root = parent instanceof HTMLElement ? parent : document.createElement('div');
	root.className = 'NeeloongFormGrid';
	/** @type {(() => void)[]} */
	const destroyList = [];
	const fieldLayouts = layout?.fields
	if (fieldLayouts) {
		for (const fieldTemplate of fieldLayouts) {
			const fieldStore = store.child(fieldTemplate.field);
			if (!fieldStore) { continue; }
			const [el, destroy] = FormItem(fieldStore, fieldRenderer, editable, fieldTemplate, {relate});
			root.appendChild(el);
			destroyList.push(destroy);
		}
	} else {
		const fields = [...store].map(([, v]) => v)


		for (const field of fields) {
			const [el, destroy] = FormItem(field, fieldRenderer, editable, null, {relate});
			root.appendChild(el);
			destroyList.push(destroy);
		}
	}
	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}];

}
