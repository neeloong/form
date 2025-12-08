/** @import { StoreLayout } from '../types.mjs' */

/**
 *
 * @param {HTMLElement} root
 * @param {StoreLayout.Grid?} [layout]
 */
export default function bindGrid(root, layout) {
	const { colStart, colSpan, colEnd, rowStart, rowSpan, rowEnd } = layout || {};
	root.classList.add(`NeeloongForm-item-grid`)
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




}
