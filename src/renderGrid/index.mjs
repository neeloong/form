/** @import { Store } from '../Store/index.mjs' */
/** @import { FieldRenderer, GridLayout } from './types.mjs' */
import Form from './Form.mjs';

/**
 * 
 * @param {Store} store 
 * @param {HTMLElement} root 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridLayout?} [layout] 
 */
export default function (store, root, fieldRenderer, editable, layout) {
	const s = Form(store, fieldRenderer, editable, layout || null, {parent: root});
	return s[1];
}
export * from './types.mjs'
