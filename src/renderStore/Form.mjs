/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import FormField from './FormField.mjs';
import FormButton from './FormButton.mjs';
import FormHtml from './FormHtml.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Item} item
 * @param {StoreLayout.Options?} options
 * @returns {[ParentNode, () => void]?}
 */
function FormItem(store, fieldRenderer, item, options) {
	if (item.type === 'button') {
		return FormButton(store, item, options);
	}
	if (item.type === 'html') {
		return FormHtml(store, fieldRenderer, item, options);
	}
	const fieldStore = store.child(item.field);
	if (fieldStore) {
		return FormField(fieldStore, fieldRenderer, item, options);
	}
	return null;
}

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout?} layout
 * @param {StoreLayout.Options?} options
 * @param {HTMLElement} [parent]
 * @returns {[HTMLElement, () => void]}
 */
export default function Form(store, fieldRenderer, layout, options, parent) {
	const root = parent instanceof HTMLElement ? parent : document.createElement('div');
	root.className = 'NeeloongForm';
	/** @type {(() => void)[]} */
	const destroyList = [];
	const fieldLayouts = layout?.fields;
	if (fieldLayouts) {
		for (const fieldTemplate of fieldLayouts) {
			const result = FormItem(store, fieldRenderer, fieldTemplate, options);
			if (!result) { continue; }
			const [el, destroy] = result;
			root.appendChild(el);
			destroyList.push(destroy);
		}
	} else {
		const fields = [...store].map(([, v]) => v);
		for (const field of fields) {
			const [el, destroy] = FormField(field, fieldRenderer, null, options);
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
