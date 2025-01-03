import { Signal } from "signal-polyfill";

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});

function processPending() {
	needsEnqueue = true;

	for (const s of w.getPending()) {
		s.get();
	}

	w.watch();
}

/**
 * 创建可赋值计算值
 * @template T
 * @param {() => T} getter 取值方法
 * @param {(value: T) => void} callback 取值方法
 * @returns {() => void}
 */
export default function watch(getter, callback) {

	let run = false;
	/** @type {any} */
	let value
	const computed = new Signal.Computed(() => {
		const val = getter();
		if (run && Object.is(val, value)) { return; }
		value = val;
		run = true;
		callback(val);
	});

	w.watch(computed);
	computed.get();

	return () => { w.unwatch(computed); };
}
