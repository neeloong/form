/** @import { StoreLayout } from '../types.mjs' */
import bindGrid from './bindGrid.mjs';
import createBaseCell from './createBaseCell.mjs';
import createCollapseCell from './createCollapseCell.mjs';
import createNullCell from './createNullCell.mjs';

/**
 *
 * @param {StoreLayout.Item} layout
 * @param {{label?: string | null; description?: string | null; required?: boolean | null}} [values]
 * @param {string?} [defCell]
 * @returns {[HTMLElement, () => void, HTMLElement, (() => void)[]]}
 */
export default function createCell(layout, values, defCell) {
	switch (layout.cell || defCell) {
		default: 
		case 'block': return createBaseCell(values);
		case 'collapse': return createCollapseCell(values);
		case 'inline': {
			const result = createBaseCell(values);
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
