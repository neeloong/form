/** @import { Component } from '../types.mjs' */
/** @import Value from '../Value/index.mjs' */
import Environment from '../Environment.mjs';
import computed from '../computed/index.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Value} schema
 * @param {Environment} envs
 * @param {Record<string, string | {name: string} | ((...any: any) => void)>} attrs
 * @param {Record<string, Component.Attr>} componentAttrs
 * @param {string?} [bindValue]
 */
export default function bindAttrs(handler, schema, envs, attrs, componentAttrs, bindValue) {

	let bk = new Set();
	for (const [name, attr] of Object.entries(componentAttrs)) {
		const attrValue = attrs[name];
		if (!(name in attrs)) {
			const bind = attr.bind;
			if (bindValue && bind) {
				const [event, set] = bind
				if (bindValue && event && typeof set === 'function') {
					// @ts-ignore
					const result = computed(() => envs.exec(bindValue));
					let value = result.value;
					handler.set(name, value);
					bk.add(() => result.stop());
					result.listen((val) => {
						if (val === value) { return; }
						value = val;
						handler.set(name, value);
					});
					handler.addEvent(event, (...args) => { envs.all[bindValue] = set(...args)});
					continue;
				}
			}
			handler.set(name, attr.default);
			continue;
		}
		if (typeof attrValue !== 'function' && typeof attrValue !== 'object') {
			handler.set(name, attrValue);
			continue;
		}
		const attrSchema = typeof attrValue === 'function' ? attrValue : attrValue.name;
		if (attr.immutable) {
			handler.set(name, envs.exec(attrSchema));
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
	// TODO: 创建组件
	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
