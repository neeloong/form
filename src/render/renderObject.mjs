import Environment from './Environment/index.mjs';
/** @import { ObjectStore, Store } from '../Store/index.mjs' */

/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {ObjectStore} store
 * @param {Environment} env
 * @param {(next: Node | null, env: any) => () => void} renderItem
 */
export default function renderObject(parent, next, store, env, renderItem) {
	/** @type {(() => void)[]} */
	const children = [];
	/** @type {[string, Store<any, any>, number][]} */
	const childStores = [...store].map(([k,v], i) => [k,v,i]);
	const count = childStores.length;
	for (const [key, child, index] of childStores) {
	children.push(renderItem(next, env.setStore(child, store, {
		get count() { return count; },
		get key() { return key; },
		get index() { return index; },
		get item() { return child.value; },
	})));
	}

	return () => {
		for (const d of children) {
			d();
		}
	};
}
