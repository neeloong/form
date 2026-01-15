/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import FormFieldInline from './FormFieldInline.mjs';
import Form from './Form.mjs';
import watch from '../watch.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {object} option 
 * @param {StoreLayout.Column[]} option.columns
 * @param {() => void} option.remove 
 * @param {() => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {StoreLayout.Options?} options

 * @returns {[HTMLTableSectionElement, () => void]}
 */
export default function Line(store, fieldRenderer, layout, {
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
	if (columns.find(v => v.actions?.includes('trigger'))) {
		const body = root.appendChild(document.createElement('tr'));
		const main = body.appendChild(document.createElement('td'));
		main.colSpan = columns.length;

		const [form, destroy] = Form(store, fieldRenderer, layout, options);
		main.appendChild(form);
		destroyList.push(destroy);
		body.hidden = true;
		trigger = function click() {
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
		const { actions, field, pattern } = name;
		if (!actions?.length) {
			const td = head.appendChild(document.createElement('td'));
			const child = field && store.child(field);
			if (child) {
				const [el, destroy] = FormFieldInline(child, fieldRenderer, null, options);
				destroyList.push(destroy);
				td.appendChild(el);
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
					destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true));
					continue;
				}
				case 'remove': {
					if (!options?.editable) { continue; }
					const del = handle.appendChild(document.createElement('button'));
					del.classList.add('NeeloongForm-table-remove');
					del.addEventListener('click', remove);
					destroyList.push(watch(() => !deletable.get() || store.readonly || store.disabled, disabled => {
						del.disabled = disabled;
					}, true));
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

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}];
}
