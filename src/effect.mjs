import { Signal } from 'signal-polyfill';

/**
 * 相应式执行
 * @param {() => void} fn 执行函数
 * @returns {() => void} 取消函数
 */
export default function effect(fn) {
	let needsEnqueue = true;
	const w = new Signal.subtle.Watcher(() => {
		if (!needsEnqueue) { return }
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

	return () => { w.unwatch(computed); };
}
