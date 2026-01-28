import effect from './effect.mjs';

/**
 * 创建可赋值计算值
 * @template T
 * @overload
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @param {boolean} immediate 是否立即执行一次
 * @param {null} [signal]
 * @returns {() => void}
 */

/**
 * 创建可赋值计算值
 * @template T
 * @overload
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @param {boolean} immediate 是否立即执行一次
 * @param {AbortSignal?} [signal]
 * @returns {(() => void) | void}
 */
/**
 * 创建可赋值计算值
 * @template T
 * @overload
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @param {boolean} immediate 是否立即执行一次
 * @param {AbortSignal} signal
 * @returns {void}
 */
/**
 * 创建可赋值计算值
 * @template T
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @param {boolean} immediate 是否立即执行一次
 * @param {AbortSignal?} [signal]
 * @returns {(() => void) | void}
 */
export default function watch(getter, callback, immediate, signal) {
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
	}, signal);
}
