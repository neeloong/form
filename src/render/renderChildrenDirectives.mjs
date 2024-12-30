import computed from '../computed/index.mjs';
/** @import { ENV } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */
/** @import Value from '../Value/index.mjs' */
import toText from './toText.mjs';

/**
 * @param {Element} node
 * @param {Value} schema
 * @param {ENV} envs
 * @param {Layout.Directives} layout
 */
export default function renderChildrenDirectives(node, schema, envs, { text, html }) {
	if (text != null) {
		const result = computed(() => schema.exec(text, envs));;
		let value = toText(result.value);
		const n = node.insertBefore(document.createTextNode('value'), null);
		result.listen((val) => {
			if (!n.parentNode) { return; }
			const newVal = toText(val);
			if (newVal === value) { return; }
			value = newVal;
			n.textContent = value;
		});
		return () => {
			n.remove();
			result.stop();
		};
	}
	if (html != null) {
		const result = computed(() => schema.exec(html, envs));;
		let value = toText(result.value);
		const old = node.innerHTML;
		node.innerHTML = value;
		let stopped = false;
		result.listen((val) => {
			if (stopped) { return; }
			const newVal = toText(val);
			if (newVal === value) { return; }
			value = newVal;
			node.innerHTML = value;
		});
		return () => {
			stopped = true;
			node.innerHTML = old;
			result.stop()
		};
	}
}
