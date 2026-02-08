/** @import { Store } from '../Store/index.mjs' */
/** @import { State } from './Tree.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import watch from '../watch.mjs';
import { Signal } from 'signal-polyfill';
import effect from '../effect.mjs';
import FormFieldInline from './FormFieldInline.mjs';

/**
 * 
 * @template T
 * @param {Store<any, any>} store 
 * @param {Signal.State<Store<any, any>?>} currentStore 
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {Signal.State<State>} state
 * @param {object} option 
 * @param {{get(): boolean}} option.addable 
 * @param {StoreLayout.Column<T>[]} option.columns 
 * @param {() => void} option.remove 
 * @param {(el: HTMLElement) => () => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {(inChildren?: boolean) => void} option.drop 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {() => void} option.addNode 
 * @param {(store: Store<any, any>) => () => void} option.createDetails 
 * @param {StoreLayout.Options?} options
 * @returns {HTMLElement}
 */
export default function TreeLine(
	store, currentStore, fieldRenderer, layout, state, {
		columns, addable, deletable,
		remove, dragenter, dragstart, dragend, addNode, drop, createDetails,
	}, options) {
	const root = document.createElement('div');
	root.addEventListener('dragstart', (event) => {
		if (event.target !== event.currentTarget) { return; }
		dragstart();
	});
	root.addEventListener('dragend', dragend);

	root.classList.add('NeeloongForm-tree-item');

	effect(() => {
		if (currentStore.get() === store) {
			root.classList.add('NeeloongForm-tree-current');
		} else {
			root.classList.remove('NeeloongForm-tree-current');
		}
	}, options?.signal);
	effect(() => {
		const level = state.get().level;
		root.style.setProperty(`--NeeloongForm-tree-level`, `${level}`);
	}, options?.signal);

	effect(() => { root.hidden = state.get().hidden; }, options?.signal);


	/** @type {HTMLButtonElement[]} */
	const collapseList = [];

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
	let close = () => { };
	function open() {
		close = createDetails(store);
	}
	function trigger() {
		if (currentStore.get() === store) {
			close(); return;
		}
		close = createDetails(store);
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
		const { actions, pattern, placeholder, width, field } = column;
		if (!actions?.length) {
			const td = line.appendChild(document.createElement('div'));
			td.classList.add('NeeloongForm-tree-cell');
			if (click) { td.addEventListener('click', click); }
			if (moveStart) { td.addEventListener('pointerdown', moveStart); }
			if (field) {
				const child = store.child(field);
				if (!child) { continue; }
				const el = FormFieldInline(child, fieldRenderer, column, { ...options, editable: false });
				if (el) { td.appendChild(el); }
				continue;
			}
			if (typeof placeholder === 'number') {
				td.style.flex = `${placeholder}`;
			}
			if (typeof width === 'number') {
				td.style.width = `${width}px`;
			}
			continue;

		}
		for (const k of actions) {
			switch (k) {
				case 'trigger': {
					const btn = line.appendChild(document.createElement('button'));
					btn.classList.add('NeeloongForm-tree-trigger');
					btn.addEventListener('click', trigger);
					continue;
				}
				case 'open': {
					const btn = line.appendChild(document.createElement('button'));
					btn.classList.add('NeeloongForm-tree-open');
					btn.addEventListener('click', open);
					continue;
				}
				case 'collapse': {
					const btn = line.appendChild(document.createElement('button'));
					btn.classList.add('NeeloongForm-tree-collapse');
					btn.addEventListener('click', switchCollapsed);
					collapseList.push(btn);
					continue;
				}
				case 'move': {
					if (!options?.editable) { continue; }
					const move = line.appendChild(document.createElement('button'));
					move.classList.add('NeeloongForm-tree-move');
					move.addEventListener('pointerdown', pointerdown);
					watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true, options.signal);
					continue;
				}
				case 'add': {
					if (!options?.editable) { continue; }
					const move = line.appendChild(document.createElement('button'));
					move.classList.add('NeeloongForm-tree-add');
					move.addEventListener('click', addNode);
					watch(() => !addable.get(), disabled => {
						move.disabled = disabled;
					}, true, options.signal);
					continue;
				}
				case 'remove': {
					if (!options?.editable) { continue; }
					const del = line.appendChild(document.createElement('button'));
					del.classList.add('NeeloongForm-tree-remove');
					del.addEventListener('click', remove);
					watch(() => !deletable.get(), disabled => {
						del.disabled = disabled;
					}, true, options.signal);
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
	effect(() => {
		const s = state.get();
		if (!s.hasChildren) {
			for (const btn of collapseList) {
				btn.classList.remove('NeeloongForm-tree-collapse-close');
				btn.classList.remove('NeeloongForm-tree-collapse-open');
				btn.disabled = true;
			}
		} else if (s.collapsed) {
			for (const btn of collapseList) {
				btn.classList.remove('NeeloongForm-tree-collapse-close');
				btn.classList.add('NeeloongForm-tree-collapse-open');
				btn.disabled = false;
			}
		} else {
			for (const btn of collapseList) {
				btn.classList.remove('NeeloongForm-tree-collapse-open');
				btn.classList.add('NeeloongForm-tree-collapse-close');
				btn.disabled = false;
			}
		}
	}, options?.signal);

	return root;
}
