/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import createCell from './createCell.mjs';

/**
 *
 * @param {Store<any, any>} store
 * @param {StoreLayout.Button} layout
 * @param {StoreLayout.Options?} options
 * @returns {[ParentNode, () => void]}
 */
export default function FormButton(store, layout, options) {
	const [root, destroy, content, destroyList] = createCell(layout, store);
	const button = document.createElement('button');
	destroyList.push(() => {
		const t = layout.text;
		const text = typeof t === 'function' ? t(store, options) : t;
		button.innerText = text ?? '';
	});
	destroyList.push(() => {
		const d = layout.disabled;
		const disabled = typeof d === 'function' ? d(store, options) : d;
		button.disabled = Boolean(disabled);
	});
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
	return [root, destroy];
}
