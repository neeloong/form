/** @import Environment from './Environment/index.mjs' */
/** @import { Enhancement } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */
import { Signal } from 'signal-polyfill';

/**
 * 
 * @param {object} obj 
 * @param {string} name 
 * @returns 
 */
const hasOwnProperty = (obj, name) => Object.prototype.hasOwnProperty.call(obj, name);
/**
 * @param {any} tag
 * @param {Record<string, Layout.Enhancement>} enhancementDefine
 * @param {Environment} env
 * @param {Record<string, Enhancement>} enhancements
 * @param {Element} root
 * @param {Element?} [slot]
 */
export default function bindEnhancements(tag, enhancementDefine, env, enhancements, root, slot) {

	let bk = new Set();
	for (const [name, { attrs: attrDefine, value, events: eventsDefine, bind }] of Object.entries(enhancementDefine)) {
		if (!hasOwnProperty(enhancements, name)) { continue; }
		const enhancement = enhancements[name];
		if (typeof enhancement !== 'function') { continue; }


		let destroyed = false;
		const destroyedState = new Signal.State(false);
		const events = /** @type {any} */(enhancement)?.events;
		/** @type {[string, ($event: any) => void, AddEventListenerOptions][]} */
		const allEvents = [];
		const attrs = Object.create(null);
		/** @type {Set<() => void>} */
		const cancelFns = new Set();
		const stateEmitter = new EventEmitter();

		/**
		 * 
		 * @param {string} name 
		 * @param {Layout.EventListener} fn 
		 * @returns 
		 */
		function addEvent(name, fn) {
			if (typeof fn !== 'function') { return; }
			const [e, ...fs] = name.split('.').filter(Boolean);
			const filters = events ? events[e].filters : {};
			if (!filters) { return; }
			/** @type {AddEventListenerOptions} */
			const options = {};
			const filterFns = findFilters(fs, filters, options);
			allEvents.push([e, bindFilters(env, fn, filterFns), options]);
		}
		function destroy() {
			if (destroyed) { return; }
			destroyed = true;
			destroyedState.set(true);
			for (const w of cancelFns) {
				w();
			}
			stateEmitter.emit('destroy');
		}
		bk.add(destroy);



		for (const [name, attr] of Object.entries(attrDefine)) {
			const s = env.get(attr);
			if (!s) { continue; }
			Object.defineProperty(attrs, name, { ...s, configurable: true, enumerable: true });
		}

		for (const [name, event] of Object.entries(eventsDefine)) {
			const fn = env.getEvent(event);
			if (fn) { addEvent(name, fn); }
		}

		if (bind) {
			for (const [key, effect] of Object.entries(env.getBindAll(bind) || {})) {
				Object.defineProperty(attrs, key, { ...effect, configurable: true, enumerable: true });
			}
			for (const [key, setter] of Object.entries(env.bindEvents(bind) || {})) {
				addEvent(key, $event => setter($event));
			}

		}
		/**@type {Enhancement.Context} */
		const context = {
			get value() { return null; },
			events: allEvents,
			attrs: attrs,
			watchAttr(name, fn) {
				if (destroyed) { return () => { }; }
				let old = attrs[name];
				const w = watch(() => attrs[name], v => {
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
			get destroyed() { return destroyedState.get(); },
			listen(name, listener) { return stateEmitter.listen(name, listener); },
			root, slot,
			tag,
		}
		if (value) {
			const s = env.get(value);
			if (s) {
				Object.defineProperty(context, 'value', { ...s, configurable: true, enumerable: true });
			}
		}
		enhancement(context);
	}
	return () => {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	};
}
import EventEmitter from './EventEmitter.mjs';
import watch from '../watch.mjs';
import { bindFilters, findFilters } from './filter.mjs';
