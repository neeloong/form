/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import FormItem from './FormItem.mjs';
import FormButton from './FormButton.mjs';

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
	const fieldLayouts = layout?.fields
	if (fieldLayouts) {
		for (const fieldTemplate of fieldLayouts) {
			if (fieldTemplate.type === 'button') {
				const [el, destroy] = FormButton(store, fieldTemplate, options);
				root.appendChild(el);
				destroyList.push(destroy);
				continue;
			}
			const fieldStore = store.child(fieldTemplate.field);
			if (!fieldStore) { continue; }
			const [el, destroy] = FormItem(fieldStore, fieldRenderer, fieldTemplate, options);
			root.appendChild(el);
			destroyList.push(destroy);
		}
	} else {
		const fields = [...store].map(([, v]) => v)


		for (const field of fields) {
			const [el, destroy] = FormItem(field, fieldRenderer, null, options);
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
