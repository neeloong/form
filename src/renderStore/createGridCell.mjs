/** @import { StoreLayout } from '../types.mjs' */
import effect from '../effect.mjs';

/**
 *
 * @param {StoreLayout.Item?} layout
 * @param {{label?: string | null; description?: string | null; required?: boolean | null}} [values]
 * @returns {[HTMLDivElement, () => void, HTMLDivElement, (() => void)[]]}
 */
export default function createGridCell(layout, values) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	const root = document.createElement('div');
	root.className = "NeeloongForm-item";
	const { colStart, colSpan, colEnd, rowStart, rowSpan, rowEnd } = layout || {};
	if (colStart && colEnd) {
		root.style.gridColumn = `${colStart} / ${colEnd}`;
	} else if (colStart && colSpan) {
		root.style.gridColumn = `${colStart} / span ${colSpan}`;
	} else if (colSpan) {
		root.style.gridColumn = `span ${colSpan}`;
	}
	if (rowStart && rowEnd) {
		root.style.gridRow = `${rowStart} / ${rowEnd}`;
	} else if (rowStart && rowSpan) {
		root.style.gridRow = `${rowStart} / span ${rowSpan}`;
	} else if (rowSpan) {
		root.style.gridRow = `span ${rowSpan}`;
	}
	const label = root.appendChild(document.createElement('div'));
	label.className = 'NeeloongForm-item-label';
	destroyList.push(effect(() => label.innerText = values?.label || ''));
	destroyList.push(effect(() => {
		if (values?.required) {
			root.classList.add('NeeloongForm-item-required');
		} else {
			root.classList.remove('NeeloongForm-item-required');
		}
	}));


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
