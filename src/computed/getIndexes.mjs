/**
 * @param {any} target
 * @param {string | number | symbol | boolean} prop
 * @returns {[object | Function, string | boolean | symbol] | null}
 */
export default function getIndexes(target, prop) {
	if (!target) { return null; }
	if (typeof target !== 'function' && typeof target !== 'object') {
		return null;
	}
	if (typeof prop === 'number') { return [target, String(prop)]; }
	if (typeof prop === 'symbol') { return [target, prop]; }
	if (typeof prop === 'string') { return [target, prop]; }
	if (typeof prop === 'boolean') { return [target, prop]; }
	return null;
}
