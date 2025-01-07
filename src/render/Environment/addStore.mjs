/** @import Store from '../../Store/index.mjs' */

/**
 * @param {Store} store
 * @param {*} env
 */
export default function addStore(store, env) {
	Object.defineProperty(env, '$store', {
		value: store,
		writable: false,
		configurable: true,
		enumerable: false,
	});
	Object.defineProperty(env, '$root', {
		value: store.root,
		writable: false,
		configurable: true,
		enumerable: false,
	});
}
