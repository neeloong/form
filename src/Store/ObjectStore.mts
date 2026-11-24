import type { Schema } from '../Schema.types.mts';
import create, { setObjectStore } from './create.mts';
import Store from './Store.mts';


export default class ObjectStore<
	T = any,
	M = any,
	S extends {[k in string & keyof S]: Schema.State} = object,
	L extends { [k in keyof L]: L[k] } = object,
> extends Store<T, M, S, L> {
	get kind() { return 'object'; }
	#children: Record<string, Store<any, M, S, L>>;
	*[Symbol.iterator]() { yield* Object.entries(this.#children); }

	child(key: string | number): Store<any, M, S, L> | null { return this.#children[key] || null; }

	constructor(
		schema: Schema.Object<M, S, L> & Schema.Attr<M, S, L>,
		{ parent, index, new: isNew, onUpdate }: {
			parent?: Store | null;
			index?: number | string | null;
			new?: boolean;
			onUpdate?: ((value: T | null, index: any, store: Store) => void) | null;
		} = {},
	) {
		const childrenTypes = Object.entries(schema.type);
		const children: Record<string, Store<any, M, S, L>> = Object.create(null);
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
			onUpdate: (value: any, index: any, store: Store) => {
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
