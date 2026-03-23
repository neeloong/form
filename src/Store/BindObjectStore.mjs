import create from './create.mjs';
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
	 * @param {AbortSignal} [signal]
	 */
	constructor(schema, store, signal) {
		super(store, signal);
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
		}
	}
}
