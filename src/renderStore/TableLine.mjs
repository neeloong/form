/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import FormFieldInline from './FormFieldInline.mjs';
import Form from './Form.mjs';
import createButton from './createButton.mjs';
import { Signal } from 'signal-polyfill';

/**
 * 
 * @template T
 * @param {Store<any, any, any>} store 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {object} option 
 * @param {StoreLayout.Column<T>[]} option.columns
 * @param {() => void} option.remove 
 * @param {() => void} option.copy 
 * @param {() => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {{get(): boolean}} option.addable 
 * @param {StoreLayout.Options & {signal: AbortSignal}} options
 * @returns {HTMLTableSectionElement}
 */
export default function Line(store, fieldRenderer, layout, {
	columns, deletable, addable,
	remove, copy, dragenter, dragstart, dragend,
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



	const shown = new Signal.State(false);
	let trigger = () => { };
	if (columns.find(v => v.actions?.includes('trigger'))) {
		const form = Form(store, fieldRenderer, layout, options);
		if (form) {
			const body = root.appendChild(document.createElement('tr'));
			const main = body.appendChild(document.createElement('td'));
			main.colSpan = columns.length;
			main.appendChild(form);
			body.hidden = true;
			trigger = () => {
				const hidden = body.hidden;
				body.hidden = !hidden;
				shown.set(hidden);
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
		const { actions, field, pattern, readonly, render } = column;
		if (!actions?.length) {
			const td = head.appendChild(document.createElement('td'));
			const child = field && store.child(field);
			if (field && !child) { continue; }
			const el = render
				? render(child || store, { signal: options.signal })
				: child && FormFieldInline(child, fieldRenderer, column, { ...options, editable: !readonly && options?.editable });
			if (el) { td.appendChild(el); }
			continue;
		}
		const handle = head.appendChild(document.createElement('th'));
		handle.classList.add('NeeloongForm-table-line-handle');
		for (const type of actions) {
			switch (type) {
				case 'trigger': {
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'table', signal: options.signal,
						get disabled() { return false; },
						get shown() { return false; },
						get collapsed() { return false; },
						get hasChildren() { return false; },
					};
					handle.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', trigger);
					continue;
				}
				case 'move': {
					if (!options?.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'table', signal: options.signal,
						get disabled() { return store.readonly || store.disabled; },
						get shown() { return false; },
						get collapsed() { return false; },
						get hasChildren() { return false; },
					};
					handle.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('pointerdown', pointerdown);
					continue;
				}
				case 'remove': {
					if (!options?.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'table', signal: options.signal,
						get disabled() { return !deletable.get(); },
						get shown() { return false; },
						get collapsed() { return false; },
						get hasChildren() { return false; },
					};
					handle.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', remove);
					continue;
				}
				case 'copy': {
					if (!options?.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'table', signal: options.signal,
						get disabled() { return !addable.get(); },
						get shown() { return false; },
						get collapsed() { return false; },
						get hasChildren() { return false; },
					};
					handle.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', copy);
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
