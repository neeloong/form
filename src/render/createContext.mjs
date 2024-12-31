/** @import { Component } from '../types.mjs' */
/**
 * 
 * @param {Component} component 
 * @param {any} global 
 * @returns 
 */
export default function createContext({ attrs, events }, global) {
	let removed = false;
	const removedListeners = new Set();
	let init = false;
	const initListeners = new Set();
	const tagAttrs = Object.fromEntries(Object.entries(attrs).filter(([,a]) => a.isAttr || !a.isProp).map(([e, attr]) => [e, undefined]));
	const watchAttrs = Object.fromEntries(Object.keys(tagAttrs).map(e => [e, new Set]))


	/** @type {Record<string, (($event: any, global: any) => void)[]>} */
	const listeners = Object.fromEntries(Object.keys(events).map(e => [e, []]))
	const cContext = {
		attrs: new Set(Object.entries(attrs).filter(([,a]) => a.isAttr || !a.isProp).map(([e]) => e)),
		props: new Set(Object.entries(attrs).filter(([,a]) => a.isProp).map(([e]) => e)),
		// TODO: 触发事件
		// TODO: 属性及监听属性
		event: Object.fromEntries(Object.entries(listeners).map(([e, list]) => {
			return [e, $event => {
				for (const fn of list) {
					fn($event, global);
				}
			}]
		})),
		tagAttrs: Object.defineProperties({}, Object.fromEntries(Object.keys(attrs).map(e => [e, {
			configurable: true,
			enumerable: true,
			get() { return tagAttrs[e]},
		}]))),
		watchAttr(name, fn) {
			const list = watchAttrs[name];
			if (!(list instanceof Set)) { return () => {}}
			list.add(fn);
			return () => {list.delete(fn)};
		},
		get removed() { return removed},
		listenRemove(fn) {
			removedListeners.add(fn);
			return () => {removedListeners.delete(fn)};

		},
		get init() { return init},
		listenInit(fn) {
			initListeners.add(fn);
			return () => {initListeners.delete(fn)};

		}
	};
	const rContext = {
		set(name, value) {
			const old = tagAttrs[name];
			if (old === value) { return; }
			tagAttrs[name] = value;
			const list = watchAttrs[name];
			if (!(list instanceof Set)) { return; }
			for (const f of list) {
				f(value, old, name);
			}
		},
		addEvent(name, fn) {
			if (typeof fn !== 'function') { return; }
			const [e, ...fs] = name.split('.').filter(Boolean);
			const event = events[e];
			if (!event) { return; }
			const filters = event.filters;
			const list = listeners[e];
			if (!Array.isArray(list)) { return; }
			let l = fn;
			if (filters) for (let f = fs.pop();f;f = fs.pop()) {
				const filter = filters[f];
				if (typeof filter !== 'function') { continue; }
				const fn = l;
				l = (...args) => {
					if (filter(...args) === false) { return}
					fn(...args);
				}
			}
			list.push(l);
		},
		remove() {
			if (removed) { return }
			removed = true;
			for (const f of removedListeners) {
				f();
			}

		},
		init() {
			if (init) { return }
			init = true;
			for (const f of initListeners) {
				f();
			}

		},

	};
	return {cContext, rContext};
}
