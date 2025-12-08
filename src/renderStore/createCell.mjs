/** @import { StoreLayout } from '../types.mjs' */
import bindGrid from './bindGrid.mjs';
import createStdCell from './createStdCell.mjs';
import createCollapseCell from './createCollapseCell.mjs';
import createNullCell from './createNullCell.mjs';
import createFieldsetCell from './createFieldsetCell.mjs';

/**
 * @typedef {object} CellValues
 * @property {string?} [label]
 * @property {string?} [description]
 * @property {string?} [error]
 * @property {boolean?} [required]
 */
/**
 *
 * @param {StoreLayout.Grid?} [layout]
 * @param {CellValues} [values]
 * @param {StoreLayout.Grid['cell']?} [defCell]
 * @param {boolean?} [blockOnly]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createCell(layout, values, defCell, blockOnly) {
	/**
	 *
	 * @param {string?} [cellType]
	 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]?}
	 */
	function create(cellType) {
		if (!cellType) { return null; }
		if (!blockOnly) {
			switch (cellType) {
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
		switch (cellType) {
			case 'block': return createStdCell(values);
			case 'fieldset': return createFieldsetCell(values);
			case 'collapse': return createCollapseCell(values);
		}
		return null;
	}
	return create(layout?.cell) || create(defCell) || createStdCell(values);
}
