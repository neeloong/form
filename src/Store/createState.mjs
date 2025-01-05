import { Signal } from 'signal-polyfill';
/** @import Store from './index.mjs' */

/**
 * @template T
 * @param {Store} self
 * @param {(v: any) => any?} toValue
 * @param {T?} [defState]
 * @param {T | ((store: Store, root: Store) => T?) | null} [fn]
 * @returns {[Signal.State<T?>, Signal.Computed<T?>]}
 */
export default function createState(self, toValue, defState, fn) {

	const selfState = new Signal.State(toValue(defState));
	/** @type {Signal.Computed<T>} */
	let scriptState
	if (typeof fn === 'function') {
		const f = /** @type {(store: Store, root: Store) => T?} */(fn);
		scriptState = new Signal.Computed(() => toValue(f(self, self.root)))
	} else {
		const def = toValue(fn);
		scriptState = new Signal.Computed(() => def);
	}

	const state = new Signal.Computed(() => {
		const s = selfState.get();
		return s === null ? scriptState.get() : s;
	});

	return [selfState, state];

};
