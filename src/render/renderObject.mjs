import Environment from './Environment/index.mjs';
/** @import * as Layout from '../Layout/index.mjs' */
/** @import Store, { ObjectStore } from '../Store/index.mjs' */

/**
 *
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {ObjectStore} store
 * @param {Environment} env
 * @param {(layout: Layout.Node, parent: Element, next: Node | null, store: Store, env: any) => () => void} renderItem
 */
export default function renderObject(layout, parent, next, store, env, renderItem) {
	/** @type {(() => void)[]} */
	const children = [];
	for (const [k, child] of [...store]) {
	children.push(renderItem(layout, parent, next, child, env.setStore(child, store)));
	}

	return () => {
		for (const d of children) {
			d();
		}
	};
}
