/** @import { ENV } from '../types.mjs' */
import computed from '../computed/index.mjs';
/** @import Value from '../Value/index.mjs' */

/**
 * @param {Node} node
 * @param {Value} schema
 * @param {ENV} envs
 * @param {Record<string, string | ((...any: any) => void)>} classes
 */
export default function bindClasses(node, classes, schema, envs) {
	if (!(node instanceof Element)) {
		return () => {};
	}

	/** @type {Set<() => void>?} */
	let bk = new Set();
	for (const [name, attr] of Object.entries(classes)) {
		const result = computed(() => Boolean(schema.exec(attr, envs)));
		let value = result.value;
		if (value) { node.classList.add(name); }
		bk.add(() => result.stop());
		result.listen((val) => {
			if (!bk) { return; }
			if (val === value) { return; }
			value = val;
			if (value) {
				node.classList.add(name);
			} else {
				node.classList.remove(name);
			}
		});
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
