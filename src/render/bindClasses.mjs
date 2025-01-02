import Environment from './Environment.mjs';
import computed from '../computed/index.mjs';

/**
 * @param {Node} node
 * @param {Environment} envs
 * @param {Record<string, string | boolean | ((...any: any) => void)>} classes
 */
export default function bindClasses(node, classes, envs) {
	if (!(node instanceof Element)) {
		return () => {};
	}

	/** @type {Set<() => void>?} */
	let bk = new Set();
	for (const [name, attr] of Object.entries(classes)) {
		if (!attr) { continue; }
		if (attr === true) {
			node.classList.add(name);
			continue;
		}
		const result = computed(() => Boolean(envs.exec(attr)));
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
