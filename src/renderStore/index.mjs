/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import Form from './Form.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import renderHtml from './renderHtml.mjs';

/**
 * 
 * @template T
 * @param {Store} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {HTMLElement} root 
 * @param {StoreLayout<T>} layout 
 * @param {StoreLayout.Options & {clone?: boolean} | null} [options]
 * @returns {void}
 */
export default function renderStore(store, fieldRenderer, root, layout, options) {
	if (options?.signal?.aborted) { return; }
	const storeLayout = layout || store.layout;
	const html = storeLayout.html;
	if (!html) {
		Form(store, fieldRenderer, storeLayout, options || null, root);
		return;
	}
	const content = getHtmlContent(html);
	renderHtml(store, fieldRenderer, content, options || null, storeLayout);
	root.appendChild(content);
	options?.signal?.addEventListener('abort', () => {
		root.removeChild(content);
	}, { once: true });
}
