/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import { Signal } from 'signal-polyfill';
import watch from '../watch.mjs';
import Line from './TableLine.mjs';
import { getColumns } from './getColumns.mjs';

/**
 * 
 * @template T
 * @param {AbortSignal | null | undefined} signal 
 * @param {HTMLElement} parent 
 * @param {StoreLayout.Column<T>[]} columns 
 * @param {() => any} add 
 * @param {{get(): boolean}} addable 
 * @param {boolean?} [editable] 
 * @returns {void}
 */
function renderHead(signal, parent, columns, add, addable, editable) {
	const tr = parent.appendChild(document.createElement('tr'));
	for (const { action, actions, width, label } of columns) {
		const th = tr.appendChild(document.createElement('th'));
		if (width) { th.setAttribute('width', `${width}`); }
		if (![action, actions].flat().includes('add')) {
			th.innerText = label || '';
			continue;
		}
		if (!editable) { continue; }
		const button = th.appendChild(document.createElement('button'));
		button.addEventListener('click', add);
		button.classList.add('NeeloongForm-table-add');
		watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true, signal);
	}
}

/**
 *
 * @template T
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLTableElement?}
 */
export default function Table(store, fieldRenderer, layout, options) {
	if (options?.signal?.aborted) { return null; }
	const columns = getColumns(
		store,
		layout,
		['add', 'move', 'trigger', 'remove', 'serial'],
		fields => [
			{ actions: ['add', 'trigger', 'move', 'remove', 'serial'] },
			...fields.slice(0, 3),
		],
	);

	const table = document.createElement('table');
	table.classList.add('NeeloongForm-table');
	const thead = table.appendChild(document.createElement('thead'));

	const addable = new Signal.Computed(() => !store.readonly && !store.disabled && store.addable);
	function add() {
		const data = {};
		store.add(data);
	}
	/**
	 * 
	 * @param {Store} child 
	 */
	function remove(child) {
		store.remove(Number(child.index));
	}
	let dragRow = -1;
	/**
	 * 
	 * @param {Store} [child] 
	 */
	function dragenter(child) {
		if (dragRow < 0) { return; }
		const index = child ? Number(child.index) : store.children.length;
		if (index < 0 || dragRow < 0 || dragRow === index) { return; }
		if (store.move(dragRow, index)) {
			dragRow = index;
		}
	}
	/**
	 * 
	 * @param {Store} child 
	 */
	function dragstart(child) {
		dragRow = Number(child.index);

	}
	function dragend() {
		dragRow = -1;

	}
	renderHead(options?.signal, thead, columns, add, addable, Boolean(options?.editable));
	switch (layout.tableFoot) {
		default:
		case 'header': {
			const tfoot = table.appendChild(document.createElement('tfoot'));
			tfoot.addEventListener('dragenter', () => { dragenter(); });
			renderHead(options?.signal, tfoot, columns, add, addable, Boolean(options?.editable));
			break;
		}
		case 'add': {
			const tfoot = table.appendChild(document.createElement('tfoot'));
			tfoot.addEventListener('dragenter', () => { dragenter(); });
			const tr = tfoot.appendChild(document.createElement('tr'));
			const th = tr.appendChild(document.createElement('th'));
			th.colSpan = columns.length;
			const button = th.appendChild(document.createElement('button'));
			button.addEventListener('click', add);
			button.classList.add('NeeloongForm-table-foot-add');
			watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true, options?.signal);
			break;
		}
		case 'none':
	}
	/** @type {Map<Store, [HTMLTableSectionElement, AbortController]>} */
	let seMap = new Map();
	watch(() => store.children, children => {
		let nextNode = thead.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const ac = new AbortController();
				const el = Line(child, fieldRenderer, layout, {
					columns,
					deletable: new Signal.Computed(() => !store.readonly && !store.disabled && child.removable),
					remove: remove.bind(null, child),
					dragenter: dragenter.bind(null, child),
					dragstart: dragstart.bind(null, child),
					dragend,
				}, {
					...options,
					signal: options?.signal ? AbortSignal.any([options?.signal, ac.signal]) : ac.signal,
				});
				table.insertBefore(el, nextNode);
				seMap.set(child, [el, ac]);
				continue;
			}
			oldSeMap.delete(child);
			seMap.set(child, old);
			if (nextNode === old[0]) {
				nextNode = nextNode.nextSibling;
				continue;
			}
			table.insertBefore(old[0], nextNode);
		}
		for (const [el, ac] of oldSeMap.values()) {
			el.remove();
			ac.abort();
		}
	}, true, options?.signal);

	return table;
}
