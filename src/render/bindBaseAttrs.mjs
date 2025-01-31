/** @import { Component } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */

import Environment from './Environment/index.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Environment} envs
 * @param {Record<string, Layout.Node.Value | Layout.Node.Name | Layout.Node.Calc>} attrs
 */
export default function bindBaseAttrs(handler, envs, attrs) {
	const tag = handler.tag;
	let bk = new Set();
	/** @type {Record<string, string?>} */
	const attrValues = {};
	for (const [key, attr] of Object.entries(attrs)) {
		const {name, calc, value} = attr;
		if (!name && !calc) {
			handler.set(key, value);
			attrValues[key] = String(value);
			continue;
		}
		if (typeof tag === 'string' && tag.toLocaleLowerCase() === 'input' && key.toLocaleLowerCase() === 'type') {
			const value = envs.exec(attr);
			attrValues[key] = String(value);
			handler.set(key, value);
			continue;
		}
		bk.add(envs.watch(attr, val => handler.set(key, val)));
	}

	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
