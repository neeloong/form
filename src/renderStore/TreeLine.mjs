/** @import { Store } from '../Store/index.mjs' */
/** @import { State } from './Tree.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import { Signal } from 'signal-polyfill';
import effect from '../effect.mjs';
import FormFieldInline from './FormFieldInline.mjs';
import createButton from './createButton.mjs';

/**
 * 
 * @template T
 * @param {Store<any, any, any>} store 
 * @param {StoreLayout.InspectorStore<T>} inspector 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {Signal.State<State>} state
 * @param {object} option 
 * @param {{get(): boolean}} option.addable 
 * @param {StoreLayout.Column<T>[]} option.columns 
 * @param {() => void} option.remove 
 * @param {() => void} option.removeTree 
 * @param {() => void} option.copy 
 * @param {() => void} option.copyTree 
 * @param {(el: HTMLElement) => () => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {(inChildren?: boolean) => void} option.drop 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {() => void} option.addNode 
 * @param {StoreLayout.Options & {signal: AbortSignal}} options
 * @returns {HTMLElement}
 */
export default function TreeLine(
	store, inspector, fieldRenderer, layout, state, {
		columns, addable, deletable,
		remove, removeTree,
		copy, copyTree,
		dragenter, dragstart, dragend, addNode, drop,
	}, options) {
	const root = document.createElement('div');
	root.addEventListener('dragstart', (event) => {
		if (event.target !== event.currentTarget) { return; }
		dragstart();
	});
	root.addEventListener('dragend', dragend);

	root.classList.add('NeeloongForm-tree-item');

	const shown = new Signal.Computed(() => inspector.is(store));
	effect(() => {
		if (inspector.is(store)) {
			root.classList.add('NeeloongForm-tree-current');
		} else {
			root.classList.remove('NeeloongForm-tree-current');
		}
	}, options.signal);
	effect(() => {
		const level = state.get().level;
		root.style.setProperty(`--NeeloongForm-tree-level`, `${level}`);
	}, options.signal);

	effect(() => { root.hidden = state.get().hidden; }, options.signal);


	const hasChildren = new Signal.Computed(() => state.get().hasChildren);
	const collapsed = new Signal.Computed(() => state.get().collapsed);

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
	function switchCollapsed() {
		const s = state.get();
		s.collapsed = !s.collapsed;
	}
	function open() {
		inspector.set(store);
	}
	function trigger() {
		if (inspector.close(store)) { return; }
		inspector.set(store);
	}
	const moveStart = layout.mainMethod === 'move' ? pointerdown : null;
	const click = moveStart ? null : layout.mainMethod === 'collapse' ? switchCollapsed
		: layout.mainMethod === 'trigger' ? trigger : open;

	const line = root.appendChild(document.createElement('div'));
	line.classList.add('NeeloongForm-tree-line');

	const dropFront = root.appendChild(document.createElement('div'));
	dropFront.classList.add('NeeloongForm-tree-drop');
	const dropChildren = root.appendChild(document.createElement('div'));
	dropChildren.classList.add('NeeloongForm-tree-drop-children');
	dropFront.addEventListener('dragover', (e) => e.preventDefault());
	dropChildren.addEventListener('dragover', (e) => e.preventDefault());
	dropFront.addEventListener('drop', () => drop());
	dropChildren.addEventListener('drop', () => drop(true));
	effect(() => {
		dropFront.hidden = dropChildren.hidden = !state.get().droppable;
	}, options?.signal);

	let dragleave = () => { };
	dropFront.addEventListener('dragenter', () => dragleave = dragenter(dropFront));
	dropChildren.addEventListener('dragenter', () => dragleave = dragenter(dropChildren));
	dropFront.addEventListener('dragleave', () => dragleave());
	dropChildren.addEventListener('dragleave', () => dragleave());

	for (const column of columns) {
		const { actions, pattern, placeholder, width, field, render } = column;
		if (!actions?.length) {
			const td = line.appendChild(document.createElement('div'));
			td.classList.add('NeeloongForm-tree-cell');
			if (click) { td.addEventListener('click', click); }
			if (moveStart) { td.addEventListener('pointerdown', moveStart); }
			if (field || render) {
				const child = field && store.child(field);
				if (field && !child) { continue; }
				const el = render
					? render(child || store, { pattern, signal: options.signal })
					: child && FormFieldInline(child, fieldRenderer, column, { ...options, editable: false }, pattern || null);
				if (el) { td.appendChild(el); }
			}
			if (typeof placeholder === 'number') {
				td.style.flex = `${placeholder}`;
			}
			if (typeof width === 'number') {
				td.style.width = `${width}px`;
			}
			continue;

		}
		for (const type of actions) {
			switch (type) {
				case 'trigger': {
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						disabled: false,
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', trigger);
					continue;
				}
				case 'open': {
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						disabled: false,
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', open);
					continue;
				}
				case 'collapse': {
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !hasChildren.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', switchCollapsed);
					continue;
				}
				case 'move': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return store.readonly || store.disabled; },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('pointerdown', pointerdown);
					continue;
				}
				case 'add': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !addable.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', addNode);
					continue;
				}
				case 'remove': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !deletable.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', remove);
					continue;
				}
				case 'removeTree': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !deletable.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', removeTree);
					continue;
				}
				case 'copy': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !addable.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', copy);
					continue;
				}
				case 'copyTree': {
					if (!options.editable) { continue; }
					/** @type {StoreLayout.Operation} */
					const button = {
						type, component: 'tree', signal: options.signal,
						get disabled() { return !addable.get(); },
						get shown() { return shown.get(); },
						get collapsed() { return collapsed.get(); },
						get hasChildren() { return hasChildren.get(); },
					};
					line.appendChild(
						options.operation?.(button) || createButton(button)
					).addEventListener('click', copyTree);
					continue;
				}
				case 'serial': {
					const serial = line.appendChild(document.createElement('span'));
					serial.classList.add('NeeloongForm-tree-serial');
					continue;
				}
			}
		}
	}

	return root;
}
