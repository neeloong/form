import { Signal } from 'signal-polyfill';
/** @import Store from './index.mjs' */

/**
 *
 * @param {Store} self
 * @param {boolean?} [defState]
 * @param {boolean | ((store: Store) => boolean?) | null} [fn]
 * @param {Signal.Computed<boolean>?} [parent]
 * @returns {[Signal.State<boolean?>, Signal.Computed<boolean>]}
 */
export const createBooleanStates = (self, defState, fn, parent) => {

	const selfState = new Signal.State(typeof defState === 'boolean' ? defState : null);
	/** @type {Signal.Computed<boolean>} */
	let scriptState
	if (typeof fn === 'function') {
		scriptState = new Signal.Computed(() => Boolean(fn(self)))
	} else {
		const def = Boolean(fn)
		scriptState = new Signal.Computed(() => def);
	}

	const getState = () => {
		const s = selfState.get();
		return s === null ? scriptState.get() : s;
	};
	const state = parent
		? new Signal.Computed(() => parent.get() || getState())
		: new Signal.Computed(getState);

	return [selfState, state];

};
