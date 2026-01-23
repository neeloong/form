
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import Table from './Table.mjs';
import Form from './Form.mjs';
import effect from '../effect.mjs';
import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import createCell from './createCell.mjs';
import Tree from './Tree.mjs';


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
 * @param {StoreLayout.Field['arrayStyle']?} arrayStyle 
 */
function getArrayCell(arrayStyle) {
	switch(arrayStyle) {
		case 'tree': return Tree;
		default: return Table;
	}

}

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {StoreLayout.Options?} options
 * @returns {[ParentNode, () => void]}
 */
export default function FormField(store, fieldRenderer, layout, options) {
	const { type } = store;
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
		|| fieldRenderer(store, options)
		|| store instanceof ArrayStore && getArrayCell(layout?.arrayStyle)(store, fieldRenderer, layout, options)
		|| isObject && Form(store, fieldRenderer, layout, options);
	if (r) {
		const [el, destroy] = r;
		content.appendChild(el);
		destroyList.push(destroy);
	}
	return [root, destroy];
}
