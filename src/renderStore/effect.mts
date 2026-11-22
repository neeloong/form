import { Signal } from 'signal-polyfill';

/** 相应式执行 */
export default function effect(
	fn: () => void,
	signal?: AbortSignal | null,
): void {
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
	signal?.addEventListener('abort', () => {
		w.unwatch(computed);
	}, { once: true });

}
