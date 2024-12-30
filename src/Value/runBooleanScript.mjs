import computed from '../computed/index.mjs';
/** @import Value from './index.mjs'; */

/**
 * 
 * @param {*} fn 
 * @param {Set<() => void>} set 
 * @param {(value: boolean) => void} cb 
 * @param {Value} value 
 * @returns 
 */
export default function runBooleanScript(fn, set, cb, value) {
	if (typeof fn !== 'function') {
		if (!fn) { return false; }
		return true;
	}
	const result = computed(() => fn(value), cb);
	set.add(() => result.stop());
	return Boolean(result.value);
}
