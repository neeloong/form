/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import createCell from './createCell.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import renderHtml from './renderHtml.mjs';

/**
 *
 * @param {Store<any, any>} store
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Html} layout
 * @param {StoreLayout.Options?} options
 * @returns {[ParentNode, () => void]}
 */
export default function FormHtml(store, fieldRenderer, layout, options) {
	const [root, destroy, content, destroyList] = createCell(layout, store);
	const html = layout.html;
	if (!html) { return [root, destroy]; }
	const htmlContent = getHtmlContent(html);
	destroyList.push(renderHtml(store, fieldRenderer, htmlContent, options, layout));
	content.appendChild(htmlContent);
	return [root, destroy];
}
