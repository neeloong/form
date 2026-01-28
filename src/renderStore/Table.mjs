/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { Signal } from 'signal-polyfill';
import watch from '../watch.mjs';
import Line from './TableLine.mjs';

/**
 * 
 * @param {AbortSignal | null | undefined} signal 
 * @param {HTMLElement} parent 
 * @param {StoreLayout.Column[]} columns 
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
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {StoreLayout.Field?} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLTableElement?}
 */
export default function Table(store, fieldRenderer, layout, options) {
	if (options?.signal?.aborted) { return null; }
	const headerColumns = layout?.columns;
	const fieldList = Object.entries(store.type || {})
		.filter(([k, v]) => typeof v?.type !== 'object')
		.map(([field, { width, label }]) => ({ field, width, label }));
	/** @type {StoreLayout.Column[]} */
	let columns = [];
	if (Array.isArray(headerColumns)) {
		const map = new Map(fieldList.map(v => [v.field, v]));

		/** @type {(StoreLayout.Column | null)[]} */
		const allColumns = headerColumns.map(v => {
			if (!v) { return null; }
			if (typeof v === 'number') { return { placeholder: v }; }
			if (typeof v === 'string') { return map.get(v) || null; }
			if (typeof v !== 'object') { return null; }
			if (Array.isArray(v)) {
				/** @type {Set<StoreLayout.Action>} */
				const options = new Set(['add', 'move', 'trigger', 'remove', 'serial', 'open', 'collapse']);
				const actions = v.filter(v => options.delete(v));
				if (!actions) { return null; }
				return { actions };
			}
			const { action, actions, field, placeholder, pattern, width, label } = v;
			if (field) {
				const define = map.get(field);
				if (define) {
					return { field, placeholder, width, label: label || define.label };
				}
			}
			const options = new Set(['add', 'move', 'trigger', 'remove', 'serial']);
			const allActions = [action, actions].flat().filter(v => v && options.delete(v));
			if (allActions.length) {
				return { actions: /** @type {StoreLayout.Action[]} */(allActions), width, label };
			}
			// if (pattern) {
			// 	return { pattern, placeholder, width, label };
			// }
			return null;
		});
		columns = /** @type {StoreLayout.Column[]} */(allColumns.filter(Boolean));

	}
	if (!columns.length) {
		columns = [
			{ actions: ['add', 'trigger', 'move', 'remove', 'serial'] },
			...fieldList.slice(0, 3),
		];
	}

	const table = document.createElement('table');
	table.classList.add('NeeloongForm-table');
	const thead = table.appendChild(document.createElement('thead'));

	const addable = new Signal.Computed(() => store.addable);
	const deletable = { get: () => Boolean(options?.editable) };
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
	switch (layout?.tableFoot) {
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
					remove: remove.bind(null, child),
					dragenter: dragenter.bind(null, child),
					dragstart: dragstart.bind(null, child),
					dragend,
					deletable,
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
