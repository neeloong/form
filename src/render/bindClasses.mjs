/** @import * as Layout from '../Layout/index.mjs' */

import Environment from './Environment/index.mjs';
import watch from '../watch.mjs';

/**
 * @param {Node} node
 * @param {Environment} envs
 * @param {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} classes
 */
export default function bindClasses(node, classes, envs) {
	if (!(node instanceof Element)) {
		return () => {};
	}

	/** @type {Set<() => void>?} */
	let bk = new Set();
	for (const [key, attr] of Object.entries(classes)) {
		if (attr.value) {
			node.classList.add(key);
			continue;
		}
		bk.add(watch(() => Boolean(envs.exec(attr)), value => {
			if (value) {
				node.classList.add(key);
			} else {
				node.classList.remove(key);
			}
		}, true));
	}
	// TODO: 创建组件
	return ()=> {
		if (!bk) { return; }
		const list = bk;
		bk = null;
		for (const s of list) {
			s();
		}
	}
}
