/** @import { Store } from '../Store/index.mjs' */
/** @import { FieldRenderer, GridFormTemplate } from './types.mjs' */
import Form from './Form.mjs';

/**
 * 
 * @param {Store} store 
 * @param {HTMLElement} root 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFormTemplate?} [template] 
 */
export default function (store, root, fieldRenderer, editable, template) {
	const s = Form(store, fieldRenderer, editable, template || null, {parent: root});
	return s[1];
}
export * from './types.mjs'
