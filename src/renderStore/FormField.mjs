
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import SubFieldFormItem from './Table.mjs';
import Form from './Form.mjs';
import effect from '../effect.mjs';
import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import createCollapseCell from './createCollapseCell.mjs';
import bindGrid from './bindGrid.mjs';
import createNullCell from './createNullCell.mjs';
import createCell from './createCell.mjs';
import createStdCell from './createStdCell.mjs';


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
	if (html) {
		const [root, destroy, content, destroyList] = createCell(layout, store, isObject ? 'collapse' : 'base');
		const htmlContent = getHtmlContent(html);
		destroyList.push(renderHtml(store, fieldRenderer, htmlContent, options, layout));
		content.appendChild(htmlContent);
		return [root, destroy];
	}
	if (isObject) {
		const [root, destroy, content, destroyList] = createCollapseCell(store);
		destroyList.push(effect(() => root.hidden = store.hidden));
		if (typeof component === 'function') {
			const r = fieldRenderer(store, component, options);
			if (r) {
				const [el, destroy] = r;
				content.appendChild(el);
				destroyList.push(destroy);
			}
		} else if (store instanceof ArrayStore) {
			const [table, destroy] = SubFieldFormItem(store, fieldRenderer, layout, options);
			content.appendChild(table);
			destroyList.push(destroy);
		} else {
			const [form, destroy] = Form(store, fieldRenderer, layout, options);
			content.appendChild(form);
			destroyList.push(destroy);
		}
		return [root, destroy];
	}


	const [root, destroy, content, destroyList] = layout?.cell === 'base'
		? createNullCell(store)
		: createStdCell(store);
	bindGrid(root, layout);
	destroyList.push(effect(() => root.hidden = store.hidden));
	if (typeof component === 'function') {
		const r = fieldRenderer(store, component, options);
		if (r) {
			const [el, destroy] = r;
			content.appendChild(el);
			destroyList.push(destroy);
		}
	}
	return [root, destroy];
}
