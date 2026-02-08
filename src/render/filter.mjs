/** @import { Component } from '../types.mjs' */
/** @import Environment from './Environment/index.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */


/** @type {Record<string, Component.Event.Filter>} */
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
				if (key === k.toLowerCase().replace(/-/g, '')) { return true; }
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
				if (pointerType === k.toLowerCase().replace(/-/g, '')) { return true; }
			}
			return false;
		}
	},

	ctrl(evt) {
		if (evt instanceof MouseEvent || evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.ctrlKey;
		}
	},
	alt(evt) {
		if (evt instanceof MouseEvent || evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.altKey;
		}
	},
	shift(evt) {
		if (evt instanceof MouseEvent || evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.shiftKey;
		}
	},
	meta(evt) {
		if (evt instanceof MouseEvent || evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.metaKey;
		}
	},
	cmd(evt) {
		if (evt instanceof MouseEvent || evt instanceof KeyboardEvent || evt instanceof TouchEvent) {
			return evt.ctrlKey || evt.metaKey;
		}
	},
};
/**
 * 
 * @param {Environment} env 
 * @param {(event: string) => Record<string, string | Component.Event.Filter> | null | undefined} getFilters
 * @returns 
 */
export default function createContext(env, getFilters) {
	/** @type {(event: string, listener: Layout.EventListener) => [string, ($event: any) => void, AddEventListenerOptions]?} */
	const handler =
		(name, fn) => {
			if (typeof fn !== 'function') { return null; }
			const [e, ...fs] = name.split('.').filter(Boolean);
			const filters = getFilters(e) || {};
			if (!filters) { return null; }
			/** @type {AddEventListenerOptions} */
			const options = {};
			const filterFns = findFilters(fs, filters, options);
			return [e, bindFilters(env, fn, filterFns), options];
		};
	return handler;
}
/**
 * 
 * @param {string[]} fs 
 * @param {Record<string, string | Component.Event.Filter>} filters 
 * @param {AddEventListenerOptions?} [options] 
 * @returns 
 */
export function findFilters(fs, filters, options) {
	/** @type {[Component.Event.Filter, string[], boolean][]} */
	const filterFns = [];
	if (filters) for (let f = fs.shift(); f; f = fs.shift()) {
		const paramIndex = f.indexOf(':');
		const noParamName = paramIndex >= 0 ? f.slice(0, paramIndex) : f;
		const param = paramIndex >= 0 ? f.slice(paramIndex + 1).split(':') : [];
		const filterName = noParamName.replace(/^-+/, '');
		const sub = (noParamName.length - filterName.length) % 2 === 1;
		let filter = filters[filterName] || filterName;
		if (options) {
			switch (filter) {
				case 'once': case 'passive': case 'capture': options[filter] = !sub; continue;
			}
		}
		if (typeof filter === 'string') {
			filter = eventFilters[filter];
		}
		if (typeof filter !== 'function') { continue; }
		filterFns.push([filter, param, sub]);
	}
	return filterFns;
}

/**
 * 
 * @param {Environment} env 
 * @param {Layout.EventListener} fn
 * @param {[Component.Event.Filter, string[], boolean][]} filterFns 
 * @returns {($event: any) => void}
 */
export function bindFilters(env, fn, filterFns) {
	return $event => {
		const global = env.all;
		for (const [filter, param, sub] of filterFns) {
			if (filter($event, param, global) === sub) { return; }
		}
		fn($event, global);
	}
}
