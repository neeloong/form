import markChange from '../computed/markChange.mjs';
import markRead from '../computed/markRead.mjs';
import Value, { ArrayValue } from '../Value/index.mjs';


/** @typedef {{get(): any; set?(v: any): void; exec?: null; value?: Value; calc?: null; var?: boolean }} ValueDefine */
/** @typedef {{get?: null; exec(...p: any[]): any;  calc?: null}} ExecDefine */
/** @typedef {{get?: null; calc(...p: any[]): any;  exec?: null;}} CalcDefine */
/**
 * 
 * @param {Value} val 
 * @param {string | number} [key] 
 * @returns {Iterable<[string, ValueDefine | ExecDefine | CalcDefine]>}
 */
function *toItem(val, key = '') {
	yield [`${key}`, {get: () => val.value, set: v => val.value = v, value: val}]
	yield [`${key}$value`, {get: () => val.value, set: v => val.value = v}]
	yield [`${key}$state`, {get: () => val.state, set: v => val.state = v}]
	yield [`${key}$index`, {get: () => val.index}]
	yield [`${key}$no`, {get: () => val.no}]
	yield [`${key}$length`, {get: () => val.length}]
	yield [`${key}$readonly`, {get: () => val.readonly}]
	yield [`${key}$hidden`, {get: () => val.hidden}]
	yield [`${key}$disabled`, {get: () => val.disabled}]
	if (!(val instanceof ArrayValue)) { return; }
	yield [`${key}$insert`, {exec: (index, value) => val.insert(index, value)}]
	yield [`${key}$add`, {exec: (v) => val.add(v)}]
	yield [`${key}$remove`, {exec: (index) => val.remove(index)}]
	yield [`${key}$move`, {exec: (from, to) => val.move(from, to)}]
	yield [`${key}$exchange`, {exec: (a, b) => val.exchange(a, b)}]
}
export default class Environment {
	/**
	 * @param {string | Function} value
	 */
	exec(value) {
		if (typeof value === 'string') {
			const item = this.#items[value];
			if (typeof item?.get !== 'function') { return }
			return item.get();
		}
		if (typeof value === 'function') {
			return value(this.getters);
		}
	}
	/**
	 * @param {string | (($event: any, global: any) => any)} event
	 * @returns {(($event: any, global: any) => any)?}
	 */
	getEvent(event) {
		if (typeof event === 'function') { return event }
		const item = this.#items[event];
		if (!item) { return null }
		const {exec} = item;
		if (typeof exec !== 'function') { return null }
		return exec

	}
	/**
	 * 
	 * @param {Environment | Record<string, Value | {get?(): any; set?(v: any): void; exec(...p: any[]): any; calc(...p: any[]): any }>} [global] 
	 */
	constructor(global) {
		if (global instanceof Environment) {
			this.#global = global.#global;
			const schemaItems = this.#schemaItems;
			for (const [k, v] of Object.entries(global.#schemaItems)) {
				schemaItems[k] = v;
			}
			const explicit = this.#explicit;
			for (const [k, v] of Object.entries(global.#explicit)) {
				explicit[k] = v;
			}
			return;
		}
		const items = Object.create(null);
		this.#global = items;
		if (!global) { return }
		if (typeof global !== 'object') { return; }
		for (const [key, value] of Object.entries(global)) {
			if (!key || key.includes('$')) { continue; }
			if (!value || typeof value !== 'object') { return; }
			if (value instanceof Value) {
				for (const [k, v] of toItem(value, key)) {
					items[k] = v;
				}
				continue;
			}
			const {get,set,exec,calc} = value;
			if (typeof get === 'function') {
				items[key] = typeof set === 'function' ? {get,set} : {get};
				continue;
			}
			if (typeof calc === 'function') {
				items[key] = {calc};
				continue;
			}
			if (typeof exec === 'function') {
				items[key] = {exec};
				continue;
			}
		}
	}
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#global
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#schemaItems = Object.create(null);
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#explicit = Object.create(null);
	/** @type {Value?} */
	#schema = null
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>?} */
	#allItems = null
	get #items() {
		const ai = this.#allItems;
		if (ai) { return ai; }
		/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
		const ais = Object.create(null, Object.getOwnPropertyDescriptors({
			...this.#schemaItems,
			...this.#global,
			...this.#explicit,
		}));
		const schema = this.#schema;
		if (schema) {
			for (const [key, item] of toItem(schema)) {
				ais[key] = item;
			}
		}
		this.#allItems = ais;
		return ais;
	}
	/**
	 * 
	 * @param {Value} schema 
	 */
	setValue(schema) {
		const cloned = new Environment(this);
		cloned.#schema = schema;
		if (schema instanceof ArrayValue) { return cloned; }
		const items = cloned.#schemaItems;
		for (const [name, val] of schema) {
			for (const [b,x] of toItem(val, name)) {
				items[b] = x;
			}
		}
		return cloned;
	}
	/**
	 * 
	 * @param {Record<string, string>} aliases 
	 * @param {Record<string, any>} vars 
	 */
	set(aliases, vars) {
		if (Object.keys(aliases).length + Object.keys(vars).length === 0) { return this; }
		const cloned = new Environment(this);
		cloned.#schema = this.#schema;
		const explicit = cloned.#explicit;
		const items = this.#items;
		/**
		 * 
		 * @param {string} key 
		 * @param {ValueDefine | ExecDefine | CalcDefine} item 
		 */
		const add = (key, item) => {
			if (!item.get || !item.value) {
				explicit[key] = item;
				items[key] = item;
				return;
			}
			for (const [k, it] of toItem(item.value, key)) {
				explicit[k] = it;
				items[k] = it;
			}
		}
		for (const [k,v] of Object.entries(aliases)) {
			const item = this.#items[v];
			if (!item) { continue; }
			add(k, item);
		}
		for (const [k,v] of Object.entries(vars)) {
			/** @type {any} */
			let val = null;
			if (typeof v === 'function') {
				val = v(this.getters);
			} else if (v && typeof v === 'string') {
				const item = this.#items[v];
				if (item.get) {
					val = item.get();
				}
			}
			add(k, {
				get: () => { markRead(explicit, k); return val; },
				set: (v) => {
					if (v === val) { return; }
					val = v;
					markChange(explicit, k);
				},
				var: true,
			});
		}
		return cloned;
	}

	/** @type {Record<string, any>?} */
	#all = null;
	get all() {
		const gt = this.#all;
		if (gt) { return gt; }
		/** @type {Record<string, any>} */
		const ngt = {};
		for (const [key, item] of Object.entries(this.#items)) {
			if (item.get) {
				Object.defineProperty(ngt, key, {
					get: item.get,
					set: item.set,
					configurable: true,
					enumerable: true,
				});
			} else if (item.calc) {
				Object.defineProperty(ngt, key, {
					value: item.calc,
					writable: false,
					configurable: true,
					enumerable: false,
				});
			} else {
				Object.defineProperty(ngt, key, {
					value: item.exec,
					writable: false,
					configurable: true,
					enumerable: false,
				});
			}
		}
		this.#all = ngt;
		return ngt;
	}
	/** @type {Record<string, any>?} */
	#getters = null;
	get getters() {
		const gt = this.#getters;
		if (gt) { return gt; }
		/** @type {Record<string, any>} */
		const ngt = {};
		for (const [key, item] of Object.entries(this.#items)) {
			if (item.get) {
				Object.defineProperty(ngt, key, {
					get: item.get,
					configurable: true,
					enumerable: true,
				});
			} else if (item.calc) {
				Object.defineProperty(ngt, key, {
					value: item.calc,
					writable: false,
					configurable: true,
					enumerable: false,
				});
			}
		}
		this.#getters = ngt;
		return ngt;
	}
}
