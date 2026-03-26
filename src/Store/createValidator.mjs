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
 * @param {Map<string, Schema.AsyncValidator[]>} eventsValidators 
 * @returns {[Record<string, () => Promise<string[]>>, results: Signal.State<string[]>[], stop: () => void]}
 */
function createEventsValidator(store, eventsValidators) {
	/** @type {Record<string, () => Promise<string[]>>} */
	const eventExecMap = {};
	/** @type {(() => void)[]} */
	const allCancels = [];
	/** @type {Signal.State<string[]>[]} */
	const results = [];
	for (const [name, validators] of eventsValidators) {
		const st = new Signal.State(/** @type {string[]} */([]));
		/**
		 * 
		 * @param {Schema.AsyncValidator} validator 
		 * @param {AbortSignal} signal 
		 */
		async function run(validator, signal) {
			let results = [];
			try {
				results.push(await validator(store, signal));
			} catch (e) {
				results.push(e);
			}
			const list = results.flat().map(toResult).filter(Boolean);
			if (!signal.aborted && list.length) { st.set([...st.get(), ...list]); }
			return list;
		}
		/** @type {AbortController?} */
		let ac = null;
		function exec() {
			ac?.abort();
			ac = new AbortController();
			const signal = ac.signal;
			st.set([]);

			return Promise.all(validators.map(f => run(f, signal))).then(v => v.flat());
		}
		eventExecMap[name] = exec;
		allCancels.push(() => { ac?.abort(); st.set([]); });
		results.push(st);
	}

	function stop() {
		for (const c of allCancels) {
			c();
		}

	}

	return [eventExecMap, results, stop];
}

/**
 * 
 * @param {Store} store 
 * @param  {...Schema.Validator | undefined | null | (Schema.Validator | undefined | null)[]} validators 
 * @returns {[exec: () => Promise<string[]>, Record<string, () => Promise<string[]>>, state: Signal.Computed<string[]>, stop: () => void]}
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
		if (typeof event !== 'string') {
			syncValidators.push(validator);
			continue;
		}
		const list = eventsValidators.get(event);
		if (list) {
			list.push(validator);
		} else {
			eventsValidators.set(event, [validator]);
		}
	}


	const validatorResult = syncValidators.length
		? createSyncValidator(store, syncValidators)
		: new Signal.Computed(() => /** @type {string[]} */([]));
	if (!eventsValidators.size) {
		return [() => Promise.resolve(validatorResult.get()), {}, validatorResult, () => {}];
	}

	const [eventExecMap, results, stop] = createEventsValidator(store, eventsValidators);

	const errors = new Signal.Computed(() => [validatorResult, ...results].flatMap(v => v.get()));
	const execAll = () => Promise.all([
		validatorResult.get(),
		...Object.values(eventExecMap).map(exec => exec()),
	]).then(v => v.flat());
	return [execAll, eventExecMap, errors, stop];
}
