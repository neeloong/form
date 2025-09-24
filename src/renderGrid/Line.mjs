/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFormItemTemplate } from './types.mjs' */
/** @import { FieldStyle } from '@yongdall/web/types' */
import { watch } from '@neeloong/form';
import FormItem from './FormItem.mjs';
import Form from './Form.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFormItemTemplate?} template
 * @param {object} option 
 * @param {string[]} option.columns 
 * @param {() => void} option.remove 
 * @param {() => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]

 * @returns {[HTMLTableSectionElement, () => void]}
 */
export default function Line(store, fieldRenderer, editable, template, {
	columns, 
	remove, dragenter, dragstart, dragend, deletable
}, options) {
	const root = document.createElement('tbody');
	root.addEventListener('dragenter', () => {
		dragenter()
	})
	root.addEventListener('dragstart', (event) => {
		if (event.target !== event.currentTarget) { return; }
		dragstart()
	})
	root.addEventListener('dragend', dragend)
	const head = root.appendChild(document.createElement('tr'));

	const handle = head.appendChild(document.createElement('th'));
	handle.className = 'button-group'
	/** @type {(() => void)[]} */
	const destroyList = [];
	for (const name of columns) {
		const td = head.appendChild(document.createElement('td'));
		const child = store.child(name);
		if (!child) { continue }
		const [el, destroy] = FormItem(child, fieldRenderer, editable, null, options, true);
		destroyList.push(destroy);
		td.appendChild(el);
	}



	const body = root.appendChild(document.createElement('tr'));
	const main = body.appendChild(document.createElement('td'));
	main.colSpan = columns.length + 1;
	
	const subFields = template?.subFields;
	const [form, destroy] = Form(store, fieldRenderer, editable, Array.isArray(subFields) ? subFields : null, options);
	main.appendChild(form);
	destroyList.push(destroy);



	const ext = handle.appendChild(document.createElement('button'));
			body.hidden = true;
		ext.innerText = '+';
	ext.addEventListener('click', () => {
		if(body.hidden) {
			body.hidden = false;
			ext.innerText = '-';
		} else {
			body.hidden = true;
		ext.innerText = '+';

		}
	})
	if (editable) {
		const move = handle.appendChild(document.createElement('button'));
		move.classList.add('GridForm-table-move');
		move.addEventListener('pointerdown', ({pointerId}) => {
			root.draggable = true;
			/** @param {PointerEvent} event */
			function pointerup(event) {
				if (event.pointerId !== pointerId) { return }
				if (!root) { return }
				root.draggable = false;
				window.removeEventListener('pointerup', pointerup, {capture: true});
				window.removeEventListener('pointercancel', pointerup, {capture: true});
			}
			window.addEventListener('pointerup', pointerup, {capture: true});
			window.addEventListener('pointercancel', pointerup, {capture: true});
		});
		destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
			move.disabled = disabled;
		}, true));
		const del = handle.appendChild(document.createElement('button'));
		del.classList.add('GridForm-table-remove');
		// @ts-ignore
		destroyList.push(watch(() => !deletable.get() || store.readonly || store.disabled, disabled => {
			move.disabled = disabled;
		}, true));
		del.addEventListener('click', remove);
	}
	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}];
}
