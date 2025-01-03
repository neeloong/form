/** @import { Component } from '../types.mjs' */
/** @import Environment from './Environment.mjs' */

import EventEmitter from '../EventEmitter.mjs';

/** @type {Record<string, (evt: any, param: string[], global: any) => boolean | null | void>} */
const eventFilters = {
	stop(evt) {
		if (evt instanceof Event) { evt.stopPropagation(); }
	},
	prevent(evt) {
		if (evt instanceof Event) { evt.preventDefault(); }
	},
	self(evt) {
		if (evt instanceof Event) { return evt.target === evt.currentTarget; }
	},
	enter(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Enter'; }
	},
	tab(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Tab'; }
	},
	esc(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Escape'; }
	},
	space(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === ' '; }
	},
	backspace(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Backspace'; }
	},
	delete(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Delete'; }
	},
	delBack(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Delete' || evt.key === 'Backspace'; }
	},
	'del-back'(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Delete' || evt.key === 'Backspace'; }
	},
	insert(evt) {
		if (evt instanceof KeyboardEvent) { return evt.key === 'Insert'; }
	},
	repeat(evt) {
		if (evt instanceof KeyboardEvent) { return evt.repeat; }
	},

	key(evt, param) {
		if (evt instanceof KeyboardEvent) {
			const key = evt.code.toLowerCase().replace(/-/g, '');
			for (const k of param) {
				if (key === k.toLowerCase().replace(/-/g, '')) { return true }
			}
			return false;
		}
	},
	main(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 0; }
	},
	auxiliary(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 1; }
	},
	secondary(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 2; }
	},
	left(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 0; }
	},
	middle(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 1; }
	},
	right(evt) {
		if (evt instanceof MouseEvent) { return evt.button === 2; }
	},
	primary(evt) {
		if (evt instanceof PointerEvent) { return evt.isPrimary; }
	},
	mouse(evt) {
		if (evt instanceof PointerEvent) { return evt.pointerType === 'mouse'; }
	},
	pen(evt) {
		if (evt instanceof PointerEvent) { return evt.pointerType === 'pen'; }
	},
	touch(evt) {
		if (evt instanceof PointerEvent) { return evt.pointerType === 'touch'; }
	},
	pointer(evt, param) {
		if (evt instanceof PointerEvent) {
			const pointerType = evt.pointerType.toLowerCase().replace(/-/g, '');
			for (const k of param) {
				if (pointerType === k.toLowerCase().replace(/-/g, '')) { return true }
			}
			return false;
		}
	},

	ctrl(evt) {
		if (evt instanceof MouseEvent|| evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.ctrlKey;
		}
	},
	alt(evt) {
		if (evt instanceof MouseEvent|| evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.altKey;
		}
	},
	shift(evt) {
		if (evt instanceof MouseEvent|| evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.shiftKey;
		}
	},
	meta(evt) {
		if (evt instanceof MouseEvent|| evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.metaKey;
		}
	},
	cmd(evt) {
		if (evt instanceof MouseEvent|| evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.ctrlKey || evt.metaKey;
		}
	},
};
/**
 * 
 * @param {Component | string} component 
 * @param {Environment} env 
 * @returns 
 */
export default function createContext(component, env) {
	const tag = typeof component === 'string' ? component : component.tag;
	const { attrs, events } = typeof component !== 'string' && component || {attrs: null, events: null };

	let destroyed = false;
	let init = false;
	const tagAttrs = Object.create(null);

	/** @type {[string, ($event: any) => void, AddEventListenerOptions][]} */
	const allEvents = [];
	const stateEmitter = new EventEmitter();
	/** @type {EventEmitter<Record<string, [any, any, string]>>} */
	const attrEmitter = new EventEmitter();
	/** @type {Component.Context} */
	const context = {
		events: allEvents,
		props: attrs ? new Set(Object.entries(attrs).filter(([,a]) => a.isProp).map(([e]) => e)) : null,
		tagAttrs,
		watchAttr(name, fn) { return attrEmitter.listen(name, fn); },
		get destroyed() { return destroyed},
		get init() { return init},
		listen(name, listener) { return stateEmitter.listen(name, listener); },
	};
	/** @type {Component.Handler} */
	const handler = {
		tag,
		set(name, value) {
			if (attrs && !(name in attrs)) { return; }
			if (!(name in tagAttrs)) { tagAttrs[name] = void 0; }
			const old = tagAttrs[name];
			if (old === value) { return; }
			tagAttrs[name] = value;
			attrEmitter.emit(name, value, old, name);
		},
		addEvent(name, fn) {
			if (typeof fn !== 'function') { return; }
			const [e, ...fs] = name.split('.').filter(Boolean);
			const filters = events ? events[e].filters : {};
			if (!filters) { return; }
			/** @type {AddEventListenerOptions} */
			const options = {}
			/** @type {[($event: any, param: string[], env: any) => boolean | null | void, string[], boolean][]} */
			const filterFns = [];
			if (filters) for (let f = fs.shift();f;f = fs.shift()) {
				const paramIndex = f.indexOf(':');
				const noParamName = paramIndex >= 0 ? f.slice(0, paramIndex) : f;
				const param = paramIndex >= 0 ? f.slice(paramIndex + 1).split(':') : [];
				const filterName = noParamName.replace(/^-+/, '');
				const sub = (noParamName.length - filterName.length) % 2 === 1;
				let filter = filters[filterName] || filterName;
				switch(filter) {
					case 'once':
						options.once = !sub;
						break;
					case 'passive':
						options.passive = !sub;
						break;
					case 'capture':
						options.capture = !sub;
						break;
					default:
						if (typeof filter === 'string') {
							filter = eventFilters[filter];
						}
				}
				if (typeof filter !== 'function') { continue; }
				filterFns.push([filter, param, sub]);
			}
			allEvents.push([e, $event => {
				const global = env.all;
				for (const [filter, param, sub] of filterFns) {
					if (filter($event, param, global) === sub) { return}
				}
				fn($event, global);
			}, options]);
		},
		destroy() {
			if (destroyed) { return }
			destroyed = true;
			stateEmitter.emit('destroy');
		},
		init() {
			if (init) { return }
			init = true;
			stateEmitter.emit('init', {events: allEvents});
		},

	};
	return { context, handler };
}
