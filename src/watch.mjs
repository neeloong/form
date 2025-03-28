import effect from './effect.mjs';

/**
 * 创建可赋值计算值
 * @template T
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @param {boolean} immediate 是否立即执行一次
 * @returns {() => void}
 */
export default function watch(getter, callback, immediate) {
	let run = false;
	/** @type {any} */
	let value
	return effect(() => {
		const val = getter();
		if (!run) {
			run = true;
			value = val;
			if (immediate) { callback(val); }
			return
		}
		if (Object.is(val, value)) { return; }
		value = val;
		callback(val);
	});
}
