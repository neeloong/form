import effect from '../effect.mjs';
import bindRequired from './bindRequired.mjs';

/**
 *
 * @param {{label?: string | null; description?: string | null; required?: boolean | null}} [values]
 * @returns {[HTMLDivElement, () => void, HTMLDivElement, (() => void)[]]}
 */
export default function createNullCell(values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('div');
	root.className = 'NeeloongForm-item';
	destroyList.push(bindRequired(root, values));


	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, root, destroyList];


}
