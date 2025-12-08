
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import SubFieldFormItem from './Table.mjs';
import Form from './Form.mjs';
import effect from '../effect.mjs';
import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import createCell from './createCell.mjs';


/**
 * 
 * @param {string | ParentNode} html 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Options?} options
 * @param {StoreLayout.Field?} layout
 * @returns 
 */
function Html(html, store, fieldRenderer, options, layout) {
	const htmlContent = getHtmlContent(html);
	const destroy = renderHtml(store, fieldRenderer, htmlContent, options, layout);
	return [htmlContent, destroy];
}

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {StoreLayout.Options?} options
 * @param {boolean} [inline]
 * @returns {[ParentNode, () => void]}
 */
export default function FormField(store, fieldRenderer, layout, options, inline = false) {
	const { type, component } = store;
	if (inline) {
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
	const isObject = type && typeof type === 'object';
	const html = layout?.html;
	/** @type {StoreLayout.Grid['cell']} */
	const cellType = isObject
		? store instanceof ArrayStore ? 'collapse' : 'fieldset'
		: html ? 'base' : 'inline';
	const [root, destroy, content, destroyList] = createCell(layout, store, cellType, isObject);
	destroyList.push(effect(() => root.hidden = store.hidden));

	const r =
		html && Html(html, store, fieldRenderer, options, layout)
		|| typeof component === 'function' && fieldRenderer(store, component, options)
		|| store instanceof ArrayStore && SubFieldFormItem(store, fieldRenderer, layout, options)
		|| isObject && Form(store, fieldRenderer, layout, options);
	if (r) {
		const [el, destroy] = r;
		content.appendChild(el);
		destroyList.push(destroy);
	}
	return [root, destroy];
}
