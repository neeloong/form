/** @import { Store } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFieldLayout, GridFormItemTemplateTableAction } from './types.mjs' */
import FormItem from './FormItem.mjs';
import Form from './Form.mjs';
import watch from '../watch.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFieldLayout?} layout
 * @param {object} option 
 * @param {(string | GridFormItemTemplateTableAction[])[]} option.columns 
 * @param {() => void} option.remove 
 * @param {() => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]

 * @returns {[HTMLTableSectionElement, () => void]}
 */
export default function Line(store, fieldRenderer, editable, layout, {
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

	/** @type {(() => void)[]} */
	const destroyList = [];


	let trigger = () => { };
	/** @type {HTMLButtonElement[]} */
	const triggerList = [];
	if (columns.find(v => Array.isArray(v) && v.includes('trigger'))) {
		const body = root.appendChild(document.createElement('tr'));
		const main = body.appendChild(document.createElement('td'));
		main.colSpan = columns.length;

		const [form, destroy] = Form(store, fieldRenderer, editable, layout, options);
		main.appendChild(form);
		destroyList.push(destroy);
		body.hidden = true;
		trigger = function click() {
			if (body.hidden) {
				body.hidden = false;
				for (const ext of triggerList) {
					ext.classList.remove('NeeloongFormGrid-table-line-open');
					ext.classList.add('NeeloongFormGrid-table-line-close');
				}
			} else {
				body.hidden = true;
				for (const ext of triggerList) {
					ext.classList.remove('NeeloongFormGrid-table-line-close');
					ext.classList.add('NeeloongFormGrid-table-line-open');
				}
			}
		};

	}

	/**
	 * 
	 * @param {PointerEvent} event 
	 */
	function pointerdown({ pointerId }) {
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

	}

	for (const name of columns) {
		if (!Array.isArray(name)) {
			const td = head.appendChild(document.createElement('td'));
			const child = store.child(name);
			if (!child) { continue; }
			const [el, destroy] = FormItem(child, fieldRenderer, editable, null, options, true);
			destroyList.push(destroy);
			td.appendChild(el);
			continue;
		}
		const handle = head.appendChild(document.createElement('th'));
		handle.classList.add('NeeloongFormGrid-table-line-handle');
		for (const k of name) {
			switch (k) {
				case 'trigger': {
					const ext = handle.appendChild(document.createElement('button'));
					ext.classList.add('NeeloongFormGrid-table-line-open');
					triggerList.push(ext);
					ext.addEventListener('click', trigger);
					continue;
				}
				case 'move': {
					if (!editable) { continue; }
					const move = handle.appendChild(document.createElement('button'));
					move.classList.add('NeeloongFormGrid-table-move');
					move.addEventListener('pointerdown', pointerdown);
					destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true));
					continue;
				}
				case 'remove': {
					if (!editable) { continue; }
					const del = handle.appendChild(document.createElement('button'));
					del.classList.add('NeeloongFormGrid-table-remove');
					del.addEventListener('click', remove);
					destroyList.push(watch(() => !deletable.get() || store.readonly || store.disabled, disabled => {
						del.disabled = disabled;
					}, true));
					continue;
				}
				case 'serial': {
					const serial = handle.appendChild(document.createElement('span'));
					serial.classList.add('NeeloongFormGrid-table-serial');
					continue;
				}
			}
		}
	}

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}];
}
