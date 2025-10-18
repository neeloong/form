/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import Form from './Form.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import renderHtml from './renderHtml.mjs';

/**
 * 
 * @param {Store} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {HTMLElement} root 
 * @param {StoreLayout?} [layout] 
 * @param {StoreLayout.Options & {clone?: boolean} | null} [options]
 */
export default function renderStore(store, fieldRenderer, root, layout, options) {
	const template = layout?.template;
	if (template) {
		const content = getHtmlContent(template);
		const fields = Object.fromEntries(layout?.fields?.map(v => [v.field, v]) || []);
		const destroy = renderHtml(store, fieldRenderer, content, fields);
		root.appendChild(content);
		return destroy;
	}
	const s = Form(store, fieldRenderer, layout || null, options || null, root);
	return s[1];
}
