import getMapValue from './getMapValue.mjs';
import getIndexes from './getIndexes.mjs';
import watchedList from './watchedList.mjs';
/**
 * 观察对象属性的变化
 * @param {object | Function} target 要观察的对象
 * @param {string | number | boolean | symbol} prop 要观察的属性名 特别的，false 表示原型，true 表示成员
 * @param {() => void} cb
 * @returns {() => void}
 */
export default function watchProp(target, prop, cb) {
	if (typeof cb !== 'function') { return  () => {}; }
	const indexes = getIndexes(target, prop);
	if (!indexes) { return () => {}; }
	[target, prop] = indexes;

	const key = prop;
	const map = getMapValue(watchedList, target, () => new Map());
	const list = getMapValue(map, key, () => new Set());
	const item = cb;
	list.add(item);
	let removed = false;
	return () => {
		if (removed) { return; }
		removed = true;

		// 从当前列表中移除
		list.delete(item);

		// 从属性关联中删除
		if (list.size) { return; }
		if (!map) { return; }
		map.delete(key);

		// 映射列表中删除
		if (map.size) { return; }
		watchedList.delete(target);
	};
}
