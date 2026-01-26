import effect from '../effect.mjs';
import bindErrored from './bindErrored.mjs';
import bindRequired from './bindRequired.mjs';
/** @import { CellValues } from './createCell.mjs' */

/**
 *
 * @param {CellValues} [values]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createCollapseCell(values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('details');
	root.classList.add('NeeloongForm-item');
	destroyList.push(bindRequired(root, values));

	root.open = true;
	const summary = root.appendChild(document.createElement('summary'));
	destroyList.push(effect(() => summary.innerText = values?.label || ''));
	destroyList.push(bindErrored(root, values));

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, root, destroyList];


}
