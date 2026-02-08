/** @import { StoreLayout } from '../types.mjs' */
import effect from '../effect.mjs';
import bindGrid from './bindGrid.mjs';

/**
 * @typedef {object} CellValues
 * @property {string?} [label]
 * @property {string?} [description]
 * @property {string?} [error]
 * @property {boolean?} [required]
 */
/**
 *
 * @param {AbortSignal | null | undefined} signal
 * @param {CellValues} [values]
 * @returns {[HTMLDivElement, HTMLDivElement]}
 */
function createStdCell(signal, values) {
	const root = document.createElement('div');
	const label = root.appendChild(document.createElement('div'));
	label.classList.add('NeeloongForm-item-label');
	effect(() => label.innerText = values?.label || '', signal);

	const content = root.appendChild(document.createElement('div'));
	content.classList.add('NeeloongForm-item-content');

	const description = root.appendChild(document.createElement('div'));
	description.classList.add('NeeloongForm-item-description');
	effect(() => description.innerText = values?.description || '', signal);
	const error = root.appendChild(document.createElement('div'));
	error.classList.add('NeeloongForm-item-error');
	effect(() => error.innerText = values?.error || '', signal);
	return [root, content];


}

/**
 *
 * @param {AbortSignal | null | undefined} signal
 * @param {StoreLayout.Grid} layout
 * @param {CellValues} [values]
 * @param {StoreLayout.Grid['cell']?} [defCell]
 * @param {boolean?} [blockOnly]
 * @returns {[HTMLElement, HTMLElement]}
 */
export default function createCell(signal, layout, values, defCell, blockOnly) {
	/**
	 *
	 * @param {string?} [cellType]
	 * @returns {[HTMLElement, HTMLElement]?}
	 */
	function create(cellType) {
		if (!cellType) { return null; }
		if (!blockOnly) {
			switch (cellType) {
				case 'inline': {
					const [root, content] = createStdCell(signal, values);
					bindGrid(root, layout);
					return [root, content];
				}
				case 'base': {
					const root = document.createElement('div');
					bindGrid(root, layout);
					return [root, root];
				}
			}
		}
		switch (cellType) {
			case 'block': return createStdCell(signal, values);
			case 'fieldset': {
				const root = document.createElement('fieldset');
				const legend = root.appendChild(document.createElement('legend'));
				effect(() => legend.innerText = values?.label || '', signal);
				return [root, root];
			}
			case 'collapse': {
				const root = document.createElement('details');
				root.open = true;
				const summary = root.appendChild(document.createElement('summary'));
				effect(() => summary.innerText = values?.label || '', signal);
				return [root, root];
			}
		}
		return null;
	}
	const [root, content] = create(layout.cell) || create(defCell) || createStdCell(signal, values);
	root.classList.add('NeeloongForm-item');
	effect(() => {
		if (values?.error) {
			root.classList.add('NeeloongForm-item-errored');
		} else {
			root.classList.remove('NeeloongForm-item-errored');
		}
	}, signal);
	effect(() => {
		if (values?.required) {
			root.classList.add('NeeloongForm-item-required');
		} else {
			root.classList.remove('NeeloongForm-item-required');
		}
	}, signal);
	return [root, content];
}
