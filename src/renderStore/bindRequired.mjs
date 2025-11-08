import effect from '../effect.mjs';

/**
 *
 * @param {HTMLElement} root
 * @param {{ required?: boolean | null }} [values]
 * @returns {() => void}
 */
export default function bindRequired(root, values) {
	return effect(() => {
		if (values?.required) {
			root.classList.add('NeeloongForm-item-required');
		} else {
			root.classList.remove('NeeloongForm-item-required');
		}
	});
}
