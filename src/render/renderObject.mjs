import Environment from './Environment/index.mjs';
/** @import { ObjectStore } from '../Store/index.mjs' */

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
	const childStores = [...store];
	const count = childStores.length;
	for (const [k, child] of childStores) {
	children.push(renderItem(next, env.setStore(child, store, {
		get count() { return count; },
	})));
	}

	return () => {
		for (const d of children) {
			d();
		}
	};
}
