import getIndexes from './getIndexes.mjs';
import watchedList from './watchedList.mjs';

/**
 * 标记属性的修改，同时触发监听函数
 * @param {object | Function} target 要标记的对象
 * @param {string | number | boolean | symbol} prop 要标记的属性 特别的，false 表示原型，true 表示成员
 * @returns {void}
 */
export default function markChange(target, prop) {
	const indexes = getIndexes(target, prop);
	if (!indexes) { return; }
	[target, prop] = indexes;
	const watch = watchedList.get(target)?.get(prop);
	if (!watch) { return; }
	for (const w of watch) { w(); }
}
