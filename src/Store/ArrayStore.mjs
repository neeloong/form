import { Signal } from 'signal-polyfill';
import Store from './Store.mjs';
import create, { setArrayStore } from './create.mjs';
/** @import { Schema } from '../types.mjs' */



/**
 * @template [T=any]
 * @template [M=any]
 * @extends {Store<(T | null)[], M>}
 */
export default class ArrayStore extends Store {
	/** @type {(index: number, isNew?: boolean) => Store} */
	#create = () => {throw new Error}
	/** @type {Signal.State<Store[]>} */
	#children
	get children() { return [...this.#children.get()]; }
	*[Symbol.iterator]() { return yield*[...this.#children.get().entries()]; }
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) {
		const children = this.#children.get();
		if (typeof key === 'number' && key < 0) {
			return children[children.length + key] || null;
		}
		return children[Number(key)] || null;
	}
	get kind() { return 'array'; }
	/**
	 * @param {Schema.Field<M>} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent]
	 * @param {string | number | null} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdate] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdateState] 
	 */
	constructor(schema, { parent, onUpdate, onUpdateState, index, new: isNew} = {}) {
		const childrenState = new Signal.State(/** @type {Store[]} */([]));
		// @ts-ignore
		const updateChildren = (list) => {
			const length = Array.isArray(list) && list.length || 0;
			const children = [...childrenState.get()];
			const oldLength = children.length;
			for (let i = children.length; i < length; i++) {
					children.push(this.#create(i));
			}
			children.length = length;
			if (oldLength !== length) {
				childrenState.set(children);
			}

		}
		super(schema, {
			index, new: isNew, parent,
			length: new Signal.Computed(() => childrenState.get().length),
			state: [],
			setValue(v) { return Array.isArray(v) ? v : v == null ? null : [v] },
			setState(v) { return Array.isArray(v) ? v : v == null ? null : [v] },
			convert(v, state) {
				const val = Array.isArray(v) ? v : v == null ? null : [v];
				updateChildren(val);
				return [
					val,
					(Array.isArray(state) ? state : v == null ? [] : [state]),
				];
			},
			onUpdate:(value, index, state) => {
				updateChildren(value);
				onUpdate?.(value, index, state);
			},
			onUpdateState,
		});
		this.#children = childrenState;
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index @param {Store} store */
			onUpdate: (value, index, store) => {
				if (childrenState.get()[index] !== store) { return;}
				const val = [...this.value || []];
				if (val.length < index) {
					val.length = index;
				}
				val[index] = value;
				this.value = val;
			},
			/** @param {*} state @param {*} index @param {Store} store */
			onUpdateState: (state, index, store) => {
				if (childrenState.get()[index] !== store) { return;}
				const sta = [...this.state || []];
				if (sta.length < index) {
					sta.length = index;
				}
				sta[index] = state;
				this.state = sta;
			},
		}
		this.#create = (index, isNew) =>  {
			const child = create(schema, {...childCommonOptions, index, new: isNew });
			child.index = index;
			return child
		}
	}
	/**
	 * 
	 * @param {number} index 
	 * @param {T?} [value] 
	 * @param {boolean} [isNew] 
	 * @returns 
	 */
	insert(index, value = null, isNew) {
		const data = this.value || [];
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const insertIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const item = this.#create(insertIndex, isNew);
		item.new = true;
		children.splice(insertIndex, 0, item);
		for (let i = index + 1; i < children.length; i++) {
			children[i].index = i;
		}
		const val = [...data];
		val.splice(insertIndex, 0, value);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			sta.splice(insertIndex, 0, {});
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;
	}
	/**
	 * 
	 * @param {T?} [value] 
	 * @returns 
	 */
	add(value = null) {
		return this.insert(this.#children.get().length, value);
	}
	/**
	 * 
	 * @param {number} index 
	 * @returns 
	 */
	remove(index) {
		const data = this.value;
		if (!Array.isArray(data)) { return; }
		const children = [...this.#children.get()];
		const removeIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const [item] = children.splice(removeIndex, 1);
		if (!item) { return; }
		for (let i = index; i < children.length; i++) {
			children[i].index = i;
		}
		const val = [...data];
		const [value] = val.splice(removeIndex, 1);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...this.state];
			sta.splice(removeIndex, 1);
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return value;

	}
	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 * @returns 
	 */
	move(from, to) {
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const [item] = children.splice(from, 1);
		if (!item) { return false; }
		children.splice(to, 0, item);
		let lft = Math.min(from, to);
		let rgt = Math.max(from, to);
		for (let i = lft; i <= rgt; i++) {
			children[i].index = i;
		}
		const val = [...data];
		const [value] = val.splice(from, 1);
		val.splice(to, 0, value);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			const [value = {}] = sta.splice(from, 1);
			if (to <= sta.length) {
				sta.splice(to, 0, value);
			} else {
				sta[to] = value;
			}
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;

	}
	/**
	 * 
	 * @param {number} a 
	 * @param {number} b 
	 * @returns 
	 */
	exchange(a, b) {
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const aItem = children[a];
		const bItem = children[b];
		if (!aItem || !bItem) { return false; }
		children[b] = aItem;
		children[a] = bItem;
		aItem.index = b;
		bItem.index = a;
		const val = [...data];
		const aValue = val[a];
		const bValue = val[b];
		val[b] = aValue;
		val[a] = bValue;
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			const aValue = sta[a];
			const bValue = sta[b];
			sta[b] = aValue;
			sta[a] = bValue;
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;
	}
}
// @ts-ignore
setArrayStore(ArrayStore);
