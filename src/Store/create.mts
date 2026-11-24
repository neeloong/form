import type { Schema } from '../Schema.types.mts';
import type ArrayStore from './ArrayStore.mts';

import Store from './Store.mts';

let ObjectStore: { new(...p: ConstructorParameters<typeof Store<any, any, any, any>>): Store<any, any, any, any>; } | null = null;
export let ArrayStoreClass: { new(...p: ConstructorParameters<typeof Store<any, any, any, any>>): ArrayStore<any, any, any, any>; } | null = null;
let TypeStores: Record<string, { new(...p: ConstructorParameters<typeof Store<any, any, any, any>>): Store<any, any, any, any>; } | null> = Object.create(null);

export default function create<
	M = any,
	S extends Record<string, Schema.State> =  Record<string, Schema.State>,
	L extends { [k in keyof L]: L[k] } = object,
>(
	schema: Schema.Field<M, S, L>,
	options: {
		parent?: Store | null;
		index?: string | number | null;
		new?: boolean;
		onUpdate?: (value: any, index: any, store: Store) => void;
	} = {}
): Store<any, M, S, L> {
	const type = schema.type;
	let Class: { new(...p: ConstructorParameters<typeof Store<any, M, S, L>>): Store<any, M, S, L>; } = Store;
	if (schema.array && !(ArrayStoreClass && options?.parent instanceof ArrayStoreClass)) {
		// @ts-ignore
		if (ArrayStoreClass) { Class = ArrayStoreClass; }
	} else if (typeof type === 'string') {
		const C = TypeStores[type];
		if (C) { Class = C; }
	} else if (type && typeof type === 'object') {
		if (ObjectStore) { Class = ObjectStore; }
	}
	return new Class(schema, options);
}

export function setObjectStore(Class: { new(...p: ConstructorParameters<typeof Store>): Store; }) {
	ObjectStore = Class;
}

export function setArrayStore(Class: { new(...p: ConstructorParameters<typeof Store>): ArrayStore; }) {
	ArrayStoreClass = Class;
}
export function setStore(type: string, Class: { new(...p: ConstructorParameters<typeof Store>): Store; }) {
	TypeStores[type] = Class;
}
