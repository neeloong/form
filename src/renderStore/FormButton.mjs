/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import createGridCell from './createGridCell.mjs';

/**
 *
 * @param {Store<any, any>} store
 * @param {StoreLayout.Button} layout
 * @param {StoreLayout.Options?} options
 * @returns {[ParentNode, () => void]}
 */


export default function FormButton(store, layout, options) {
	const [root, destroy, content] = createGridCell(layout, layout || {});
	const button = document.createElement('button');
	button.innerText = layout.text || '';
	button.className = 'NeeloongForm-item-button';
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
