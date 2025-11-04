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
	const html = layout?.html;
	if (html) {
		const content = getHtmlContent(html);
		const destroy = renderHtml(store, fieldRenderer, content, options || null, layout);
		root.appendChild(content);
		return destroy;
	}
	const s = Form(store, fieldRenderer, layout || null, options || null, root);
	return s[1];
}
