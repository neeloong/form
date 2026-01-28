
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */

import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode?}
 */
export default function FormFieldInline(store, fieldRenderer, layout, options) {
	if (options?.signal?.aborted) { return null; }
	const html = layout?.inlineHtml;
	if (html) {
		const content = getHtmlContent(html);
		renderHtml(store, fieldRenderer, content, options, layout);
		return content;
	}
	return fieldRenderer(store, options);
}
