/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import FormField from './FormField.mjs';
import FormButton from './FormButton.mjs';
import FormHtml from './FormHtml.mjs';

/**
 * 
 * @template T
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Item<T>} item
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode?}
 */
function FormItem(store, fieldRenderer, item, options) {
	if (item.type === 'button') {
		return FormButton(store, item, options);
	}
	if (item.type === 'html') {
		return FormHtml(store, fieldRenderer, item, options);
	}
	const field = item.field;
	if (!field) { return null; }
	const fieldStore = store.child(field);
	if (fieldStore) {
		return FormField(fieldStore, fieldRenderer, item, options);
	}
	return null;
}

/**
 * 
 * @template T
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout<T>} layout
 * @param {StoreLayout.Options?} options
 * @param {HTMLElement} [parent]
 * @returns {HTMLElement?}
 */
export default function Form(store, fieldRenderer, layout, options, parent) {
	if (options?.signal?.aborted) { return null; }
	const root = parent instanceof HTMLElement ? parent : document.createElement('div');
	root.classList.add('NeeloongForm');
	const fieldLayouts = layout.fields || store.layout.fields;
	if (fieldLayouts?.length) {
		for (const fieldTemplate of fieldLayouts) {
			const el = FormItem(store, fieldRenderer, fieldTemplate, options);
			if (el) { root.appendChild(el); }
		}
	} else {
		const fields = [...store].map(([, v]) => v);
		for (const field of fields) {
			const el = FormField(field, fieldRenderer, field.layout, options);
			if (el) { root.appendChild(el); }
		}
	}
	return root;

}
