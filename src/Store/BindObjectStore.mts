import create from './create.mts';
import Store from './Store.mts';
import type { Schema } from '../Schema.types.mts'


export default class BindObjectStore<
	T = any,
	M = any,
	S extends {[k in string & keyof S]: Schema.State} = object,
	L extends { [k in keyof L]: L[k] } = object,
> extends Store<T, M, S, L> {

	get kind() { return 'object'; }
	#children: Record<string, Store<any, M, S, L>> = Object.create(null);
	*[Symbol.iterator]() { yield* Object.entries(this.#children); }
	child(key: string | number): Store<any, M, S, L> | null { return this.#children[key] || null; }
	/**
	 * @param schema 数据结构模式
	 * @param store
	 * @param signal
	 */
	constructor(
		schema: Schema<M, S, L>,
		store: Store<T, M, S, L>,
		signal?: AbortSignal,
	) {
		super(store, signal);
		const children = this.#children;
		for (const [index, field] of Object.entries(schema)) {
			const bindStore = create<M, S, L>(field, {
				index, parent: this,
				onUpdate: (value: any, index: any, store: Store) => {
					if (store !== children[index]) { return; }
					const val = this.value ?? null;
					if (typeof val !== 'object' || Array.isArray(val)) { return; }
					// @ts-ignore
					this.value = { ...val, [index]: value };
				},
			});
			children[index] = bindStore;
		}
	}
}
