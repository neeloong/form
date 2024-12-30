import computed from '../computed/index.mjs';
import bindClasses from './bindClasses.mjs';
import bindStyles from './bindStyles.mjs';
import renderChildrenDirectives from './renderChildrenDirectives.mjs';
import toAttrValue from './toAttrValue.mjs';
/** @import { ENV } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */
/** @import Value from '../Value/index.mjs' */

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
 * @param {Layout.Node} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Value} schema
 * @param {ENV} envs
 * @param {(layouts: (Layout.Node | string)[], parent: Element, next: Node | null) => () => void} render
 */
export default function renderTag(layout, parent, next, schema, envs, render) {

	const { name, is, attrs, events } = layout;
	const node = document.createElement(name, { is: is || undefined });
	/** @type {Set<() => void>?} */
	let bk = new Set();
	bk.add(
		renderChildrenDirectives(node, schema, envs, layout.directives)
		|| render(layout.children || [], node, null)
	);

	for (const [name, attr] of Object.entries(attrs)) {
		const prop = getAttrs(node, name);
		if (typeof attr !== 'function' && typeof attr !== 'symbol') {
			if (prop) {
					// @ts-ignore
					node[name] = attr;

			} else {
				let value = toAttrValue(attr);
				if (value !== null) {
					node.setAttribute(name, value);
				}

			}
			continue;
		}
		const schemaValue = typeof attr === 'function' ? attr : attr.description || ''
		if (node instanceof HTMLInputElement && name.toLocaleLowerCase() === 'type') {
			let value = toAttrValue(schema.exec(schemaValue, envs));
			if (value !== null) {
				node.setAttribute(name, value);
			}
			continue;
		}
		const result = computed(() => schema.exec(schemaValue, envs));;
		bk.add(() => result.stop());
		if (prop) {
			let resValue = result.value
				// @ts-ignore
				node[name] = resValue;
				result.listen((val) => {
					if (val === resValue) { return; }
					resValue = val;
					// @ts-ignore
					node[name] = resValue;
				});
		} else {
			let value = toAttrValue(result.value);
			if (value !== null) {
				node.setAttribute(name, value);
			}
			result.listen((val) => {
				const newVal = toAttrValue(val);
				if (newVal === value) { return; }
				value = newVal;
				if (value === null) {
					node.removeAttribute(name);
				} else {
					node.setAttribute(name, value);
				}
			});
		}
	}
	for (const [name, event] of Object.entries(events)) {
		if (typeof event === 'string') {
			// TODO: 事件名
		} else {
			// TODO: 事件名
			node.addEventListener(name, $event => event($event, envs));
		}
	}
	if (layout.directives.value != null) {
		for (const [e, f] of getElementModelEvent(node)) {
			node.addEventListener(e, $event => {schema.value = f($event)});
		}
		for (const [name, prop] of getElementModel(node)) {
			const result = computed(() => schema.value);
			bk.add(() => result.stop());
			if (prop) {
				let resValue = result.value
					// @ts-ignore
					node[name] = resValue;
					result.listen((val) => {
						if (val === resValue) { return; }
						resValue = val;
						// @ts-ignore
						node[name] = resValue;
					});
			} else {
				let value = toAttrValue(result.value);
				if (value !== null) {
					node.setAttribute(name, value);
				}
				result.listen((val) => {
					const newVal = toAttrValue(val);
					if (newVal === value) { return; }
					value = newVal;
					if (value === null) {
						node.removeAttribute(name);
					} else {
						node.setAttribute(name, value);
					}
				});
			}
		}
	}
	bindClasses(node, layout.classes, schema, envs);
	bindStyles(node, layout.styles, schema, envs);
	parent.insertBefore(node, next);
	return () => {
		node.remove();
		if (!bk) { return; }
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	};
}
