/** @import { StoreLayout } from '../types.mjs' */
import bindGrid from './bindGrid.mjs';
import createStdCell from './createStdCell.mjs';
import createCollapseCell from './createCollapseCell.mjs';
import createNullCell from './createNullCell.mjs';

/**
 * @typedef {object} CellValues
 * @property {string?} [label]
 * @property {string?} [description]
 * @property {string?} [error]
 * @property {boolean?} [required]
 */
/**
 *
 * @param {StoreLayout.Item} layout
 * @param {CellValues} [values]
 * @param {string?} [defCell]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createCell(layout, values, defCell) {
	switch (layout.cell || defCell) {
		default: 
		case 'block': return createStdCell(values);
		case 'collapse': return createCollapseCell(values);
		case 'inline': {
			const result = createStdCell(values);
			bindGrid(result[0], layout);
			return result;
		}
		case 'base': {
			const result = createNullCell(values);
			bindGrid(result[0], layout);
			return result;
		}
	}

}
