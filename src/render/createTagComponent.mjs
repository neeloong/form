/** @import { Component } from '../types.mjs' */
/**
 *
 * @param {any} val
 * @returns
 */
function toAttrValue(val) {
	if (typeof val === 'number') {
		return String(val);
	}
	if (typeof val === 'bigint') {
		return String(val);
	}
	if (typeof val === 'boolean') {
		return val ? '' : null;
	}
	if (typeof val === 'string') {
		return val;
	}
	if ((val ?? null) === null) {
		return null;
	}
	return String(val);
}

/**
 * 
 * @param {Element} el 
 * @param {string} attr 
 */
function getAttrs(el, attr) {
	if (el instanceof HTMLInputElement && 'checked' === attr) {
		switch (el.type.toLowerCase()) {
			case 'checkbox':
			case 'radio':
				return true;
		}
	}
	if ((
		el instanceof HTMLSelectElement
		|| el instanceof HTMLInputElement
		|| el instanceof HTMLTextAreaElement
	) && 'value' === attr) {
		return true;
	}
	if ((el instanceof HTMLDetailsElement) && 'open' === attr) {
		return true;
	}
	if (el instanceof HTMLMediaElement) {
		if ('muted' === attr) {
			return true;
		}
		if ('paused' === attr) {
			return true;
		}
		if ('currentTime' === attr) {
			return true;
		}
		if ('playbackRate' === attr) {
			return true;
		}
		if ('volume' === attr) {
			return true;
		}
	}
	return false;
}
/**
 * 
 * @param {Element} el 
 * @returns {Iterable<[string, boolean]>}
 */
function *getElementModel(el) {
	if (el instanceof HTMLInputElement) {
		switch (el.type.toLowerCase()) {
			case 'checkbox':
			case 'radio':
				return yield ['checked', true];
		}
		return yield ['value', true];
	}
	if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
		return yield ['value', true];
	}
}
/**
 * 
 * @param {Element} el 
 * @returns {Iterable<[string, (e: Event) => any]>}
 */
function *getElementModelEvent(el) {
	if (el instanceof HTMLInputElement) {
		switch (el.type.toLowerCase()) {
			case 'checkbox':
			case 'radio':
				yield ['change',(e) => /** @type {*} */(e.currentTarget).checked];
		}
		yield ['input',(e) => /** @type {*} */(e.currentTarget).value];
		return
	}
	if (el instanceof HTMLTextAreaElement) {
		return yield ['input', e => /** @type {*} */(e.currentTarget).value];
	}
	if (el instanceof HTMLSelectElement) {
		return yield ['change', e => /** @type {*} */(e.currentTarget).value];
	}
}
/**
 * 
 * @param {Element} el 
 * @param {string} attr 
 * @returns {Iterable<[string, (e: Event) => any]>}
 */
function *getElementModel2(el, attr) {
	if (el instanceof HTMLInputElement) {
		switch (el.type.toLowerCase()) {
			case 'checkbox':
				if (attr === 'indeterminate')
				yield ['change', e => /** @type {*} */(e.currentTarget).indeterminate];
			if (attr === 'checked')
				return yield ['change', e => /** @type {*} */(e.currentTarget).checked];
			case 'radio':
				if (attr === 'radio')
				return yield [ 'change', e => /** @type {*} */(e.currentTarget).checked];
		}
		if (attr === 'value')
		return yield ['input', e => /** @type {*} */(e.currentTarget).value];
	}
	if (el instanceof HTMLTextAreaElement) {
		if (attr === 'value')
		return yield ['input', e => /** @type {*} */(e.currentTarget).value];
	}
	if (el instanceof HTMLSelectElement) {
		if (attr === 'value')
		return yield ['change', e => /** @type {*} */(e.currentTarget).value];
	}
	if (el instanceof HTMLDetailsElement) {
		if (attr === 'open')
		return yield ['toggle', e => /** @type {*} */(e.currentTarget).open];
	}
	if (el instanceof HTMLMediaElement) {
		if (attr === 'currentTime')
		yield ['timeupdate', e => /** @type {*} */(e.currentTarget).currentTime];
		if (attr === 'playbackRate')
		yield ['ratechange', e => /** @type {*} */(e.currentTarget).playbackRate];
		if (attr === 'volume')
		yield ['volumechange', e => /** @type {*} */(e.currentTarget).volume];
		if (attr === 'muted')
		yield ['volumechange', e => /** @type {*} */(e.currentTarget).muted];
		if (attr === 'paused')
		yield ['playing', e => /** @type {*} */(e.currentTarget).paused];
		if (attr === 'paused')
		return yield ['pause', e => /** @type {*} */(e.currentTarget).paused];
	}
}

/**
 * 
 * @param {Component.Context} context 
 * @param {string} name 
 * @param {string?} [is] 
 */
export default function (context, name, is) {
	const node = document.createElement(name, {is: is || undefined});
	const { watchAttr, attrs, props } = context;

	context.listen('init', ({events})=> {
		for (const [type, listener, options] of events) {
			node.addEventListener(type, listener, options);
		}
		if (props && attrs) {
			for (const [name, attr] of Object.entries(context.tagAttrs)) {
				watchAttr(name, v => {
					if (attrs.has(name)) {
						const val = toAttrValue(v);
						if (val == null) {
							node.removeAttribute(name);
						} else {
							node.setAttribute(name, val);
						}
					}
					// @ts-ignore
					if (props.has(name)) { node[name] = v; }
				});
				// @ts-ignore
				if (props.has(name)) { node[name] = attr; }
				if (attrs.has(name)) {
					const val = toAttrValue(attr);
					if (val !== null) {
						node.setAttribute(name, val);
					}
				}
			}
			return;

		}
		for (const [name, attr] of Object.entries(context.tagAttrs)) {
			if (node instanceof HTMLInputElement && name.toLocaleLowerCase() === 'type') {
				const value = toAttrValue(attr);
				if (value !== null) {
					node.setAttribute(name, value);
				}
				continue;
			}
			const prop = getAttrs(node, name);
			if (prop) {
				// @ts-ignore
				node[name] = attr;
				watchAttr(name, (attr) => {
					// @ts-ignore
					node[name] = attr;
				});
				continue;
			}
			let value = toAttrValue(attr);
			if (value !== null) {
				node.setAttribute(name, value);
			}
			watchAttr(name, (val) => {
				const value = toAttrValue(val);
				if (value === null) {
					node.removeAttribute(name);
				} else {
					node.setAttribute(name, value);
				}
			});
		}
	})
	return node;
}
