/** @import { Schema } from '../types.mjs' */

import Store from './Store.mjs';

/** @type {{new(...p: ConstructorParameters<typeof Store>): Store}?} */
let ObjectStore = null;
/** @type {{new(...p: ConstructorParameters<typeof Store>): Store}?} */
let ArrayStore = null;
/** @type {Record<string, {new(...p: ConstructorParameters<typeof Store>): Store}?>} */
let TypeStores = Object.create(null);
/**
 * @param {Schema.Field} schema
 * @param {object} [options] 
 * @param {Store?} [options.parent]
 * @param {string | number | null} [options.index] 
 * @param {boolean} [options.new] 
 * @param {(value: any, index: any, store: Store) => void} [options.onUpdate] 
 * @param {(value: any, index: any, store: Store) => void} [options.onUpdateState] 
 */
export default function create(schema, options) {
	const type = schema.type;
	/** @type {{new(...p: ConstructorParameters<typeof Store>): Store}} */
	let Class = Store;
	if (schema.array && !(ArrayStore && options?.parent instanceof ArrayStore)) {
		if (ArrayStore) { Class = ArrayStore; }
	} else if (typeof type === 'string') {
		const C = TypeStores[type];
		if (C) { Class = C; }
	} else if (type && typeof type === 'object') {
		if (ObjectStore) { Class = ObjectStore; }
	}
	return new Class(schema, options);
}

/** @param {{new(...p: ConstructorParameters<typeof Store>): Store}} Class */
export function setObjectStore(Class) {
	ObjectStore = Class;
}

/** @param {{new(...p: ConstructorParameters<typeof Store>): Store}} Class */
export function setArrayStore(Class) {
	ArrayStore = Class;
}
/**
 * @param {string} type
 * @param {{new(...p: ConstructorParameters<typeof Store>): Store}} Class
 */
export function setStore(type, Class) {
	TypeStores[type] = Class;
}
