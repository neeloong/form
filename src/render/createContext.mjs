/** @import { Component } from '../types.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
/** @import { ComponentHandler } from './types.mjs' */
/** @import Store from '../Store/index.mjs' */
/** @import Environment from './Environment/index.mjs' */

import { Signal } from 'signal-polyfill';
import EventEmitter from './EventEmitter.mjs';
import watch from '../watch.mjs';
import { bindFilters, findFilters } from './filter.mjs';

/**
 * 
 * @param {Component | string} component 
 * @param {Environment} env 
 * @param {Store?} store 
 * @param {((store: Store, el: Element | StoreLayout.Relatedness) => () => void)?} [relate]
 * @returns 
 */
export default function createContext(component, env, store, relate) {
	const tag = typeof component === 'string' ? component : component.tag;
	const { attrs, events } = typeof component !== 'string' && component || { attrs: null, events: null };

	let destroyed = false;
	const destroyedState = new Signal.State(false);
	let mounted = false;
	const mountedState = new Signal.State(false);
	/** @type {Record<string, Signal.State<any> | void>} */
	const attrStates = Object.create(null);
	const tagAttrs = Object.create(null);

	/** @type {Set<() => void>} */
	const cancelFns = new Set();

	/** @type {[string, ($event: any) => void, AddEventListenerOptions][]} */
	const allEvents = [];
	const stateEmitter = new EventEmitter();
	/** @type {Component.Context} */
	const context = {
		events: allEvents,
		props: attrs ? new Set(Object.entries(attrs).filter(([, a]) => a.isProp).map(([e]) => e)) : null,
		attrs: tagAttrs,
		watch(name, fn) {
			if (destroyed) { return () => { }; }
			const state = attrStates[name];
			if (!state) { return () => { }; }
			let old = state.get();
			const w = watch(() => state.get(), v => {
				const o = old;
				old = v;
				fn(v, o, name);
			}, true);
			cancelFns.add(w);

			return () => {
				cancelFns.delete(w);
				w();
			};
		},
		relate(el) {
			if (!store || !relate || destroyed) { return () => { }; }
			try {
				const w = relate(store, el);
				if (typeof w !== 'function') { return () => { }; }
				cancelFns.add(w);
				return () => {
					cancelFns.delete(w);
					w();
				};
			} catch {
				return () => { };
			}

		},
		get destroyed() { return destroyedState.get(); },
		get init() { return mountedState.get(); },
		listen(name, listener) { return stateEmitter.listen(name, listener); },
	};
	/** @type {ComponentHandler} */
	const handler = {
		tag,
		set(name, value) {
			if (attrs && !(name in attrs)) { return; }
			let state = attrStates[name];
			if (state) {
				state.set(value);
				return;
			}
			const s = new Signal.State(value);
			attrStates[name] = s;
			Object.defineProperty(tagAttrs, name, {
				configurable: true,
				enumerable: true,
				get: s.get.bind(s),
			});
		},
		addEvent(name, fn) {
			if (typeof fn !== 'function') { return; }
			const [e, ...fs] = name.split('.').filter(Boolean);
			const filters = events ? events[e].filters : {};
			if (!filters) { return; }
			/** @type {AddEventListenerOptions} */
			const options = {};
			const filterFns = findFilters(fs, filters, options);
			allEvents.push([e, bindFilters(env, fn, filterFns), options]);
		},
		destroy() {
			if (destroyed) { return; }
			destroyed = true;
			destroyedState.set(true);
			for (const w of cancelFns) {
				w();
			}
			stateEmitter.emit('destroy');
		},
		mount() {
			if (mounted) { return; }
			mounted = true;
			mountedState.set(true);
			stateEmitter.emit('init', { events: allEvents });
		},

	};
	return { context, handler };
}
