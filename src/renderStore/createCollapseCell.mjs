import effect from '../effect.mjs';
import bindRequired from './bindRequired.mjs';

/**
 *
 * @param {{label?: string | null; description?: string | null; required?: boolean | null}} [values]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createCollapseCell(values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('details');
	root.className = 'NeeloongForm-item';
	destroyList.push(bindRequired(root, values));

	root.open = true;
	const summary = root.appendChild(document.createElement('summary'));
	destroyList.push(effect(() => summary.innerText = values?.label || ''));

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, root, destroyList];


}
