/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */


/**
 * @typedef {'add' | 'move' | 'trigger' | 'remove' | 'serial'} GridFormItemTemplateTableAction
 */
/**
 * @typedef {object} GridFieldLayout
 * @property {string} field
 * @property {GridFieldLayout[]?} [fields]
 * @property {'header' | 'add' | 'none'} [tableFoot]
 * @property {(string | GridFormItemTemplateTableAction[])[]} [columns]
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 */
/**
 * @typedef {object} GridLayout
 * @property {GridFieldLayout[]?} [fields]
 */

/**
 * @typedef {object} Options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [relate]
 */
/**
 * @typedef {(store: Store<any, any>, component: any, Options: Options) => [HTMLElement, () => void]} FieldRenderer
 */
