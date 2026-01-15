/** @import { Store } from '../Store/index.mjs' */
/** @import { State } from './Tree.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import watch from '../watch.mjs';
import { Signal } from 'signal-polyfill';
import effect from '../effect.mjs';
import FormFieldInline from './FormFieldInline.mjs';

/**
 * 
 * @param {Store<any, any>} store 
 * @param {Signal.State<Store<any, any>?>} currentStore 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {State} initState
 * @param {object} option 
 * @param {StoreLayout.Column[]} option.columns 
 * @param {() => void} option.remove 
 * @param {(el: HTMLElement) => () => void} option.dragenter 
 * @param {() => void} option.dragstart 
 * @param {(inChildren?: boolean) => void} option.drop 
 * @param {() => void} option.dragend 
 * @param {{get(): boolean}} option.deletable 
 * @param {() => void} option.addNode 
 * @param {(store: Store<any, any>) => () => void} option.createDetails 
 * @param {StoreLayout.Options?} options

 * @returns {[HTMLElement, () => void, (s: State) => void]}
 */
export default function TreeLine(
	store, currentStore, fieldRenderer, layout, initState, {
		columns,
		remove, dragenter, dragstart, dragend, deletable, addNode, drop, createDetails,
	}, options) {
	const state = new Signal.State(initState);
	const root = document.createElement('div');
	root.addEventListener('dragstart', (event) => {
		if (event.target !== event.currentTarget) { return; }
		dragstart();
	});
	root.addEventListener('dragend', dragend);

	/** @type {(() => void)[]} */
	const destroyList = [];
	root.classList.add('NeeloongForm-tree-item');

	destroyList.push(effect(() => {
		if (currentStore.get() === store) {
			root.classList.add('NeeloongForm-tree-current');
		} else {
			root.classList.remove('NeeloongForm-tree-current');
		}
	}));
	destroyList.push(effect(() => {
		const level = state.get().level;
		root.style.setProperty(`--NeeloongForm-tree-level`, `${level}`);
	}));

	destroyList.push(effect(() => { root.hidden = state.get().hidden; }));


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
	const moveStart = layout?.mainMethod === 'move' ? pointerdown : null;
	const click = moveStart ? null : layout?.mainMethod === 'collapse' ? switchCollapsed
		: layout?.mainMethod === 'trigger' ? trigger : open;

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
	destroyList.push(effect(() => {
		dropFront.hidden = dropChildren.hidden = !state.get().droppable;
	}));

	let dragleave = () => { };
	dropFront.addEventListener('dragenter', () => dragleave = dragenter(dropFront));
	dropChildren.addEventListener('dragenter', () => dragleave = dragenter(dropChildren));
	dropFront.addEventListener('dragleave', () => dragleave());
	dropChildren.addEventListener('dragleave', () => dragleave());

	for (const { actions, pattern, placeholder, width, field } of columns) {
		if (!actions?.length) {
			const td = line.appendChild(document.createElement('div'));
			td.classList.add('NeeloongForm-tree-cell');
			if (click) { td.addEventListener('click', click); }
			if (moveStart) { td.addEventListener('pointerdown', moveStart); }
			if (field) {
				const child = store.child(field);
				if (!child) { continue; }
				const [el, destroy] = FormFieldInline(child, fieldRenderer, null, { ...options, editable: false });
				destroyList.push(destroy);
				td.appendChild(el);
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
					destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true));
					continue;
				}
				case 'add': {
					if (!options?.editable) { continue; }
					const move = line.appendChild(document.createElement('button'));
					move.classList.add('NeeloongForm-tree-add');
					move.addEventListener('click', addNode);
					destroyList.push(watch(() => store.readonly || store.disabled, disabled => {
						move.disabled = disabled;
					}, true));
					continue;
				}
				case 'remove': {
					if (!options?.editable) { continue; }
					const del = line.appendChild(document.createElement('button'));
					del.classList.add('NeeloongForm-tree-remove');
					del.addEventListener('click', remove);
					destroyList.push(watch(() => !deletable.get() || store.readonly || store.disabled, disabled => {
						del.disabled = disabled;
					}, true));
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
	destroyList.push(effect(() => {
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
	}));

	return [root, () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}, s => state.set(s)];
}
