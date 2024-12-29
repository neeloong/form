import computed from '../computed/index.mjs';

/**
 *
 * @param {import('../types.mjs').Layout} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {import('../Value.mjs').ArrayValue} schema
 * @param {any} envs
 * @param {(layout: import("../types.mjs").Layout, parent: Element, next: Node | null, schema: import('../Value.mjs').default, envs: any) => () => void} renderItem
 */
export default function renderArray(layout, parent, next, schema, envs, renderItem) {
	const start = parent.insertBefore(document.createComment(''), next);
	const childrenResult = computed(() => schema.children);
	/** @type {Map<import('../Value.mjs').default, [Comment, Comment, () => void]>} */
	let seMap = new Map();
	/** @param {Map<import('../Value.mjs').default, [Comment, Comment, () => void]>} map */
	function destroyMap(map) {
		for (const [s, e, d] of map.values()) {
			d();
			s.remove();
			e.remove();
		}

	}
	function render() {
		if (!start.parentNode) { return; }
		const children = childrenResult.value;
		let nextNode = start.nextSibling;
		const oldSeMap = seMap;
		seMap = new Map();
		for (let child of children) {
			const old = oldSeMap.get(child);
			if (!old) {
				const ItemStart = parent.insertBefore(document.createComment(''), nextNode);
				const itemEnd = parent.insertBefore(document.createComment(''), nextNode);
				const d = renderItem(layout, parent, itemEnd, child, envs);
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
	}
	render();
	childrenResult.listen(() => render());

	return () => {
		start.remove();
		childrenResult.stop();
	};
}
