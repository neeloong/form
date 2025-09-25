/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFormItemTemplate } from './types.mjs' */
import FormItem from './FormItem.mjs';
import Form from './Form.mjs';
import watch from '../watch.mjs';

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
		dragenter();
	});
	root.addEventListener('dragstart', (event) => {
		if (event.target !== event.currentTarget) { return; }
		dragstart();
	});
	root.addEventListener('dragend', dragend);
	const head = root.appendChild(document.createElement('tr'));

	const handle = head.appendChild(document.createElement('th'));
	handle.classList.add('NeeloongFormGrid-table-line-handle');
	/** @type {(() => void)[]} */
	const destroyList = [];
	for (const name of columns) {
		const td = head.appendChild(document.createElement('td'));
		const child = store.child(name);
		if (!child) { continue; }
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
	ext.classList.add('NeeloongFormGrid-table-line-open');
	ext.addEventListener('click', () => {
		if (body.hidden) {
			body.hidden = false;
			ext.classList.remove('NeeloongFormGrid-table-line-open');
			ext.classList.add('NeeloongFormGrid-table-line-close');
		} else {
			body.hidden = true;
			ext.classList.remove('NeeloongFormGrid-table-line-close');
			ext.classList.add('NeeloongFormGrid-table-line-open');

		}
	});
	if (editable) {
		const move = handle.appendChild(document.createElement('button'));
		move.classList.add('NeeloongFormGrid-table-move');
		move.addEventListener('pointerdown', ({ pointerId }) => {
			root.draggable = true;
			/** @param {PointerEvent} event */
			function pointerup(event) {
				if (event.pointerId !== pointerId) { return; }
				if (!root) { return; }
				root.draggable = false;
				window.removeEventListener('pointerup', pointerup, { capture: true });
				window.removeEventListener('pointercancel', pointerup, { capture: true });
			}
			window.addEventListener('pointerup', pointerup, { capture: true });
			window.addEventListener('pointercancel', pointerup, { capture: true });
		});
		destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
			move.disabled = disabled;
		}, true));
		const del = handle.appendChild(document.createElement('button'));
		del.classList.add('NeeloongFormGrid-table-remove');
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
