/** @import Store from './Store.mjs' */

/**
 * 
 * @template {Store} T 
 * @param {T} store 
 * @param {((store: T) => any) | any} def 
 */
export default function makeDefault(store, def) {
	if (typeof def !== 'function') {
		return () => structuredClone(def);
	}
	return () => structuredClone(def(store));
}
