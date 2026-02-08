
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
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
 * @template T
 * @param {string | ParentNode} html 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Options?} options
 * @param {StoreLayout.Field<T>} layout
 * @returns {ParentNode}
 */
function Html(html, store, fieldRenderer, options, layout) {
	const htmlContent = getHtmlContent(html);
	renderHtml(store, fieldRenderer, htmlContent, options, layout);
	return htmlContent;
}
/**
 * 
 * @template T
 * @param {StoreLayout.Field<T>['arrayStyle']?} arrayStyle 
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLElement?}
 */
function renderArrayCell(arrayStyle, store, fieldRenderer, layout, options) {
	switch (arrayStyle) {
		case 'tree': return Tree(store, fieldRenderer, layout, options);
		default: return Table(store, fieldRenderer, layout, options);
	}

}

/**
 * 
 * @template T
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {ParentNode}
 */
export default function FormField(store, fieldRenderer, layout, options) {
	const { type } = store;
	const isObject = Boolean(type && typeof type === 'object');
	const html = layout.html;
	/** @type {StoreLayout.Grid['cell']} */
	const cellType = isObject
		? store instanceof ArrayStore ? 'collapse' : 'fieldset'
		: html ? 'base' : 'inline';
	const [root, content] = createCell(options?.signal, layout, store, cellType, isObject);
	effect(() => root.hidden = store.hidden, options?.signal);

	/** @type {false | ParentNode | null} */
	const r =
		html && Html(html, store, fieldRenderer, options, layout)
		|| fieldRenderer(store, layout.renderer, options)
		|| store instanceof ArrayStore && renderArrayCell(layout.arrayStyle, store, fieldRenderer, layout, options)
		|| isObject && Form(store, fieldRenderer, layout, options);
	if (r) {
		content.appendChild(r);
	}
	return root;
}
