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
 * @returns {void}
 */
export default function renderStore(store, fieldRenderer, root, layout, options) {
	if (options?.signal?.aborted) { return; }
	const html = layout?.html;
	if (!html) {
		Form(store, fieldRenderer, layout || null, options || null, root);
		return;
	}
	const content = getHtmlContent(html);
	renderHtml(store, fieldRenderer, content, options || null, layout);
	root.appendChild(content);
	options?.signal?.addEventListener('abort', () => {
		root.removeChild(content);
	}, { once: true });
}
