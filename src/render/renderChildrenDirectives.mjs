import computed from '../computed/index.mjs';
import execSchema from './execSchema.mjs';
import toText from './toText.mjs';

/**
 * @param {Element} node
 * @param {import('../schema.mjs').Schema} schema
 * @param {any} envs
 * @param {import('../types.mjs').Directives} layout
 */
export default function renderChildrenDirectives(node, schema, envs, { text, html }) {
	if (text != null) {
		const result = computed(() => execSchema(schema, text, envs));
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
		const result = computed(() => execSchema(schema, html, envs));
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
