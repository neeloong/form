/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFieldLayout, GridFormItemTemplateTableAction } from './types.mjs' */
import { Signal } from 'signal-polyfill';
import watch from '../watch.mjs';
import Line from './Line.mjs';

/**
 * 
 * @param {HTMLElement} parent 
 * @param {({ field: string; width: any; label: any; } | GridFormItemTemplateTableAction[])[]} columns 
 * @param {() => any} add 
 * @param {{get(): boolean}} addable 
 * @param {boolean?} [editable] 
 */
function renderHead(parent, columns, add, addable, editable) {
	const tr = parent.appendChild(document.createElement('tr'));
	/** @type {(() => void)[]} */
	const destroyList = [];
	for (const col of columns) {
		if (!Array.isArray(col)) {
			const { width, label } = col;
				const td = tr.appendChild(document.createElement('th'));
				if (width) {
					td.setAttribute('width', width);
				}
				td.innerText = label;
			continue;
		}
		const th = tr.appendChild(document.createElement('th'));
		if (!editable) { continue; }
		for (const it of col) {
			switch (it) {
				case 'add':
					const button = th.appendChild(document.createElement('button'));
					button.addEventListener('click', add);
					button.classList.add('NeeloongFormGrid-table-add');
					destroyList.push(watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true));
					continue;
			}
		}
	}
	return () => {
		for (const destroy of destroyList) {
			destroy();
		}
	};
}
/**
 *
 * @param {ArrayStore} store
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFieldLayout?} layout
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]
 * @returns {[HTMLTableElement, () => void]}
 */
export default function Table(store, fieldRenderer, editable, layout, options) {
	const headerColumns = layout?.columns;
	const fieldList = Object.entries(store.type || {})
		.filter(([k, v]) => typeof v?.type !== 'object')
		.map(([field, {width, label}]) => ({field, width, label}));
	/** @type {({ field: string; width: any; label: any; } | GridFormItemTemplateTableAction[])[]} */
	let columns = [];
	if (Array.isArray(headerColumns)) {
		const map = new Map(fieldList.map(v => [v.field, v]));
		columns = headerColumns.map(v => {
			if (typeof v === 'string') { return map.get(v) || [] }
			if (!Array.isArray(v)) { return []; }
			/** @type {Set<GridFormItemTemplateTableAction>} */
			const options = new Set(['add', 'move', 'trigger', 'remove', 'serial']);
			return v.filter(v => options.delete(v));
		}).filter(v => !Array.isArray(v) || v.length)
	}
	if (!columns.length) {
		columns = [['add', 'trigger', 'move', 'remove', 'serial']];
	}
	if (!columns.find(v => !Array.isArray(v))) {
		columns.push(...fieldList.slice(0, 3));
	}



	const table = document.createElement('table');
	table.className = 'NeeloongFormGrid-table';
	const thead = table.appendChild(document.createElement('thead'));



	const addable = new Signal.Computed(() => store.addable);
	const deletable = { get: () => editable };
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
	/** @type {(() => void)[]} */
	const destroyList = [];
	destroyList.push(renderHead(thead, columns, add, addable, editable));
	switch (layout?.tableFoot) {
		default:
		case 'header': {
			const tfoot = table.appendChild(document.createElement('tfoot'));
			tfoot.addEventListener('dragenter', () => { dragenter(); });
			destroyList.push(renderHead(tfoot, columns, add, addable, editable));
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
			button.classList.add('NeeloongFormGrid-table-foot-add');
			destroyList.push(watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true));
			break;
		}
		case 'none':
	}
	const start = thead;
	/** @type {Map<Store, [HTMLTableSectionElement, () => void]>} */
	let seMap = new Map();
	/** @param {Map<Store, [tbody: HTMLTableSectionElement, destroy: () => void]>} map */
	function destroyMap(map) {
		for (const [el, destroy] of map.values()) {
			destroy();
			el.remove();
		}

	}
	const columnNames = columns.map((v) => Array.isArray(v) ? v : v.field);
	const childrenResult = watch(() => store.children, function render(children) {
		let nextNode = thead.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const [el, destroy] = Line(child, fieldRenderer, editable, layout, {
					columns: columnNames,
					remove: remove.bind(null, child),
					dragenter: dragenter.bind(null, child),
					dragstart: dragstart.bind(null, child),
					dragend,
					deletable,
				}, options);
				table.insertBefore(el, nextNode);
				seMap.set(child, [el, destroy]);
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
		destroyMap(oldSeMap);
	}, true);

	return [table, () => {
		start.remove();
		thead.remove();
		destroyMap(seMap);
		childrenResult();
		for (const destroy of destroyList) {
			destroy();
		}
	}];
}
