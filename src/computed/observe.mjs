/** @import { ReadMap } from './types.mjs' */
/**
 * 已被读取的
 * @type {ReadMap?}
 */
export let read = null;

/**
 * @template T
 * @param {ReadMap} map
 * @param {() => T} fn
 * @returns {T}
 */
export default function observe(map, fn) {
	const oldRead = read;
	read = map;
	try {
		return fn();
	} finally {
		read = oldRead;
	}
}
