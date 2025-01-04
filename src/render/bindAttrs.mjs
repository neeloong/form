/** @import { Component } from '../types.mjs' */
import Environment from './Environment.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Environment} envs
 * @param {Record<string, string | {name: string} | ((...any: any) => void)>} attrs
 * @param {Record<string, Component.Attr>} componentAttrs
 * @param {string?} [bindValue]
 */
export default function bindAttrs(handler, envs, attrs, componentAttrs, bindValue) {

	let bk = new Set();
	for (const [name, attr] of Object.entries(componentAttrs)) {
		const attrValue = attrs[name];
		if (name in attrs) {
			if (typeof attrValue !== 'function' && typeof attrValue !== 'object') {
				handler.set(name, attrValue);
				continue;
			}
			const attrSchema = typeof attrValue === 'function' ? attrValue : attrValue.name;
			if (attr.immutable) {
				handler.set(name, envs.exec(attrSchema));
				continue;
			}
			bk.add(envs.watch(attrSchema, v => handler.set(name, v)));
			continue;
		}
		const bind = attr.bind;
		if (!bindValue || !bind) {
			handler.set(name, attr.default);
			continue;
		}
		if (typeof bind === 'string') {
			const r = envs.bind(bindValue, bind, v => handler.set(name, v));
			if (r) {
				bk.add(r);
			} else {
				handler.set(name, attr.default);
			}
			continue;
		}
		if (!Array.isArray(bind)) {
			handler.set(name, attr.default);
			continue;
		}
		const [event, set, isState] = bind
		if (!event || typeof set !== 'function') {
			continue;
		}
		if (!isState) {
			bk.add(envs.watch(bindValue, v => handler.set(name, v)));
			handler.addEvent(event, (...args) => { envs.all[bindValue] = set(...args)});
			continue;
		}
		const r = envs.bind(bindValue, 'state', v => handler.set(name, v));
		if (!r) { continue; }
		bk.add(r);
		const s = envs.bindSet(bindValue, 'state');
		if (!s) { continue; }
		handler.addEvent(event, (...args) => { s(set(...args))});
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
