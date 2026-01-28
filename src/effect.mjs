import { Signal } from 'signal-polyfill';

/**
 * 相应式执行
 * @overload
 * @param {() => void} fn 执行函数
 * @param {null} [signal]
 * @returns {() => void} 取消函数
 */
/**
 * 相应式执行
 * @overload
 * @param {() => void} fn 执行函数
 * @param {AbortSignal} signal
 * @returns {void} 取消函数
 */
/**
 * 相应式执行
 * @overload
 * @param {() => void} fn 执行函数
 * @param {AbortSignal?} [signal]
 * @returns {(() => void) | void} 取消函数
 */
/**
 * 相应式执行
 * @param {() => void} fn 执行函数
 * @param {AbortSignal?} [signal]
 * @returns {(() => void) | void} 取消函数
 */
export default function effect(fn, signal) {
	if (signal?.aborted) { return; }
	let needsEnqueue = true;
	const w = new Signal.subtle.Watcher(() => {
		if (!needsEnqueue) { return; }
		needsEnqueue = false;
		queueMicrotask(() => {
			needsEnqueue = true;
			for (const s of w.getPending()) {
				s.get();
			}
			w.watch();
		});
	});
	const computed = new Signal.Computed(fn);

	w.watch(computed);
	computed.get();
	if (!signal) { return () => { w.unwatch(computed); }; }
	signal.addEventListener('abort', () => {
		w.unwatch(computed);
	}, { once: true });

}
