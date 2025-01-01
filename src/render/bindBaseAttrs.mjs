/** @import { Component } from '../types.mjs' */
/** @import Value from '../Value/index.mjs' */
import Environment from '../Environment.mjs';
import computed from '../computed/index.mjs';

/**
 * 
 * @param {string} el 
 * @param {Record<string, string?>} attrValues 
 * @returns {Iterable<[string, string, (e: Event) => any]>}
 */
function *getElementModel(el, attrValues) {
	if (el.toLowerCase() === 'input') {
		switch (attrValues.type?.toLowerCase()) {
			case 'checkbox':
			case 'radio':
				return yield ['checked', 'change', (e) => /** @type {*} */(e.currentTarget).checked];
			case 'number':
				return yield ['value', 'input', (e) => Number(/** @type {*} */(e.currentTarget).value)];
		}
		return yield ['value', 'input', (e) => /** @type {*} */(e.currentTarget).value];
		
	}
	if (el.toLowerCase() === 'textarea') {
		return yield ['value', 'input', e => /** @type {*} */(e.currentTarget).value];
	}
	if (el.toLowerCase() === 'select') {
		return yield ['value', 'change', e => /** @type {*} */(e.currentTarget).value];
	}
}
/**
 * @param {Component.Handler} handler
 * @param {Value} schema
 * @param {Environment} envs
 * @param {Record<string, string | {name: string} | ((...any: any) => void)>} attrs
 * @param {string?} [bindValue]
 */
export default function bindBaseAttrs(handler, schema, envs, attrs, bindValue) {
	const tag = handler.tag;
	let bk = new Set();
	/** @type {Record<string, string?>} */
	const attrValues = {};
	for (const [name, attr] of Object.entries(attrs)) {
		if (typeof attr !== 'function' && typeof attr !== 'object') {
			handler.set(name, attr);
			attrValues[name] = String(attr);
			continue;
		}
		const attrSchema = typeof attr === 'function' ? attr : attr.name;
		if (typeof tag === 'string' && tag.toLocaleLowerCase() === 'input' && name.toLocaleLowerCase() === 'type') {
			const value = envs.exec(attrSchema);
			attrValues[name] = String(value);
			handler.set(name, value);
			continue;
		}
		const result = computed(() => envs.exec(attrSchema));
		let value = result.value;
		handler.set(name, value);
		bk.add(() => result.stop());
		result.listen((val) => {
			if (val === value) { return; }
			value = val;
			handler.set(name, value);
		});
	}

	if (bindValue && typeof tag === 'string') {
		for (const [name, e, set] of getElementModel(tag, attrValues)) {
			if (name in attrValues) { continue; }
			handler.addEvent(e, $event => {envs.all[bindValue] = set($event)});
			const result = computed(() => envs.exec(bindValue));
			let value = result.value;
			handler.set(name, value);
			bk.add(() => result.stop());
			result.listen((val) => {
				if (val === value) { return; }
				value = val;
				handler.set(name, value);
			});
		}
	}

	// TODO: 创建组件
	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
