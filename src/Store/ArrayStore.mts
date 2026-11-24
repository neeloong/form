import type { Schema } from '../Schema.types.mts';
import { Signal } from 'signal-polyfill';
import Store from './Store.mts';
import create, { setArrayStore } from './create.mts';
import createBooleanStates from './createBooleanStates.mjs';


export default class ArrayStore<
	T = any,
	M = any,
	S extends {[k in string & keyof S]: Schema.State} = object,
	L extends { [k in keyof L]: L[k] } = object,
> extends Store<(T | null)[], M, S, L> {
	#create: (index: number, isNew?: boolean) => Store<any, M, S, L> = () => { throw new Error; };
	#children: Signal.State<Store<any, M, S, L>[]>;
	get children() { return [...this.#children.get()]; }
	*[Symbol.iterator]() { return yield* [...this.#children.get().entries()]; }
	child(key: string | number): Store<any, M, S, L> | null {
		const children = this.#children.get();
		if (typeof key === 'number' && key < 0) {
			return children[children.length + key] || null;
		}
		return children[Number(key)] || null;
	}
	get kind() { return 'array'; }

	constructor(
		schema: Schema.Field<M, S, L>,
		{ parent, onUpdate, index, new: isNew, addable }: {
			parent?: Store | null;
			index?: string | number | null;
			new?: boolean;
			addable?: boolean;
			onUpdate?: (value: any, index: any, store: Store) => void;
		} = {}) {
		const childrenState = new Signal.State([] as Store<any, M, S, L>[]);
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
			onUpdate: (value: any, index: any, store: Store) => {
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
			const child = create<M, S, L>(
				{ ...schema, creatable: true },
				{ ...childCommonOptions, index, new: isNew },
			);
			child.index = index;
			return child;
		};
	}
	bindObject(): never { throw new Error(`ArrayStore 不支持 bindObject()方法`); }


	#selfAddable: Signal.State<boolean | null>;
	#addable: Signal.Computed<boolean>;
	get selfAddable() { return this.#selfAddable.get(); }
	set selfAddable(v) { this.#selfAddable.set(typeof v === 'boolean' ? v : null); }
	/** 是否禁用字段 */
	get addable() { return this.#addable.get(); }
	set addable(v) { this.#selfAddable.set(typeof v === 'boolean' ? v : null); }


	insert(index: number, value: T | null = null, isNew?: boolean) {
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
	add(value: T | null = null) {
		return this.insert(this.#children.get().length, value);
	}
	remove(index: number) {
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
	move(from: number, to: number, quantity: number = 1) {
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
	exchange(a: number, b: number) {
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
