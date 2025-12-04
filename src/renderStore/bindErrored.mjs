import effect from '../effect.mjs';
/** @import { CellValues } from './createCell.mjs' */

/**
 *
 * @param {HTMLElement} root
 * @param {CellValues} [values]
 * @returns {() => void}
 */
export default function bindErrored(root, values) {
	return effect(() => {
		if (values?.error) {
			root.classList.add('NeeloongForm-item-errored');
		} else {
			root.classList.remove('NeeloongForm-item-errored');
		}
	});
}
