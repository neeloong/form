import { Signal } from 'signal-polyfill';

/**
 * 
 * @param {() => void} fn 
 * @returns {() => void}
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
