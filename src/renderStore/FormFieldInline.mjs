
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */

import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';

/**
 * 
 * @template T
 * @param {Store<any, any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode?}
 */
export default function FormFieldInline(store, fieldRenderer, layout, options) {
	if (options?.signal?.aborted) { return null; }
	const html = layout.html;
	if (html) {
		const content = getHtmlContent(html);
		renderHtml(store, fieldRenderer, content, options, layout);
		return content;
	}
	return fieldRenderer(store, layout.renderer, options);
}
