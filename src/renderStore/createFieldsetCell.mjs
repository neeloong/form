import effect from '../effect.mjs';
import bindErrored from './bindErrored.mjs';
import bindRequired from './bindRequired.mjs';
/** @import { CellValues } from './createCell.mjs' */

/**
 *
 * @param {CellValues} [values]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createFieldsetCell(values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('fieldset');
	root.className = 'NeeloongForm-item';
	destroyList.push(bindRequired(root, values));

	const legend = root.appendChild(document.createElement('legend'));
	destroyList.push(effect(() => legend.innerText = values?.label || ''));
	destroyList.push(bindErrored(root, values));

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, root, destroyList];


}
