import { Signal } from 'signal-polyfill';
/** @import Store from './Store.mjs' */
/** @import { AsyncValidator, Validator } from '../types.mjs' */
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
 * @param  {...Validator | undefined | null | (Validator | undefined | null)[]} validators 
 * @returns 
 */
export function createValidator(store, ...validators) {
	const allValidators = validators.flat().filter(v => typeof v === 'function');
	if (!allValidators.length) {
		return new Signal.Computed(() => /** @type {string[]} */([]));
	}
	return new Signal.Computed(() => {
		const results = [];
		for (const validator of allValidators) {
			try {
				results.push(validator(store));
			} catch (e){
				results.push(e);
			}
		}
		return results.flat().map(toResult).filter(Boolean);
	})
}
/**
 * 
 * @param {Store} store 
 * @param  {...AsyncValidator | undefined | null | (AsyncValidator | undefined | null)[]} validators 
 * @returns {[exec: () => Promise<string[]>, state: Signal.Computed<string[]>, stop: () => void]}
 */
export function createAsyncValidator(store, ...validators) {
	const allValidators = validators.flat().filter(v => typeof v === 'function');
	if (!allValidators.length) {
		return [
			()=>Promise.resolve([]),
			new Signal.Computed(() => /** @type {string[]} */([])),
			() => {}
		];
	}
	const st = new Signal.State(/** @type {string[]} */([]));
	/**
	 * 
	 * @param {AsyncValidator} validator 
	 * @param {AbortSignal} signal 
	 */
	async function run(validator, signal) {
		let results = [];
		try {
			results.push(await validator(store, signal));
		} catch (e){
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
		
		return Promise.all(allValidators.map(f => run(f, signal))).then(v => v.flat());
	}
	return [exec, new Signal.Computed(() => st.get()), () => {ac?.abort(); st.set([]);}]
}

/**
 * 
 * @param  {...Signal.Computed<string[]>} v 
 * @returns 
 */
export function merge(...v) {
	const list = /** @type {Signal.Computed<string[]>[]} */(v.filter(Boolean))
	return new Signal.Computed(() => list.flatMap(v => v.get()));
}
