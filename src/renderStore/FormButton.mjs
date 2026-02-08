/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import effect from '../effect.mjs';
import createCell from './createCell.mjs';

/**
 *
 * @param {Store<any, any>} store
 * @param {StoreLayout.Button} layout
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode}
 */
export default function FormButton(store, layout, options) {
	const [root, content] = createCell(options?.signal, layout, store);
	const button = document.createElement('button');
	effect(() => {
		const t = layout.text;
		const text = typeof t === 'function' ? t(store, options) : t;
		button.innerText = text ?? '';
	}, options?.signal);
	effect(() => {
		const d = layout.disabled;
		const disabled = typeof d === 'function' ? d(store, options) : d;
		button.disabled = Boolean(disabled);
	}, options?.signal);
	button.classList.add('NeeloongForm-item-button');
	content.appendChild(button);
	const click = layout.click;
	if (typeof click === 'function') {
		button.addEventListener('click', e => click(e, store, options));
	} else if (click && typeof click === 'string') {
		const call = options?.call;
		if (typeof call === 'function') {
			button.addEventListener('click', e => call(click, e, store, options));
		}
	}
	return root;
}
