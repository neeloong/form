export const ref = Symbol();
/** @import Store from './index.mjs' */
/** @typedef {{ [ref]: Store; [k: string]: Ref | undefined;}} Ref */

/**
 * @param {Store} store
 */
export default function createRef(store) {

	/** @type{Ref} */
	const r = { [ref]: store };
	for (const [k, f] of store) {
		Object.defineProperty(r, k, {
			get() { return f.ref; },
			configurable: false,
			enumerable: true,
		});
	}
	Object.defineProperty(r, ref, {
		get() { return store; },
		configurable: false,
		enumerable: true,
	});
	return r;
}
