import watch from './watch.mjs';
import Environment from './Environment/index.mjs';
/** @import Store, { ArrayStore } from '../Store/index.mjs' */

/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {ArrayStore} store
 * @param {Environment} env
 * @param {(next: Node | null, env: any) => () => void} renderItem
 */
export default function renderArray(parent, next, store, env, renderItem) {
	const start = parent.insertBefore(document.createComment(''), next);
	/** @type {Map<Store, [Comment, Comment, () => void]>} */
	let seMap = new Map();
	/** @param {Map<Store, [Comment, Comment, () => void]>} map */
	function destroyMap(map) {
		for (const [s, e, d] of map.values()) {
			d();
			s.remove();
			e.remove();
		}

	}
	const childrenResult = watch(() => store.children, function render(children) {
		if (!start.parentNode) { return; }
		let nextNode = start.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const ItemStart = parent.insertBefore(document.createComment(''), nextNode);
				const itemEnd = parent.insertBefore(document.createComment(''), nextNode);
				const d = renderItem(itemEnd, env.setStore(child, store));
				seMap.set(child, [ItemStart, itemEnd, d]);
				continue;
			}
			oldSeMap.delete(child);
			seMap.set(child, old);
			if (nextNode === old[0]) {
				nextNode = old[1].nextSibling;
				continue;
			}
			/** @type {Node?} */
			let c = old[0];
			while (c && c !== old[1]) {
				const o = c;
				c = c.nextSibling;
				parent.insertBefore(o, nextNode);
			}
			parent.insertBefore(old[1], nextNode);
		}
		destroyMap(oldSeMap);
	});

	return () => {
		start.remove();
		destroyMap(seMap);
		childrenResult();
	};
}
