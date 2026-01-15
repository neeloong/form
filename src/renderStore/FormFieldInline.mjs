
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
 * @returns {[ParentNode, () => void]}
 */
export default function FormFieldInline(store, fieldRenderer, layout, options) {
	const { component } = store;
	const html = layout?.inlineHtml;
	if (html) {
		const content = getHtmlContent(html);
		const destroy = renderHtml(store, fieldRenderer, content, options, layout);
		return [content, destroy];
	}
	return component
		&& fieldRenderer(store, component, options)
		|| [document.createElement('div'), () => { }];
}
