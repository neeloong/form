import { computed } from '../Value/index.mjs';
import toText from './toText.mjs';
/** @import { ENV } from '../types.mjs' */
/** @import Value from '../Value/index.mjs' */

/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {string | Function} template
 * @param {Value} schema
 * @param {ENV} envs
 */
export default function renderTemplate(parent, next, template, schema, envs) {
	const node = parent.insertBefore(document.createTextNode(''), next);
	const result = computed(() => schema.exec(template, envs));;
	let value = toText(result.value);
	node.textContent = value;
	result.listen((val) => {
		if (!node.parentNode) { return }
		const newVal = toText(val);
		if (newVal === value) { return; }
		value = newVal;
		node.textContent = value;
	});
	return () => {
		result.stop();
		node.remove();
	};

}
