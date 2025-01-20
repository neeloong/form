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
 * @param {any} val
 * @returns
 */
function toText(val) {
	if ((val ?? null) === null) {
		return '';
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
				return Boolean;
		}
	}
	if ((
		el instanceof HTMLSelectElement
		|| el instanceof HTMLInputElement
		|| el instanceof HTMLTextAreaElement
	) && 'value' === attr) {
		return toText;
	}
	if ((el instanceof HTMLDetailsElement) && 'open' === attr) {
		return Boolean;
	}
	if (el instanceof HTMLMediaElement) {
		if ('muted' === attr) {
			return Boolean;
		}
		if ('paused' === attr) {
			return Boolean;
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
 * @typedef {object} TagBind
 * @property {Record<string, (value: any, el: any) => void>} attrs
 * @property {Record<string, [name: string, set: (event: any, el: any) => any]>} events
 */
/** @type {Record<string, TagBind>} */
const tagBindMap = {
	input: {
		attrs: {
			/** @param {any} v @param {HTMLInputElement} e */
			$min: (v, e) => {e.min = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$max: (v, e) => {e.max = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$step: (v, e) => {e.step = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$placeholder: (v, e) => {e.placeholder = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$disabled: (v, e) => {e.disabled = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$readonly: (v, e) => {e.readOnly = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$required: (v, e) => {e.required = v},
			/** @param {any} v @param {HTMLInputElement} e */
			$value: (v, e) => {
				switch(e.type) {
					case 'checkbox':
					case 'radio':
						e.checked = Boolean(v);
						break;
				}
				e.value = toText(v);
			},
		},
		events: {
			$value: ['input', (v, e) => {
				switch(e.type) {
					case 'checkbox':
					case 'radio':
						return e.checked;
					case 'number':
						return Number(e.value);
				}
				return e.value;
			}],
		},
	},
	textarea: {
		attrs: {
			/** @param {any} v @param {HTMLTextAreaElement} e */
			$placeholder: (v, e) => {e.placeholder = v},
			/** @param {any} v @param {HTMLTextAreaElement} e */
			$disabled: (v, e) => {e.disabled = v},
			/** @param {any} v @param {HTMLTextAreaElement} e */
			$readonly: (v, e) => {e.readOnly = v},
			/** @param {any} v @param {HTMLTextAreaElement} e */
			$required: (v, e) => {e.required = v},
			/** @param {any} v @param {HTMLTextAreaElement} e */
			$value: (v, e) => { e.value = toText(v); },
		},
		events: {
			$value: ['input', (v, e) => { return e.value; }],
		},
	},
	select: {
		attrs: {
			/** @param {any} v @param {HTMLSelectElement} e */
			$disabled: (v, e) => {e.disabled = v},
			/** @param {any} v @param {HTMLSelectElement} e */
			$required: (v, e) => {e.required = v},
			/** @param {any} v @param {HTMLSelectElement} e */
			$value: (v, e) => { e.value = toText(v); },
		},
		events: {
			$value: ['change', (v, e) => { return e.value; }],
		},
	},
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
	const { watchAttr, props } = context;
	if(['input', 'textarea', 'select'].includes(name.toLowerCase())) {
		context.relate(node);
	}

	context.listen('init', ({events})=> {
		const e = tagBindMap[name.toLowerCase()];
		const eAttrs = e?.attrs || {};
		const eEvents = e?.events || {};
		for (const [type, listener, options] of events) {
			if (type[0] === '$') {
				const e = eEvents[type];
				if (e) {
					const [evt, set] = e;
					node.addEventListener(evt, e => listener(set(e, node)), options);
				}
				continue;
			}
			node.addEventListener(type, listener, options);
		}
		if (props) {
			for (const [name, attr] of Object.entries(context.tagAttrs)) {
				watchAttr(name, v => {
					// @ts-ignore
					if (props.has(name)) { node[name] = v; } else {
						const val = toAttrValue(v);
						if (val == null) {
							node.removeAttribute(name);
						} else {
							node.setAttribute(name, val);
						}
					}
				});
				// @ts-ignore
				if (props.has(name)) { node[name] = attr; } else {
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
			if (name === '$hidden') {
				if (attr) { node.hidden = attr; }
				watchAttr(name, (val) => { node.hidden = val; });
				continue;
			}

			if (name[0] === '$') {
				const e = eAttrs[name];
				if (e) {
					e(attr, node);
					watchAttr(name, (attr) => e(attr, node));
				}
				continue;
			}
			const prop = getAttrs(node, name);
			if (typeof prop === 'function') {
				// @ts-ignore
				node[name] = prop(attr);
				watchAttr(name, (attr) => {
					// @ts-ignore
					node[name] = prop(attr);
				});
				continue;
			}
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
