/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */

/**
 * @typedef {object} GridFormItemTemplate
 * @property {string} field
 * @property {GridFormTemplate?} [subFields]
 * @property {number} span
 * @property {string[]} [headers]
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 */
/**
 * @typedef {GridFormItemTemplate[]} GridFormTemplate
 */

/**
 * @typedef {object} Options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [relate]
 */
/**
 * @typedef {(store: Store<any, any>, component: any, Options: Options) => [HTMLElement, () => void]} FieldRenderer
 */
