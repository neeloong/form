export { default as markChange } from './markChange.mjs';
export { default as markRead } from './markRead.mjs';
import observe from './observe.mjs';
import watchProp from './watchProp.mjs';

/**
 * 创建可赋值计算值
 * @template T
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} [cb] 选项
 * @returns {{value: T; stop(): void; listen(listener: (value: T) => void): () => void}}
 */
export default function computed(getter, cb) {
	/** @type {Set<(value: T) => void>} */
	const cbList = new Set();
	let stopped = false;
	/** @type {T} */
	let value;
	/** @type {(() => void)[] | null} */
	let cancelList = null
	/** 取消监听 */
	function cancel() {
		if (!cancelList) { return false; }
		const list = cancelList;
		cancelList = null;
		list.forEach(f => f());
		return true;
	}
	function trigger() {
		if (!cancel()) { return; }
		if (stopped) { return; }
		setTimeout(run, 0);
	};
	function run() {
		cancel();
		/** @type {import('./observe.mjs').ReadMap} */
		const thisRead = new Map();
		value = observe(thisRead, getter);
		for (const cb of cbList) {
			cb(value);
		}
		if (stopped) { return; }
		if (!thisRead.size) {
			return;
		}
		cancelList = [...thisRead].map(
			([obj, props]) => [...props].map(p => watchProp(obj, p, trigger))
		).flat();
		return
	}
	run();
	if (cb) { cbList.add(cb); }

	return {
		get value() { return value; },
		stop: () => {
			if (stopped) { return; }
			stopped = true;
			cancel();
		},
		listen(listener) {
			cbList.add(listener);
			return () => {
				cbList.delete(listener);
			}
		}
	};

}
