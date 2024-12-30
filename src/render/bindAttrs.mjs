/** @import { Component, ENV } from '../types.mjs' */
/** @import Value from '../Value/index.mjs' */
import { computed } from '../Value/index.mjs';
import createContext from './createContext.mjs';

/**
 * @param {ReturnType<typeof createContext>['rContext']} rContext
 * @param {Record<string, Component.Attr>} componentAttrs
 * @param {Value} schema
 * @param {ENV} envs
 * @param {Record<string, string | Symbol | ((...any: any) => void)>} attrs
 */
export default function bindAttrs(rContext, componentAttrs, schema, envs, attrs) {

	let bk = new Set();
	for (const [name, attr] of Object.entries(componentAttrs)) {
		const attrValue = attrs[name];
		if (!(name in attrs)) {
			const bind = attr.bind;
			if (bind && ['value', 'no', 'length', 'state', 'index', 'hidden','disabled','readonly',].includes(bind)) {
				// @ts-ignore
				const result = computed(() => schema.exec(bind));;
				let value = result.value;
				rContext.set(name, value);
				bk.add(() => result.stop());
				result.listen((val) => {
					if (val === value) { return; }
					value = val;
					rContext.set(name, value);
				});
				const {event, set} = attr;
				if (bind === 'value' && event && typeof set === 'function') {
					rContext.addEvent(event, (...args) => { schema.value = set(...args)});
				}
			} else {
				rContext.set(name, attr.default);
			}
			continue;
		}
		if (typeof attrValue !== 'function' && typeof attrValue !== 'symbol') {
			rContext.set(name, attrValue);
			continue;
		}
		const attrSchema = typeof attrValue === 'function' ? attrValue
		: attrValue.description || '';
		if (attr.immutable) {
			rContext.set(name, schema.exec(attrSchema, envs));
			continue;

		}
		const result = computed(() => schema.exec(attrSchema, envs));;
		let value = result.value;
		rContext.set(name, value);
		bk.add(() => result.stop());
		result.listen((val) => {
			if (val === value) { return; }
			value = val;
			rContext.set(name, value);
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
