
/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { ArrayStore } from '../Store/index.mjs';

import SubFieldFormItem from './Table.mjs';
import Form from './Form.mjs';
import effect from '../effect.mjs';
import renderHtml from './renderHtml.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import createGridCell from './createGridCell.mjs';


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
	const html = inline ? layout?.inlineHtml : layout?.html;
	if (html) {
		const content = getHtmlContent(html);
		const destroy = renderHtml(store, fieldRenderer, content, options, layout);
		return [content, destroy];
	}
	const { type, component } = store;
	if (inline) {
		return component
			&& fieldRenderer(store, component, options)
			|| [document.createElement('div'), () => { }];
	}
	if (type && typeof type === 'object') {
		/** @type {(() => void)[]} */
		const destroyList = [];
		const root = document.createElement('details');
		root.open = true;
		const summary = root.appendChild(document.createElement('summary'));
		destroyList.push(effect(() => summary.innerText = store.label || ''));
		destroyList.push(effect(() => root.hidden = store.hidden));
		if (typeof component === 'function') {
			const r = fieldRenderer(store, component, options);
			if (r) {
				const [el, destroy] = r;
				root.appendChild(el);
				destroyList.push(destroy);
			}
		} else if (store instanceof ArrayStore) {
			const [table, destroy] = SubFieldFormItem(store, fieldRenderer, layout, options);
			root.appendChild(table);
			destroyList.push(destroy);
		} else {
			const [form, destroy] = Form(store, fieldRenderer, layout, options);
			root.appendChild(form);
			destroyList.push(destroy);
		}
		return [root, () => {
			for (const destroy of destroyList) {
				destroy();
			}
		}];
	}


	const [root, destroy, content, destroyList] = createGridCell(layout, store);
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
