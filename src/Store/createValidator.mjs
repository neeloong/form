import { Signal } from 'signal-polyfill';
/** @import Store from './Store.mjs' */
/** @import { Schema } from '../Schema.types.mjs' */
/**
 * 
 * @param {*} v 
 */
function toResult(v) {
	if (!v) { return ''; }
	if (v instanceof Error) { return v.message; }
	if (typeof v !== 'string') { return ''; }
	return v;

}
/**
 * 
 * @param {Store} store 
 * @param {Schema.SyncValidator[]} syncValidators 
 * @returns 
 */
function createSyncValidator(store, syncValidators) {
	return new Signal.Computed(() => {
		const results = [];
		for (const item of syncValidators) {
			try {
				results.push(item(store));
			} catch (e) {
				results.push(e);
			}
		}
		return results.flat().map(toResult).filter(Boolean);
	});
}

/**
 * 
 * @param {Store} store 
 * @param {Schema.AsyncValidator} validator 
 * @returns {[exec: () => Promise<string[]>, cancel: () => void, state: Signal.State<string[]>]}
 */
function createAsyncValidator(store, validator) {
	const state = new Signal.State(/** @type {string[]} */([]));
	/** @type {AbortController?} */
	let ac = null;
	async function exec() {
		ac?.abort();
		ac = new AbortController();
		const signal = ac.signal;
		state.set([]);

		let results = [];
		try {
			results.push(await validator(store, signal));
		} catch (e) {
			results.push(e);
		}
		const list = results.flat().map(toResult).filter(Boolean);
		if (!signal.aborted && list.length) { state.set(list); }
		return list;
	}
	function cancel() {
		ac?.abort();
		ac = null;
		state.set([]);
	}
	return [exec, cancel, state];
}
/**
 * 
 * @param {Store} store 
 * @param {Map<string, Schema.AsyncValidator[]>} eventsValidators 
 * @returns {[Record<string, () => void>, results: Signal.State<string[]>[], stop: () => void, exec: () => Promise<string[]>]}
 */
function createEventsValidator(store, eventsValidators) {
	/** @type {Record<string, () => void>} */
	const eventExecMap = {};
	/** @type {(() => void)[]} */
	const allCancels = [];
	/** @type {Signal.State<string[]>[]} */
	const results = [];
	/** @type {(() => Promise<string[]>)[]} */
	const allExec = [];
	/** @type {WeakMap<Schema.AsyncValidator, () => Promise<string[]>>} */
	const validatorResults = new WeakMap();
	

	for (const [name, validators] of eventsValidators) {
		/** @type {Set<() => Promise<string[]>>} */
		const execSet = new Set();
		for (const validator of validators) {
			const validatorExec = validatorResults.get(validator);
			if (validatorExec) {
				execSet.add(validatorExec);
				continue;
			}
			const [exec, cancel, state] = createAsyncValidator(store, validator);
			allCancels.push(cancel);
			results.push(state);
			allExec.push(exec);

			validatorResults.set(validator, exec);
			execSet.add(exec);
		}
		const list = [...execSet]
		eventExecMap[name] = () => { list.map(f => f()); };
	}

	function stop() {
		for (const c of allCancels) {
			c();
		}
	}

	const execAll = () => Promise.all(allExec.map(exec => exec())).then(v => v.flat());

	return [eventExecMap, results, stop, execAll];
}

/**
 * 
 * @param {Store} store 
 * @param  {...Schema.Validator | undefined | null | (Schema.Validator | undefined | null)[]} validators 
 * @returns {[exec: () => Promise<string[]>, Record<string, () => void>, state: Signal.Computed<string[]>, stop: () => void]}
 */
export default function createValidator(store, ...validators) {

	/** @type {Schema.SyncValidator[]} */
	const syncValidators = [];
	/** @type {Map<string, Schema.AsyncValidator[]>} */
	const eventsValidators = new Map();
	for (const v of validators.flat()) {
		if (!v) { continue; }
		if (typeof v === 'function') {
			syncValidators.push(v);
			continue;
		}
		const { event, validator } = v;
		if (typeof validator !== 'function') { continue; }
		if (!(typeof event === 'string' || Array.isArray(event))) {
			syncValidators.push(/** @type {Schema.SyncValidator} */(validator));
			continue;
		}
		const events = Array.isArray(event) ? new Set(event) : typeof event === 'string' ? [event] : [];
		for (const event of events) {
			const list = eventsValidators.get(event);
			if (list) {
				list.push(validator);
			} else {
				eventsValidators.set(event, [validator]);
			}
		}
	}


	const validatorResult = syncValidators.length
		? createSyncValidator(store, syncValidators)
		: new Signal.Computed(() => /** @type {string[]} */([]));
	if (!eventsValidators.size) {
		return [() => Promise.resolve(validatorResult.get()), {}, validatorResult, () => { }];
	}

	const [eventExecMap, results, stop, exec] = createEventsValidator(store, eventsValidators);

	const errors = new Signal.Computed(() => [validatorResult, ...results].flatMap(v => v.get()));
	const execAll = () => Promise.all([
		validatorResult.get(),
		exec(),
	]).then(v => [...new Set(v.flat())]);
	return [execAll, eventExecMap, errors, stop];
}
