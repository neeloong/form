import watch from './watch.mjs';
import Environment from './Environment/index.mjs';
import { Signal } from 'signal-polyfill';

/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {() => any} getter
 * @param {Environment} env
 * @param {(next: Node | null, env: any) => () => void} renderItem
 */
export default function renderEnum(parent, next, getter, env, renderItem) {

	/** @type {Signal.Computed<[value: any, index: number, kKey: any][]>} */
	const list = new Signal.Computed(() => {
		const values = getter();
		if (typeof values === 'number') {
			const n = Math.floor(values);
			if (!n) { return []; }
			return Array(n).fill(0).map((_, i) => [i + 1, i, i]);
		}
		if (!values || typeof values !== 'object') { return []; }
		if (Array.isArray(values)) {
			return values.map((v, i) => [v, i, i]);
		}
		// TODO: 转列表
		return Object.entries(values).map(([k,v], i) => [v, i, k]);
	});
	const start = parent.insertBefore(document.createComment(''), next);
	/** @type {[Comment, Comment, () => void, key: any, Signal.State<any>, Signal.State<any>][]} */
	let seMap = []
	/** @param {[Comment, Comment, () => void, key: any, Signal.State<any>, Signal.State<any>][]} map */
	function destroyMap(map) {
		for (const [s, e, d] of map) {
			d();
			s.remove();
			e.remove();
		}
	}
	const childrenResult = watch(() => list.get(), function render(children) {
		if (!start.parentNode) { return; }
		let nextNode = start.nextSibling;
		const oldSeMap = seMap;
		seMap = []
		for (const [value, index, key] of children) {
			const index2 = oldSeMap.findIndex((v) => v[3] === key);
			const [old] = index2 >= 0 ? oldSeMap.splice(index2, 1) : [];
			if (!old) {
				const ItemStart = parent.insertBefore(document.createComment(''), nextNode);
				const itemEnd = parent.insertBefore(document.createComment(''), nextNode);
				const valueState = new Signal.State(value);
				const indexState = new Signal.State(index);
				const d = renderItem(itemEnd, env.setObject({
					get key() { return key; },
					get value() { return valueState.get(); },
					get index() { return indexState.get(); },
				}));
				seMap.push([ItemStart, itemEnd, d, key, valueState, indexState]);
				continue;
			}
			seMap.push(old);
			old[4].set(value);
			old[5].set(index);
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
