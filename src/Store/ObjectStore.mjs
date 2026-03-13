import create, { setObjectStore } from './create.mjs';
import Store from './Store.mjs';
/** @import { Schema } from '../Schema.types.mjs' */

/**
 * @template {Record<string, any>} [T=Record<string, any>]
 * @template [M=any]
 * @template {Object.<string, Schema.State>} [S=Object.<string, Schema.State>]
 * @extends {Store<T, M, S>}
 */
export default class ObjectStore extends Store {
	get kind() { return 'object'; }
	/** @type {Record<string, Store>} */
	#children;
	*[Symbol.iterator]() { yield* Object.entries(this.#children); }
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return this.#children[key] || null; }
	/**
	 * @param {Schema.Object<M, S> & Schema.Attr<M, S>} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent] 
	 * @param {number | string | null} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {((value: T?, index: any, store: Store) => void)?} [options.onUpdate] 
	 */
	constructor(schema, { parent, index, new: isNew, onUpdate } = {}) {
		const childrenTypes = Object.entries(schema.type);
		/** @type {Record<string, Store>} */
		const children = Object.create(null);
		super(schema, {
			parent, index, new: isNew, onUpdate,
			size: childrenTypes.length,
			setValue(v) { return typeof v === 'object' ? v : null; },
			convert(v) {
				return typeof v === 'object' ? v : {};
			},
			default: schema.default ?? ((store, value) => {
				const list = Object.entries(children);
				let obj = value;
				if (!obj || typeof obj !== 'object') { obj = schema.default; }
				if (!obj || typeof obj !== 'object') { obj = {}; }
				return Object.fromEntries(list.map(([k, v]) => [k, v.createDefault(Object.hasOwn(obj, k) ? obj[k] : null)]));
			}),
		});
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index @param {Store} store */
			onUpdate: (value, index, store) => {
				if (store !== this.#children[index]) { return; }
				// @ts-ignore
				this.value = { ...this.value, [index]: value };
			},
		};

		for (const [index, field] of childrenTypes) {
			children[index] = create(field, { ...childCommonOptions, index });
		}
		this.#children = children;
	}
}
// @ts-ignore
setObjectStore(ObjectStore);
