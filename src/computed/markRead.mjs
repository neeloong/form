import getMapValue from './getMapValue.mjs';
import getIndexes from './getIndexes.mjs';
import { read } from './observe.mjs';
/**
 * 标记已读状态
 * @param {object | Function} target
 * @param {string | number | boolean | symbol} prop 要标记的属性
 * @returns {void}
 */
export default function markRead(target, prop) {
	if (!read) { return; }
	const indexes = getIndexes(target, prop);
	if (!indexes) { return; }
	[target, prop] = indexes;
	getMapValue(read, target, () => new Set()).add(prop);
}
