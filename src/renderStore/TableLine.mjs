/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import FormFieldInline from './FormFieldInline.mjs';
import Form from './Form.mjs';
import watch from '../watch.mjs';

/**
 * 
 * @template T
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {object} option 
 * @param {StoreLayout.Column<T>[]} option.columns
 * @param {() => void} option.remove 
 * @param {() => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {StoreLayout.Options?} options
 * @returns {HTMLTableSectionElement}
 */
export default function Line(store, fieldRenderer, layout, {
	columns, deletable,
	remove, dragenter, dragstart, dragend,
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



	let trigger = () => { };
	/** @type {HTMLButtonElement[]} */
	const triggerList = [];
	if (columns.find(v => v.actions?.includes('trigger'))) {
		const form = Form(store, fieldRenderer, layout, options);
		if (form) {
			const body = root.appendChild(document.createElement('tr'));
			const main = body.appendChild(document.createElement('td'));
			main.colSpan = columns.length;
			main.appendChild(form);
			body.hidden = true;
			trigger = () => {
				if (body.hidden) {
					body.hidden = false;
					for (const ext of triggerList) {
						ext.classList.remove('NeeloongForm-table-line-open');
						ext.classList.add('NeeloongForm-table-line-close');
					}
				} else {
					body.hidden = true;
					for (const ext of triggerList) {
						ext.classList.remove('NeeloongForm-table-line-close');
						ext.classList.add('NeeloongForm-table-line-open');
					}
				}
			};
		}
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

	for (const column of columns) {
		const { actions, field, pattern, editable } = column;
		if (!actions?.length) {
			const td = head.appendChild(document.createElement('td'));
			const child = field && store.child(field);
			if (child) {
				const el = FormFieldInline(child, fieldRenderer, column, {...options, editable: options?.editable && (editable !== false)});
				if (el) { td.appendChild(el); }
			}
			continue;
		}
		const handle = head.appendChild(document.createElement('th'));
		handle.classList.add('NeeloongForm-table-line-handle');
		for (const k of actions) {
			switch (k) {
				case 'trigger': {
					const ext = handle.appendChild(document.createElement('button'));
					ext.classList.add('NeeloongForm-table-line-open');
					triggerList.push(ext);
					ext.addEventListener('click', trigger);
					continue;
				}
				case 'move': {
					if (!options?.editable) { continue; }
					const move = handle.appendChild(document.createElement('button'));
					move.classList.add('NeeloongForm-table-move');
					move.addEventListener('pointerdown', pointerdown);
					watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true, options.signal);
					continue;
				}
				case 'remove': {
					if (!options?.editable) { continue; }
					const del = handle.appendChild(document.createElement('button'));
					del.classList.add('NeeloongForm-table-remove');
					del.addEventListener('click', remove);
					watch(() => !deletable.get(), disabled => {
						del.disabled = disabled;
					}, true, options.signal);
					continue;
				}
				case 'serial': {
					const serial = handle.appendChild(document.createElement('span'));
					serial.classList.add('NeeloongForm-table-serial');
					continue;
				}
			}
		}
	}

	return root;
}
