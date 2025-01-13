/** @import { Component } from '../types.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */

import Environment from './Environment/index.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Environment} envs
 * @param {Record<string, string | {name: string} | Layout.Calc>} attrs
 */
export default function bindBaseAttrs(handler, envs, attrs) {
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
		const attrSchema = typeof attr === 'function' ? /** @type{Layout.Calc} */(attr) : attr.name;
		if (typeof tag === 'string' && tag.toLocaleLowerCase() === 'input' && name.toLocaleLowerCase() === 'type') {
			const value = envs.exec(attrSchema);
			attrValues[name] = String(value);
			handler.set(name, value);
			continue;
		}
		bk.add(envs.watch(attrSchema, val => handler.set(name, val)));
	}

	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
