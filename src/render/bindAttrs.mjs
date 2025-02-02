/** @import { Component } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */

import Environment from './Environment/index.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Environment} envs
 * @param {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} attrs
 * @param {Record<string, Component.Attr>} componentAttrs
 * @param {string | boolean | null} [bindValue]
 */
export default function bindAttrs(handler, envs, attrs, componentAttrs, bindValue) {

	let bk = new Set();
	for (const [key, attr] of Object.entries(componentAttrs)) {
		if (key in attrs) {
			const attrDefine = attrs[key]
			const { name, calc, value } = attrs[key];
			if (!name && !calc) {
				handler.set(key, value);
				continue;
			}
			if (attr.immutable) {
				handler.set(key, envs.exec(attrDefine));
			}
			bk.add(envs.watch(attrDefine, v => handler.set(key, v)));
			continue;
		}
		const bind = attr.bind;
		if (!bindValue || !bind) {
			handler.set(key, attr.default);
			continue;
		}
		if (typeof bind === 'string') {
			const r = envs.bind(bindValue, bind, v => handler.set(key, v));
			if (r) {
				bk.add(r);
			} else {
				handler.set(key, attr.default);
			}
			continue;
		}
		if (!Array.isArray(bind)) {
			handler.set(key, attr.default);
			continue;
		}
		const [event, set, isState] = bind
		if (!event || typeof set !== 'function') {
			continue;
		}
		if (!isState) {
			const bindKey = bindValue === true ? '' : bindValue;
			bk.add(envs.watch({name: bindKey}, v => handler.set(key, v)));
			handler.addEvent(event, (...args) => { envs.all[bindKey] = set(...args)});
			continue;
		}
		const r = envs.bind(bindValue, 'state', v => handler.set(key, v));
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
