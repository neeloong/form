import computed from '../computed/index.mjs';
import Environment from './Environment.mjs';
/** @import * as Layout from '../Layout/index.mjs' */
/** @import Value from '../Value/index.mjs' */

/**
 * @param {(Layout.Node | string)[]} layouts
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {Environment} envs
 * @param {(layout: Layout.Node) => () => void} renderItem
 * @returns {() => void}
 */
export default function renderList(layouts, parent, next, schema, envs, renderItem) {

	/** @type {Set<() => void>?} */
	let bkList = new Set();
	/** @type {[string | Function | null, Layout.Node][]} */
	let ifList = [];

	/** @param {[string | Function | null, Layout.Node][]} list */
	function renderIf(list) {
		if (!list.length || !bkList) { return; }
		const end = parent.insertBefore(document.createComment(''), next);
		let result = computed(() => list.findIndex(v => {
			const ifv = v[0];
				return ifv === null || Boolean(envs.exec(ifv));
		}));
		let lastIndex = result.value;
		let destroy = () => { };
		/**
		 *
		 * @param {number} index
		 * @returns
		 */
		function renderIndex(index) {
			const layout = list[index]?.[1];
			if (!layout) { return; }
			destroy = renderItem(layout);
		}
		bkList.add(() => {
			result.stop();
			destroy();
			destroy = () => { };
			end.remove();
		});
		renderIndex(lastIndex);
		result.listen((index) => {
			if (!bkList) { return; }
			if (index === lastIndex) { return; }
			lastIndex = index;
			destroy();
			destroy = () => { };
			renderIndex(lastIndex);
		});
	}
	for (const layout of layouts) {
		if (typeof layout === 'string') {
			renderIf(ifList);
			ifList = [];
			const node = document.createTextNode(layout);
			parent.insertBefore(node, next);
			bkList.add(() => node.remove());
			continue;
		}
		if (ifList.length && layout.directives.else) {
			const ifv = layout.directives.if || null;
			ifList.push([ifv, layout]);
			if (!ifv) {
				renderIf(ifList);
				ifList = [];
			}
			continue;
		}
		renderIf(ifList);
		ifList = [];
		const ifv = layout.directives.if;
		if (ifv) {
			ifList.push([ifv, layout]);
			continue;
		}
		bkList.add(
			renderItem(layout)
		);
	}

	return () => {
		if (!bkList) { return; }
		const list = bkList;
		bkList = null;
		for (const s of list) {
			s();
		}
	};
}
