/** @import Store from './Store.mjs' */

/**
 * 
 * @template {Store} T 
 * @param {T} store 
 * @param {((store: T, value?: any) => any) | any} def 
 * @returns {(value?: any) => unknown}
 */
export default function makeDefault(store, def) {
	if (typeof def !== 'function') {
		return value => structuredClone(
			def && value && typeof def === 'object' && typeof value === 'object' ? {...def, ...value}
			: def && typeof def === 'object' ? def
			: value ?? def
		);
	}
	return value => structuredClone(def(store, value));
}
