const regex1 = /^:(index|no|length|state|readonly|disabled|hidden|value)$/
/**
 * @param {import('../Value.mjs').default} schema
 * @param {string | Function} value
 * @param {any} envs
 */
export default function execValue(schema, value, envs) {
	if (!value) {
		 return schema.value;
	}
	if (typeof value !== 'string') {
		// TODO: 执行函数
		return;
	}
	const r1 = regex1.exec(value);
	if (r1) {
		const key = /** @type {'index'|'no'|'length'|'state'|'readonly'|'disabled'|'hidden'|'value'} */(r1[1]);
		return schema[key];
	}
	
	return schema.child(value)?.value
}
