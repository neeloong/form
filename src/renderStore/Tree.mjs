/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import { Signal } from 'signal-polyfill';
import watch from '../watch.mjs';
import Line from './TreeLine.mjs';
import Form from './Form.mjs';

const verticalWritingMode = new Set([
	'vertical-lr', 'vertical-rl', 'sideways-lr', 'sideways-rl',
]);
/**
 *
 * @param {Element} root
 * @returns {[boolean, boolean]}
 */
function getLayout(root) {
	const style = getComputedStyle(root);
	const writingMode = style.writingMode?.toLowerCase();
	const vertical = verticalWritingMode.has(writingMode);
	const reverse = style.direction.toLowerCase() === 'rtl' !== (writingMode === 'sideways-lr');
	return [vertical, reverse];
}

/**
 * @typedef {object} State
 * @property {number} level
 * @property {number} levelValue
 * @property {boolean} collapsed
 * @property {boolean} hidden
 * @property {boolean} droppable
 * @property {Set<number>} parents
 * @property {boolean} hasChildren
 */

/**
 * 
 * @param {ArrayStore} store
 * @param {State[]} states
 * @param {Signal.State<number>} drag
 * @param {string} levelKey
 * @param {*} index 
 * @returns {State}
 */
function createState(store, states, drag, levelKey, index) {
	const levelValue = new Signal.Computed(() => {
		const child = store.child(index);
		if (!child) { return 0; }
		return Math.max(0, Math.floor(child.value?.[levelKey]) || 0);
	});
	const parentIndex = new Signal.Computed(() => {
		const child = store.child(index);
		if (!child) { return -1; }
		const level = levelValue.get();
		if (!level) { return -1; }
		for (let k = index - 1; k >= 0; k--) {
			if (level > states[k]?.levelValue) { return k; }
		}
		return -1;
	});
	const hasChildren = new Signal.Computed(() => {
		const children = store.children;
		const next = children[index + 1];
		if (!next) { return false; }
		const child = children[index];
		if (!child) { return false; }
		const level = levelValue.get();
		return Math.floor(next.child(levelKey)?.value) > level;
	});
	const droppable = new Signal.Computed(() => {
		const dragRow = drag.get();
		if (dragRow === index) { return false; }
		const pIndex = parentIndex.get();
		const parent = states[pIndex];
		if (!parent) { return true; }
		return parent.droppable;
	});
	const level = new Signal.Computed(() => {
		const pIndex = parentIndex.get();
		const parent = states[pIndex];
		if (!parent) { return 0; }
		return parent.level + 1;
	});
	const collapsed = new Signal.State(false);
	const hidden = new Signal.Computed(() => {
		const pIndex = parentIndex.get();
		const parent = states[pIndex];
		if (!parent) { return false; }
		return parent.collapsed || parent.hidden;
	});
	/** @type {Signal.Computed<Set<number>>} */
	const parents = new Signal.Computed(() => {
		const pIndex = parentIndex.get();
		const parent = states[pIndex];
		if (!parent) { return new Set(); }
		const set = new Set(parent.parents);
		set.add(pIndex);
		return set;
	});
	return {
		get level() { return level.get(); },
		get levelValue() { return levelValue.get(); },
		get collapsed() { return collapsed.get(); },
		set collapsed(v) { collapsed.set(v); },
		get hidden() { return hidden.get(); },
		get hasChildren() { return hasChildren.get(); },
		get droppable() { return droppable.get(); },
		get parents() { return parents.get(); },
	};
}
/**
 *
 * @template T
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>?} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLElement?}
 */
export default function Tree(store, fieldRenderer, layout, options) {
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
			const options = new Set(['add', 'move', 'trigger', 'remove', 'serial', 'open', 'collapse']);
			const allActions = [action, actions].flat().filter(v => v && options.delete(v));
			if (allActions.length) {
				return { actions: /** @type {StoreLayout.Action[]} */(allActions), width, label };
			}
			if (pattern) {
				return { pattern, placeholder, width, label };
			}
			if (placeholder || width) {
				return { placeholder, width, label };
			}
			return null;
		});
		columns = /** @type {StoreLayout.Column[]} */(allColumns.filter(Boolean));
	}
	if (!columns.length) {
		columns = [
			{ actions: ['collapse', 'move'] },
			fieldList[0],
			{ actions: ['add', 'remove'] },
		];
	}


	const root = document.createElement('div');
	root.classList.add('NeeloongForm-tree');
	const main = root.appendChild(document.createElement('div'));
	main.classList.add('NeeloongForm-tree-main');
	const splitter = root.appendChild(document.createElement('div'));
	splitter.classList.add('NeeloongForm-tree-splitter');
	const details = root.appendChild(document.createElement('div'));
	details.classList.add('NeeloongForm-tree-details');
	splitter.hidden = true;
	details.hidden = true;
	/** @type {number?} */
	let splitterPointerId = null;
	let splitterOffset = 0;
	function stopMove() {
		const pointerId = splitterPointerId;
		if (pointerId === null) { return; }
		splitterPointerId = null;
		splitter.releasePointerCapture(pointerId);
	}

	splitter.addEventListener('pointerdown', e => {
		const { pointerId } = e;
		if (![null, pointerId].includes(splitterPointerId)) { return; }
		splitterPointerId = pointerId;
		splitter.setPointerCapture(pointerId);
		switch (getLayout(splitter).map((v, i) => v ? 2 ** i : 0).reduce((a, b) => a + b)) {
			case 0: splitterOffset = -e.offsetX; break;
			case 1: splitterOffset = -e.offsetY; break;
			case 2: splitterOffset = e.offsetX - splitter.offsetWidth; break;
			case 3: splitterOffset = e.offsetY - splitter.offsetHeight; break;
		}
	});
	/**
	 * @param {boolean} vertical
	 * @returns {number}
	 */
	const getSize = vertical => vertical
		? root.clientHeight - splitter.offsetHeight
		: root.clientWidth - splitter.offsetWidth;
	/** @param {PointerEvent} e */
	const updateMove = e => {
		const [vertical, reverse] = getLayout(splitter);
		let os = 0;
		switch ([vertical, reverse].map((v, i) => v ? 2 ** i : 0).reduce((a, b) => a + b)) {
			case 0: os = e.clientX - root.getBoundingClientRect().left; break;
			case 1: os = e.clientY - root.getBoundingClientRect().top; break;
			case 2: os = root.getBoundingClientRect().right - e.clientX; break;
			case 3: os = root.getBoundingClientRect().bottom - e.clientY; break;
		}
		const value = 1 - Math.max(0, Math.min((os + splitterOffset) / getSize(vertical), 1));
		details.style.inlineSize = `${value * 100}%`;
	};
	splitter.addEventListener('pointermove', e => {
		const { pointerId } = e;
		if (!splitter.hasPointerCapture(pointerId)) { return; }
		updateMove(e);
	});
	splitter.addEventListener('pointerup', e => {
		const { pointerId } = e;
		if (pointerId !== splitterPointerId) { return; }
		updateMove(e);
		stopMove();
	});
	splitter.addEventListener('pointercancel', e => {
		const { pointerId } = e;
		if (pointerId !== splitterPointerId) { return; }
		updateMove(e);
		stopMove();
	});


	/** @type {AbortController?} */
	let detailAbortController = null;
	const detailsStore = new Signal.State(/** @type{Store<any, any>?}*/(null));
	/**
	 * 
	 * @param {Store<any, any>} store 
	 * @returns 
	 */
	function createDetails(store) {
		if (options?.signal?.aborted) { return () => { }; }
		if (detailsStore.get() === store && detailAbortController) {
			const ac = detailAbortController;
			return () => { ac.abort(); };
		}
		detailAbortController?.abort();
		detailsStore.set(store);
		const ac = new AbortController();
		detailAbortController = ac;
		const signal = options?.signal ? AbortSignal.any([options?.signal, ac.signal]) : ac.signal;
		const form = Form(store, fieldRenderer, layout, {
			...options,
			signal: options?.signal ? AbortSignal.any([options?.signal, signal]) : signal,
		});
		signal.addEventListener('abort', () => {
			detailsStore.set(null);
			stopMove();
		}, { once: true });
		if (form) {
			details.appendChild(form);
			details.hidden = false;
			splitter.hidden = false;
			signal.addEventListener('abort', () => {
				form.remove();
				splitter.hidden = true;
				details.hidden = true;
			}, { once: true });

		}
		return () => { ac.abort(); };

	}


	const levelKey = layout?.levelKey || 'level';
	const addable = new Signal.Computed(() => !store.readonly && !store.disabled && store.addable);
	/**
	 * 
	 * @param {number} parent 
	 */
	function addNode(parent) {
		/** @type {Record<string, any>} */
		const data = {};
		if (parent === -2) {
			data[levelKey] = 0;
			store.add(data);
			return;
		}
		data[levelKey] = (states[parent]?.levelValue ?? -1) + 1;
		store.insert(parent + 1, data);

	}
	/**
	 * 
	 * @param {Store} child 
	 */
	function remove(child) {
		store.remove(Number(child.index));
	}
	let dragRow = -1;
	let drag = new Signal.State(dragRow);
	/**
	 * 
	 * @param {Store} [child] 
	 * @param {boolean} [inChildren] 
	 */
	function getLevel(child, inChildren) {
		if (!child) { return 0; }
		const newLevel = Number(states[Number(child.index)]?.levelValue) || 0;
		if (!inChildren) { return newLevel; }
		return newLevel + 1;
	}
	/**
	 * 
	 * @param {number} start 
	 */
	function getQuantity(start) {
		let last = start + 1;
		const level = states[dragRow]?.level ?? 0;
		for (; (states[last]?.level ?? -1) > level; last++) { }
		return last - dragRow;
	}
	/**
	 * 
	 * @param {Store} [child] 
	 * @param {boolean} [inChildren] 
	 */
	function drop(child, inChildren) {
		if (dragRow < 0) { return; }
		const newLevel = Number(getLevel(child, inChildren)) || 0;
		let quantity = getQuantity(dragRow);
		let index = -1;
		if (child) {
			index = Number(child.index);
			if (dragRow === index || states[index]?.parents?.has(dragRow)) { return; }
			if (inChildren || index !== dragRow + quantity) {
				if (inChildren) {
					for (const currentLevel = states[index]?.level || 0; states[index + 1]?.level > currentLevel; index++);
					if (index < dragRow) { index += 1; }
				} else {
					if (index > dragRow) { index -= 1; }
				}
				if (index < 0) { return; }
			} else {
				index = -1;
			}

		} else {
			index = states.length - 1;
			if (index < 0) { return; }
		}
		if (index >= 0 && dragRow !== index) {
			quantity = store.move(dragRow, index, quantity);
			if (!quantity) { return; }
			dragRow = quantity > 1 && index > dragRow ? index - quantity + 1 : index;
			drag.set(dragRow);
		}
		const levelSub = Array(quantity).fill(states[dragRow]?.level ?? 0).map((l, i) => Math.max((states[i + dragRow]?.level ?? 0) - l, 0));
		for (let i = 0; i < quantity; i++) {
			const c = store.children[dragRow + i]?.child(levelKey);
			if (c) {
				c.value = newLevel + levelSub[i];
			}
		}


	}
	/**
	 * 
	 * @param {Store} child 
	 */
	function dragstart(child) {
		dragRow = Number(child.index);
		drag.set(dragRow);
		main.classList.add('NeeloongForm-tree-moving');

	}
	/** @type {HTMLElement?} */
	let dragenterEl = null;
	/** @param {HTMLElement} el */
	function dragenter(el) {
		if (dragRow === -1) { return () => { }; }
		dragenterEl?.classList.remove('NeeloongForm-tree-drag-over');
		dragenterEl = el;
		dragenterEl?.classList.add('NeeloongForm-tree-drag-over');
		return () => {
			if (dragenterEl !== el) { return; }
			dragenterEl?.classList.remove('NeeloongForm-tree-drag-over');
			dragenterEl = null;
		};

	}
	function dragend() {
		dragRow = -1;
		drag.set(dragRow);
		main.classList.remove('NeeloongForm-tree-moving');
		dragenterEl?.classList.remove('NeeloongForm-tree-drag-over');
		dragenterEl = null;

	}
	if (options?.editable) {
		const button = main.appendChild(document.createElement('button'));
		button.addEventListener('click', () => addNode(-1));
		button.classList.add('NeeloongForm-tree-head-add');
		watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true, options.signal);
	}
	const start = main.appendChild(document.createComment(''));
	if (options?.editable) {
		const foot = main.appendChild(document.createElement('div'));
		foot.classList.add('NeeloongForm-tree-foot');
		const button = foot.appendChild(document.createElement('button'));
		button.addEventListener('click', () => addNode(-2));
		button.classList.add('NeeloongForm-tree-foot-add');
		const dropFront = foot.appendChild(document.createElement('div'));
		dropFront.classList.add('NeeloongForm-tree-drop');


		let dragleave = () => { };
		dropFront.addEventListener('dragover', (e) => e.preventDefault());
		dropFront.addEventListener('dragenter', () => dragleave = dragenter(dropFront));
		dropFront.addEventListener('dragleave', () => dragleave());
		dropFront.addEventListener('drop', () => drop());


		watch(() => !addable.get(), disabled => { button.disabled = disabled; }, true, options.signal);
	}
	/** @type {Map<Store, [tbody: HTMLElement, AbortController, (s: State) => void]>} */
	let seMap = new Map();
	/** @type {State[]} */
	const states = [];
	watch(() => store.children, children => {
		let nextNode = start.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		const childrenLength = children.length;
		for (let i = states.length; i < childrenLength; i++) {
			states[i] = createState(store, states, drag, 'level', i);
		}

		let i = -1;
		for (let child of children) {
			i++;
			const state = states[i];
			const old = oldSeMap.get(child);
			if (!old) {
				const elState = new Signal.State(state);
				const ac = new AbortController();
				const el = Line(child, detailsStore, fieldRenderer, layout, elState, {
					columns, addable,
					deletable: new Signal.Computed(() => !store.readonly && !store.disabled && child.removable),
					remove: remove.bind(null, child),
					dragenter,
					dragstart: dragstart.bind(null, child),
					dragend,
					addNode: () => addNode(Number(child.index)),
					createDetails,
					drop: drop.bind(null, child),
				}, {
					...options,
					signal: options?.signal ? AbortSignal.any([options?.signal, ac.signal]) : ac.signal,
				});
				main.insertBefore(el, nextNode);
				seMap.set(child, [el, ac, s => elState.set(s)]);
				continue;
			}
			oldSeMap.delete(child);
			seMap.set(child, old);
			old[2](state);
			if (nextNode === old[0]) {
				nextNode = nextNode.nextSibling;
				continue;
			}
			main.insertBefore(old[0], nextNode);
		}
		states.splice(childrenLength);
			for (const [el, ac] of oldSeMap.values()) {
				el.remove();
				ac.abort();
			}
	}, true, options?.signal);

	return root;
}
