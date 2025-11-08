import effect from '../effect.mjs';
import bindRequired from './bindRequired.mjs';

/**
 *
 * @param {{label?: string | null; description?: string | null; required?: boolean | null}} [values]
 * @returns {[HTMLDivElement, () => void, HTMLDivElement, (() => void)[]]}
 */
export default function createBaseCell(values) {
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

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, content, destroyList];


}
