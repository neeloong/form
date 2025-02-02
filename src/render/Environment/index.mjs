import { Signal } from 'signal-polyfill';
import Store from '../../Store/index.mjs';
import watch from '../../watch.mjs';
import bindableSet from './bindableSet.mjs';
import toItem from './toItem.mjs';
import toParentItem from './toParentItem.mjs';
import setStore from './setStore.mjs';
import toGlobal from './toGlobal.mjs';
import addStore from './addStore.mjs';
/** @import * as Layout from '../../Layout/index.mjs' */


/** @typedef {{get(): any; set?(v: any): void; exec?: null; store?: Store; calc?: null; }} ValueDefine */
/** @typedef {{get?: null; exec(...p: any[]): any;  calc?: null}} ExecDefine */
/** @typedef {{get?: null; calc(...p: any[]): any;  exec?: null;}} CalcDefine */

/**
 * @template {Store} [T=Store]
 */
export default class Environment {
	/**
	 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} value
	 */
	exec({name, calc, value}) {
		if (typeof name === 'string') {
			const item = this.#items[name];
			if (typeof item?.get !== 'function') { return }
			return item.get();
		}
		if (typeof calc === 'function') {
			return calc(this.getters);
		}
		return value;
	}
	/**
	 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} value
	 */
	get({name, calc, value}) {
		if (typeof name === 'string') {
			const item = this.#items[name];
			if (typeof item?.get !== 'function') { return }
			const{get, set} = item;
			return {get, set};
		}
		if (typeof calc === 'function') {
			const c = new Signal.Computed(() => calc(this.getters))
			return {get: () => c.get() };
		}
		return {get: () => value };
	}
	/**
	 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} value
	 * @param {(value: any) => void} cb 
	 */
	watch(value, cb) { return watch(() => this.exec(value), cb, true); }

	/**
	 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Null | null} [en]
	 */
	enum(en) {
		if (!en) { return true; }
		const {name, calc} = en;
		if (typeof calc === 'function') { return () => calc(this.getters); }
		if (typeof name === 'string') {
			const item = this.#items[name];
			if (typeof item?.get !== 'function') { return null }
			const store = item.store;
			return store instanceof Store ? store : item.get;
		}
		return this.store;
	}
	/**
	 * @param {string | boolean | null} [name]
	 */
	getStore(name) {
		if (!name) { return null; }
		const item = this.#items[name === true ? '' : name];
		return item?.get && item.store || null
	}

	/**
	 * @param {string | true} name
	 * @param {string} type
	 * @param {(value: any) => void} cb 
	 */
	bind(name, type, cb) {
		const item = this.#items[name === true ? '' : name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) {
			switch(type) {
				case 'value': return watch(() => item.get(), cb, true);
			}
			return;
		}
		// @ts-ignore
		if (bindableSet.has(type)) {
			// @ts-ignore
			return watch(() => store[type], cb, true);
		}
	}
	/**
	 * @param {string | true} name
	 * @returns {Record<string, ((cb: (value: any) => void) => () => void) | void> | void}
	 */
	bindAll(name) {
		const item = this.#items[name === true ? '' : name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) {
			const get = item.get;
			if (typeof get !== 'function') { return; }
			return { '$value': cb => watch(get, cb, true) }
		}
		/** @type {Record<string, ((cb: (value: any) => void) => () => void) | void> | void} */
		const res = Object.fromEntries([...bindableSet].map(v => [
			`$${v}`, cb => watch(() => store[v], cb, true)
		]));
		return res;
	}
	/**
	 * @param {string | true} name
	 * @returns {Record<string, {get(): any; set?(v: any): void}> | void}
	 */
	getBindAll(name) {
		const item = this.#items[name === true ? '' : name];
		if (!item?.get) { return {}; }
		const { store } = item;
		if (!store) {
			const { get, set } = item;
			return { '$value': {get,set} }
		}
		/** @type {Record<string, {get(): any; set?(v: any): void}> | void} */
		const res = Object.fromEntries([...bindableSet].map(v => [
			`$${v}`, v === 'value' || v === 'state' ? {
				get: () => store[v], 
				set: (s)=>{store[v] = s}
			} : {
				get: () => store[v], 
			}
		]));
		return res;
	}
	/**
	 * @param {string | true} name
	 * @param {string} type
	 * @returns {((value: any) => void) | void} 
	 */
	bindSet(name, type) {
		const item = this.#items[name === true ? '' : name];
		if (!item?.get) { return; }
		const { store } = item;
		if (!store) { return; }
		switch(type) {
			case 'value': return v => {store.value = v; };
			case 'state': return v => {store.state = v; };
		}
	}
	/**
	 * @param {string | true} name
	 * @returns {Record<string, (value: any) => void> | void} 
	 */
	bindEvents(name) {
		const item = this.#items[name === true ? '' : name];
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
			'$input': v => {store.emit('input', v); },
			'$change': v => {store.emit('change', v); },
			'$click': v => {store.emit('click', v); },
			'$focus': v => {store.emit('focus', v); },
			'$blur': v => {store.emit('blur', v); },
			'$reset': v => {store.reset(); },
			// @ts-ignore
			'$validate': v => {store.validate(v ? [] : null); },
		}
	}

	/**
	 * @param {Layout.Node.Name | Layout.Node.Event} event
	 * @returns {Layout.EventListener?}
	 */
	getEvent({name, event}) {
		if (typeof event === 'function') { return event }
		const item = this.#items[name];
		if (!item) { return null }
		const {exec, calc} = item;
		if (typeof exec === 'function') { return exec }
		if (typeof calc === 'function') { return calc }
		return null

	}
	/**
	 * @param {T} store
	 * @param {Environment | Record<string, Store | {get?(): any; set?(v: any): void; exec?(...p: any[]): any; calc?(...p: any[]): any }>?} [global] 
	 */
	constructor(store, global) {
		this.store = store;
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
		setStore(this.#schemaItems, store);
		this.#global = toGlobal(global);
	}
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#global
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#schemaItems = Object.create(null);
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	#explicit = Object.create(null);
	/** @readonly @type {T} */
	store
	/** @type {Record<string, any>?} */
	#object = null
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
		const store = this.store;
		const parent = this.#parent;
		const object = this.#object;
		if (object) {
			for (const k of Object.keys(object)) {
				ais[`$${k}`] = {get: () => object[k]};
			}
		} else {
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
	 * @param {Store} parent 
	 */
	setStore(store, parent) {
		const cloned = new Environment(store, this);
		if (parent) { cloned.#parent = parent; }
		setStore(cloned.#schemaItems, store, parent);
		return cloned;
	}
	/**
	 * 
	 * @param {string?} [name] 
	 */
	child(name) {
		if (!name) { return this; }
		const store = this.store.child(name);
		if (!store) { return null; }
		const cloned = new Environment(store, this);
		setStore(cloned.#schemaItems, store);
		return cloned;
	}
	/**
	 * 
	 * @param {Layout.Node} template 
	 * @param {Layout.Node} source 
	 * @param {Environment} sourceEnv 
	 * @param {string | null | boolean} [bind] 
	 */
	params({params}, {attrs}, sourceEnv, bind) {
		/** @type {Store} */
		let store = this.store;
		if (bind === true) {
			store = sourceEnv.store;
		} else if (bind) {
			const item = sourceEnv.#items[bind];
			const s = item?.get && item.store;
			if (s) { store = s; }
		}
		if (Object.keys(params).length === 0) { return this; }
		const cloned = new Environment(store, this);
		cloned.#parent = this.#parent;
		cloned.#object = this.#object;
		const explicit = cloned.#explicit;
		const items = cloned.#items;
		for (const [key, param] of Object.entries(params)) {
			const attr = key in attrs ? attrs[key] : null;
			if (attr) {
				const {name, calc, value} = attr;
				if (name) {
					const item = sourceEnv.#items[name];
					if (!item?.get) { continue; }
					if (!item.store) {
						explicit[key] = items[key] = item;
						continue;
					}
					for (const [k, it] of toItem(item.store, key)) {
						explicit[k] = items[k] = it;
					}
					continue;
				} else if (typeof calc === 'function') {
					const val = new Signal.Computed(() => calc(sourceEnv.getters));
					explicit[key] = items[key] = {
						get: () => { return val.get(); },
					};
					continue;
				} else {
					explicit[key] = items[key] = {get: () => value};
				}
				continue;
			} else {
				const {name, calc} = param;
				if (typeof calc === 'function') {
					const getters = cloned.getters;
					cloned.#getters = null;
					const val = new Signal.Computed(() => calc(getters));
					explicit[key] = items[key] = {
						get: () => { return val.get(); },
					};
					continue;
				} else if (name) {
					const item = items[name];
					if (!item?.get) { continue; }
					if (!item.store) {
						explicit[key] = items[key] = item;
						continue;
					}
					for (const [k, it] of toItem(item.store, key)) {
						explicit[k] = items[k] = it;
					}
					continue;
				}
			}
		}
		return cloned;
	}
	/** @param {Record<string, any>} object */
	setObject(object) {
		const cloned = new Environment(this.store, this);
		cloned.#object = object;
		return cloned;
	}
	/**
	 * 
	 * @param {Record<string, Layout.Node.Name | Layout.Node.Calc>} aliases 
	 * @param {Record<string, Layout.Node.Null | Layout.Node.Name | Layout.Node.Calc>} vars 
	 */
	set(aliases, vars) {
		if (Object.keys(aliases).length + Object.keys(vars).length === 0) { return this; }
		const cloned = new Environment(this.store, this);
		cloned.#parent = this.#parent;
		cloned.#object = this.#object;
		const explicit = cloned.#explicit;
		const items = cloned.#items;
		for (const [key, {name, calc}] of Object.entries(aliases)) {
			if (typeof calc === 'function') {
				const getters = cloned.getters;
				cloned.#getters = null;
				const val = new Signal.Computed(() => calc(getters));
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
		for (const [k,{name, calc}] of Object.entries(vars)) {
			
			const val = new Signal.State(/** @type {any} */(null));
			if (typeof calc === 'function') {
				const settable = cloned.settable;
				cloned.#settable = null;
				val.set(calc(settable));
			} else if (name) {
				const item = items[name];
				if (!item?.get) { continue }
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
		addStore(this.store, ngt);
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
		addStore(this.store, ngt);
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
		addStore(this.store, ngt);
		this.#getters = ngt;
		return ngt;
	}
}
