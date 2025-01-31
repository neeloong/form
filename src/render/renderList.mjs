import watch from '../watch.mjs';
import Environment from './Environment/index.mjs';
/** @import * as Layout from '../Layout/index.mjs' */

/**
 * @param {(Layout.Node | string)[]} layouts
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} envs
 * @param {Record<string, [Layout.Node, Environment]>} templates
 * @param {(layout: Layout.Node, templates: Record<string, any>) => () => void} renderItem
 * @returns {() => void}
 */
export default function renderList(layouts, parent, next, envs, templates, renderItem) {

	/** @type {Set<() => void>?} */
	let bkList = new Set();
	/** @type {[Layout.Node.Name | Layout.Node.Calc | null, Layout.Node][]} */
	let ifList = [];
	/** @type {Record<string, [Layout.Node, Environment]>} */
	let currentTemplates = Object.create(templates)
	for (const layout of layouts) {
		if (typeof layout === 'string') { continue; }
		const name = layout.template
		if (!name) { continue; }
		currentTemplates[name] = [layout, envs];
	}

	/** @param {[Layout.Node.Name | Layout.Node.Calc | null, Layout.Node][]} list */
	function renderIf(list) {
		if (!list.length || !bkList) { return; }
		const end = parent.insertBefore(document.createComment(''), next);
		
		
		let lastIndex = -1;
		let destroy = () => { };
		/**
		 *
		 * @param {number} index
		 * @returns
		 */
		function renderIndex(index) {
			const layout = list[index]?.[1];
			if (!layout) { return; }
			destroy = renderItem(layout, currentTemplates);
		}
		bkList.add(() => {
			destroy();
			destroy = () => { };
			end.remove();
		});
		bkList.add(watch(
			() => list.findIndex(([ifv]) => !ifv || envs.exec(ifv)),
			index => {
				if (index === lastIndex) { return; }
				lastIndex = index;
				destroy();
				destroy = () => { };
				renderIndex(lastIndex);
			}, true,
		));
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
		if (layout.template) {
			renderIf(ifList);
			ifList = [];
			continue;
		}
		if (ifList.length && layout.else) {
			const ifv = layout.if || null;
			ifList.push([ifv, layout]);
			if (!ifv) {
				renderIf(ifList);
				ifList = [];
			}
			continue;
		}
		renderIf(ifList);
		ifList = [];
		const ifv = layout.if;
		if (ifv) {
			ifList.push([ifv, layout]);
			continue;
		}
		bkList.add(
			renderItem(layout, currentTemplates)
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
