/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import createCell from './createCell.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import renderHtml from './renderHtml.mjs';

/**
 *
 * @template T
 * @param {Store<any, any>} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Html} layout
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode?}
 */
export default function FormHtml(store, fieldRenderer, layout, options) {
	const html = layout.html;
	if (!html) { return null; }
	const [root, content] = createCell(options?.signal, layout, store);
	const htmlContent = getHtmlContent(html);
	renderHtml(store, fieldRenderer, htmlContent, options, layout);
	content.appendChild(htmlContent);
	return root;
}
