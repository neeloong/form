import { Signal } from 'signal-polyfill';
import Store, { ArrayStore } from '../Store/index.mjs';
import watch from '../watch.mjs';

/** @typedef {{get(): any; set?(v: any): void; exec?: null; store?: Store; calc?: null; }} ValueDefine */
/** @typedef {{get?: null; exec(...p: any[]): any;  calc?: null}} ExecDefine */
/** @typedef {{get?: null; calc(...p: any[]): any;  exec?: null;}} CalcDefine */
/**
 * 
 * @param {Store} val 
 * @param {string | number} [key] 
 * @returns {Iterable<[string, ValueDefine | ExecDefine | CalcDefine]>}
 */
function *toItem(val, key = '', sign = '$') {
	yield [`${key}`, {get: () => val.value, set: v => val.value = v, store: val}]
	yield [`${key}${sign}value`, {get: () => val.value, set: v => val.value = v}]
	yield [`${key}${sign}state`, {get: () => val.state, set: v => val.state = v}]
	yield [`${key}${sign}null`, {get: () => val.null}]
	yield [`${key}${sign}index`, {get: () => val.index}]
	yield [`${key}${sign}no`, {get: () => val.no}]
	yield [`${key}${sign}length`, {get: () => val.length}]
	yield [`${key}${sign}creatable`, {get: () => val.creatable}]
	yield [`${key}${sign}immutable`, {get: () => val.immutable}]
	yield [`${key}${sign}new`, {get: () => val.new}]
	yield [`${key}${sign}editable`, {get: () => val.editable}]
	yield [`${key}${sign}hidden`, {get: () => val.hidden}]
	yield [`${key}${sign}clearable`, {get: () => val.clearable}]
	yield [`${key}${sign}required`, {get: () => val.required}]
	yield [`${key}${sign}disabled`, {get: () => val.disabled}]
	yield [`${key}${sign}readonly`, {get: () => val.readonly}]
	if (!(val instanceof ArrayStore)) { return; }
	yield [`${key}${sign}insert`, {exec: (index, value) => val.insert(index, value)}]
	yield [`${key}${sign}add`, {exec: (v) => val.add(v)}]
	yield [`${key}${sign}remove`, {exec: (index) => val.remove(index)}]
	yield [`${key}${sign}move`, {exec: (from, to) => val.move(from, to)}]
	yield [`${key}${sign}exchange`, {exec: (a, b) => val.exchange(a, b)}]
}
/**
 * 
 * @param {Store?} parent 
 * @param {Store} val 
 * @param {string | number} [key] 
 * @returns {Iterable<[string, ValueDefine | ExecDefine | CalcDefine]>}
 */
function *toParentItem(parent, val, key = '', sign = '$') {
	if (!(parent instanceof ArrayStore)) {
		yield [`${key}${sign}upMovable`, {get: () => false}];
		yield [`${key}${sign}downMovable`, {get: () => false}]
		return
	}
	yield [`${key}${sign}upMovable`, {get: () => {
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s <= 0) { return false; }
		return true;
	}}];
	yield [`${key}${sign}downMovable`, {get: () => {
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s >= parent.length - 1) { return false; }
		return true;
	}}]
	yield [`${key}${sign}remove`, {exec: () => parent.remove(Number(val.index))}]
	yield [`${key}${sign}upMove`, {exec: () => {
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s <= 0) { return; }
		parent.move(s, s - 1);
	}}];
	yield [`${key}${sign}downMove`, {exec: () => {
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s >= parent.length - 1) { return; }
		parent.move(s, s + 1);
	}}]
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
	 * @param {string | Function} value
	 * @param {(value: any) => void} cb 
	 */
	watch(value, cb) { return watch(() => this.exec(value), cb); }

	/**
	 * @param {string} name
	 * @param {string} type
	 * @param {(value: any) => void} cb 
	 */
	bind(name, type, cb) {
		const item = this.#items[name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) { return; }
		switch(type) {
			case 'value': return watch(() => store.value, cb);
			case 'state': return watch(() => store.state, cb);
			case 'required': return watch(() => store.required, cb);
			case 'clearable': return watch(() => store.clearable, cb);
			case 'hidden': return watch(() => store.hidden, cb);
			case 'disabled': return watch(() => store.disabled, cb);
			case 'readonly': return watch(() => store.readonly || !store.editable, cb);
		}
	}
	/**
	 * @param {string} name
	 * @returns {Record<string, ((cb: (value: any) => void) => () => void) | void> | void}
	 */
	bindAll(name) {
		const item = this.#items[name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) {
			const get = item.get;
			if (typeof get !== 'function') { return; }
			return { '$value': cb => watch(get, cb) }
		}
		return {
			'$value': cb => watch(() => store.value, cb),
			'$state': cb => watch(() => store.state, cb),
			'$required': cb => watch(() => store.required, cb),
			'$clearable': cb => watch(() => store.clearable, cb),
			'$hidden': cb => watch(() => store.hidden, cb),
			'$disabled': cb => watch(() => store.disabled, cb),
			'$readonly': cb => watch(() => store.readonly || !store.editable, cb),
		}
	}
	/**
	 * @param {string} name
	 * @param {string} type
	 * @returns {((value: any) => void) | void} 
	 */
	bindSet(name, type) {
		const item = this.#items[name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) { return; }
		switch(type) {
			case 'value': return v => {store.value = v; };
			case 'state': return v => {store.state = v; };
		}
	}
	/**
	 * @param {string} name
	 * @returns {Record<string, ((value: any) => void) | void> | void} 
	 */
	bindStateAllSet(name) {
		const item = this.#items[name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) { 
			const set = item.set;
			if (typeof set !== 'function') { return; }
			return { '$value': set }
		 }
		return {
			'$value': v => {store.value = v; },
			'$state': v => {store.state = v; },
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
		const {exec, calc} = item;
		if (typeof exec === 'function') { return exec }
		if (typeof calc === 'function') { return calc }
		return null

	}
	/**
	 * 
	 * @param {Environment | Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }>?} [global] 
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
			if (value instanceof Store) {
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
	/** @type {Store?} */
	#store = null
	/** @type {Store?} */
	#parent = null
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
		const store = this.#store;
		const parent = this.#parent;
		if (store) {
			for (const [key, item] of toItem(store)) {
				ais[key] = item;
			}
			for (const [key, item] of toParentItem(parent, store)) {
				ais[key] = item;
			}
		}
		this.#allItems = ais;
		return ais;
	}
	/**
	 * 
	 * @param {Store} store 
	 * @param {Store} [parent] 
	 */
	setValue(store, parent) {
		const cloned = new Environment(this);
		cloned.#store = store;
		if (parent) { cloned.#parent = parent; }
		if (store instanceof ArrayStore) { return cloned; }
		const items = cloned.#schemaItems;
		for (const [name, val] of store) {
			for (const [b, x] of toItem(val, name)) {
				items[b] = x;
			}
			for (const [b, x] of toItem(val, name, '$$')) {
				items[b] = x;
			}
		}
		if (parent instanceof ArrayStore) {

		}
		return cloned;
	}
	/**
	 * 
	 * @param {Record<string, string | Function>} aliases 
	 * @param {Record<string, any>} vars 
	 */
	set(aliases, vars) {
		if (Object.keys(aliases).length + Object.keys(vars).length === 0) { return this; }
		const cloned = new Environment(this);
		cloned.#store = this.#store;
		cloned.#parent = this.#parent;
		const explicit = cloned.#explicit;
		const items = cloned.#items;
		for (const [key, name] of Object.entries(aliases)) {
			if (typeof name === 'function') {
				const getters = cloned.getters;
				cloned.#getters = null;
				const val = new Signal.Computed(() => name(getters));
				explicit[key] = items[key] = {
					get: () => { return val.get(); },
				};
				continue;
			}
			const item = items[name];
			if (!item) { continue; }
			if (!item.get || !item.store) {
				explicit[key] = items[key] = item;
				continue;
			}
			for (const [k, it] of toItem(item.store, key)) {
				explicit[k] = items[k] = it;
			}
		}
		for (const [k,v] of Object.entries(vars)) {
			
			const val = new Signal.State(/** @type {any} */(null));
			if (typeof v === 'function') {
				const settable = cloned.settable;
				cloned.#settable = null;
				val.set(v(settable));
			} else if (v && typeof v === 'string') {
				const item = items[v];
				if (!item.get) { continue }
				val.set(item.get());
			}
			explicit[k] = items[k] = {
				get: () => { return val.get(); },
				set: (v) => { val.set(v) },
			};
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
	#settable = null;
	get settable() {
		const gt = this.#settable;
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
			}
		}
		this.#settable = ngt;
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
