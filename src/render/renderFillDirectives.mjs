import computed from '../computed/index.mjs';
import ENV from '../ENV.mjs';
/** @import * as Layout from '../Layout/index.mjs' */
/** @import Value from '../Value/index.mjs' */
import toText from './toText.mjs';

/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {ENV} envs
 * @param {Layout.Directives} layout
 */
export default function renderFillDirectives(parent, next, schema, envs, { text, html }) {
	if (text != null) {
		const result = computed(() => envs.exec(text));
		let value = toText(result.value);
		const node = parent.insertBefore(document.createTextNode(value), next);
		result.listen((val) => {
			if (!node.parentNode) { return; }
			const newVal = toText(val);
			if (newVal === value) { return; }
			value = newVal;
			node.textContent = value;
		});
		return () => {
			node.remove();
			result.stop();
		};
	}
	if (html == null) { return; }
	const result = computed(() => envs.exec(html));
	const start = parent.insertBefore(document.createComment(''), next);
	const end = parent.insertBefore(document.createComment(''), next);
	const div = document.createElement('div');
	/** @param {string} html  */
	function add(html) {
		div.innerHTML = html;
		for (let node = div.firstChild; node; node = start.firstChild) {
			parent.insertBefore(node, end);
		}
	}
	function remove() {
		for (let node = start.nextSibling; node && node !== end; node = start.nextSibling) {
			node.remove();
		}
	}
	let value = toText(result.value);
	add(value);
	let stopped = false;
	result.listen((val) => {
		if (stopped) { return; }
		const newVal = toText(val);
		if (newVal === value) { return; }
		value = newVal;
		remove();
		add(value);
	});
	return () => {
		stopped = true;
		result.stop();
		remove();
		start.remove();
		end.remove();
	};
}
