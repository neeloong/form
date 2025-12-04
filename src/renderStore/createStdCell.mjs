import effect from '../effect.mjs';
import bindErrored from './bindErrored.mjs';
import bindRequired from './bindRequired.mjs';
/** @import { CellValues } from './createCell.mjs' */

/**
 *
 * @param {CellValues} [values]
 * @returns {[HTMLDivElement, () => void, HTMLDivElement, (() => void)[]]}
 */
export default function createStdCell(values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('div');
	root.className = 'NeeloongForm-item';
	destroyList.push(bindRequired(root, values));

	const label = root.appendChild(document.createElement('div'));
	label.className = 'NeeloongForm-item-label';
	destroyList.push(effect(() => label.innerText = values?.label || ''));

	const content = root.appendChild(document.createElement('div'));
	content.className = 'NeeloongForm-item-content';

	const description = root.appendChild(document.createElement('div'));
	description.className = 'NeeloongForm-item-description';
	destroyList.push(effect(() => description.innerText = values?.description || ''));
	const error = root.appendChild(document.createElement('div'));
	error.className = 'NeeloongForm-item-error';
	destroyList.push(effect(() => error.innerText = values?.error || ''));
	destroyList.push(bindErrored(root, values));

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, content, destroyList];


}
