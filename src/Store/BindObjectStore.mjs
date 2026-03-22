import create, { setObjectStore } from './create.mjs';
import Store from './Store.mjs';
/** @import { Schema } from '../Schema.types.mjs' */

/**
 * @template [T=any]
 * @template [M=any]
 * @template {Object.<string, Schema.State>} [S=Object.<string, Schema.State>]
 * @extends {Store<T, M, S>}
 */
export default class BindObjectStore extends Store {

	get kind() { return 'object'; }
	/** @type {Record<string, Store>} */
	#children = Object.create(null);
	*[Symbol.iterator]() { yield* Object.entries(this.#children); }
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return this.#children[key] || null; }
	/**
	 * @param {Schema<any, Object.<string, Schema.State>>} schema 数据结构模式
	 * @param {Store<T, M, S>} store
	 * @param {Map<Store<any, any, {[x: string]: Schema.State;}>, string>} bindStores
	 * @param {AbortSignal} [signal]
	 */
	constructor(schema, store, bindStores, signal) {
		super(store);
		if (signal?.aborted) { return; }

		/** @type {Store[]} */
		const list = [];
		const children = this.#children;
		for (const [index, field] of Object.entries(schema)) {
			const bindStore = create(field, {
				index, parent: this,
				/** @param {*} value @param {*} index @param {Store} store */
				onUpdate: (value, index, store) => {
					if (store !== children[index]) { return; }
					const val = this.value ?? null;
					if (typeof val !== 'object' || Array.isArray(val)) { return; }
					// @ts-ignore
					this.value = { ...val, [index]: value };
				},
			});
			children[index] = bindStore;
			list.push(bindStore);
			bindStores.set(bindStore, index);
		}
		signal?.addEventListener('abort', () => {
			for (const bindStore of list) {
				bindStores.delete(bindStore);
			}
		});

	}
}
// @ts-ignore
setObjectStore(ObjectStore);
