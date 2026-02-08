import { Signal } from 'signal-polyfill';
import Store from './Store.mjs';
import create, { setArrayStore } from './create.mjs';
import createBooleanStates from './createBooleanStates.mjs';
/** @import { Schema } from '../types.mjs' */



/**
 * @template [T=any]
 * @template [M=any]
 * @extends {Store<(T | null)[], M>}
 */
export default class ArrayStore extends Store {
	/** @type {(index: number, isNew?: boolean) => Store} */
	#create = () => { throw new Error; };
	/** @type {Signal.State<Store[]>} */
	#children;
	get children() { return [...this.#children.get()]; }
	*[Symbol.iterator]() { return yield* [...this.#children.get().entries()]; }
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
	 * @param {boolean} [options.addable] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdate] 
	 */
	constructor(schema, { parent, onUpdate, index, new: isNew, addable } = {}) {
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

		};
		super({ ...schema, immutable: false }, {
			index, new: isNew, parent,
			size: new Signal.Computed(() => childrenState.get().length),
			setValue(v) {
				const val = Array.isArray(v) ? v : v == null ? null : [v];
				updateChildren(val);
				return val;
			},
			convert(v) {
				const val = Array.isArray(v) ? v : v == null ? null : [v];
				updateChildren(val);
				return val;
			},
			onUpdate: (value, index, store) => {
				updateChildren(value);
				onUpdate?.(value, index, store);
			},
			default: schema.default ?? [],
		});

		[this.#selfAddable, this.#addable] = createBooleanStates(this, addable, schema.addable ?? true);

		this.#children = childrenState;
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index @param {Store} store */
			onUpdate: (value, index, store) => {
				if (childrenState.get()[index] !== store) { return; }
				const val = [...this.value || []];
				if (val.length < index) {
					val.length = index;
				}
				val[index] = value;
				this.value = val;
			},
		};
		this.#create = (index, isNew) => {
			const child = create(
				{ ...schema, creatable: true },
				{ ...childCommonOptions, index, new: isNew },
			);
			child.index = index;
			return child;
		};
	}


	/** @readonly @type {Signal.State<boolean?>} */
	#selfAddable;
	/** @readonly @type {Signal.Computed<boolean>} */
	#addable;
	get selfAddable() { return this.#selfAddable.get(); }
	set selfAddable(v) { this.#selfAddable.set(typeof v === 'boolean' ? v : null); }
	/** 是否禁用字段 */
	get addable() { return this.#addable.get(); }
	set addable(v) { this.#selfAddable.set(typeof v === 'boolean' ? v : null); }



	/**
	 * 
	 * @param {number} index 
	 * @param {T?} [value] 
	 * @param {boolean} [isNew] 
	 * @returns 
	 */
	insert(index, value = null, isNew) {
		if (!this.addable) { return false; }
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
		val.splice(insertIndex, 0, item.createDefault(value));
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
		this.#children.set(children);
		this.value = val;
		return value;

	}
	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 * @param {number} quantity 
	 * @returns 
	 */
	move(from, to, quantity = 1) {
		const q = Math.floor(quantity);
		if (q < 1) { return 0; }
		if (from <= to && from + q > to) { return 0; }

		const data = this.value;
		if (!Array.isArray(data)) { return 0; }

		const children = [...this.#children.get()];
		const list = children.splice(from, q);
		const len = list.length;
		if (!len) { return 0; }
		const toIndex = q > 1 && to > from ? to - q + 1 : to;
		children.splice(toIndex, 0, ...list);

		let lft = Math.min(from, toIndex);
		let rgt = Math.max(from + q - 1, to);
		for (let i = lft; i <= rgt; i++) {
			children[i].index = i;
		}

		const val = [...data];
		const values = val.splice(from, len);
		for (let i = values.length; i < len; i++) { values.push(null); }
		while (toIndex > val.length) { val.push(null); }
		val.splice(toIndex, 0, ...values);

		this.#children.set(children);
		this.value = val;
		return len;

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
		this.#children.set(children);
		this.value = val;
		return true;
	}
}
// @ts-ignore
setArrayStore(ArrayStore);
