import computed from '../computed/index.mjs';
import execSchema from './execSchema.mjs';
import toText from './toText.mjs';

/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {string | Function} template
 * @param {import('../schema.mjs').Schema} schema
 * @param {any} envs
 */
export default function renderTemplate(parent, next, template, schema, envs) {
	const node = parent.insertBefore(document.createTextNode(''), next);
	const result = computed(() => execSchema(schema, template, envs));
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
