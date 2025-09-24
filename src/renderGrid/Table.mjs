/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { Relatedness } from '../types.mjs' */
/** @import { FieldRenderer, GridFormItemTemplate } from './types.mjs' */
import { Signal, watch } from '@neeloong/form';
import Line from './Line.mjs';

/**
 * 
 * @param {HTMLElement} parent 
 * @param {[string, any][]} columns 
 * @param {() => any} add 
 * @param {{get(): boolean}} addable 
 * @param {boolean?} [editable] 
 */
function renderHead(parent, columns, add, addable, editable) {
	const tr = parent.appendChild(document.createElement('tr'));
	const th = tr.appendChild(document.createElement('th'));
	for (const [, { width, label }] of columns) {
		const td = tr.appendChild(document.createElement('td'));
		if (width) {
			td.setAttribute('width', width);
		}
		td.innerText = label;
	}
	if (!editable) {
		return () => {}
	}
	const button = th.appendChild(document.createElement('button'));
	button.addEventListener('click', add);
	button.classList.add('GridForm-table-add');
	return watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true);
}
/**
 *
 * @param {ArrayStore} store
 * @param {FieldRenderer} fieldRenderer 
 * @param {boolean} editable 
 * @param {GridFormItemTemplate?} template
 * @param {object} options
 * @param {(store: Store, el: Element | Relatedness) => () => void} [options.relate]
 * @returns {[HTMLTableElement, () => void]}
 */
export default function Table(store, fieldRenderer, editable, template, options) {
	const headerColumns = template?.headers

	const fieldList = Object.entries(store.type || {});
	/** @type {typeof fieldList} */
	let columns = [];
	if (headerColumns) {
		const map = new Map(fieldList.map(v => [v[0], v]));
		for (const c of headerColumns) {
			const f = map.get(c);
			if (f) { columns.push(f); }
		}
	}
	if (!columns.length) {
		columns = fieldList
			.filter(([, v]) => v.meta.headOrder)
			.sort(([, a], [, b]) => (a.headOrder || 0) - (b.headOrder || 0));
	}
	if (!columns.length) { columns = fieldList.filter(([k, v]) => typeof v?.type !== 'object').slice(0, 3); }

	const table = document.createElement('table');
	table.className = 'GridForm-table'
	const thead = table.appendChild(document.createElement('thead'));


	const tfoot = table.appendChild(document.createElement('tfoot'));

	const addable = new Signal.Computed(() => store.addable)
	const deletable = { get: () => editable };
	function add() {
		const data = {}
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
	tfoot.addEventListener('dragenter', () => {dragenter()})
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
	renderHead(thead, columns, add, addable, editable);
	renderHead(tfoot, columns, add, addable, editable);
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
	const columnNames = columns.map(([v]) => v);
	const childrenResult = watch(() => store.children, function render(children) {
		let nextNode = thead.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const [el, destroy] = Line(child, fieldRenderer, editable, template, {
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
			console.log(table, old[0], nextNode)
			table.insertBefore(old[0], nextNode);
		}
		destroyMap(oldSeMap);
	}, true);

	return [table, () => {
		start.remove();
		thead.remove();
		destroyMap(seMap);
		childrenResult();
	}];
}
