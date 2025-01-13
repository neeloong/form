/** @import { Component } from '../types.mjs' */

import Environment from './Environment/index.mjs';

/**
 * @param {Component.Handler} handler
 * @param {Environment} env
 * @param {string | boolean | null} [bind]
 */
export default function bindBase(handler, env, bind) {
	if (!bind) { return () => {}; }
	let bk = new Set();
	for (const [key, effect] of Object.entries(env.bindAll(bind) || {})) {
		if (typeof effect !== 'function') { continue; }
		bk.add(effect(val => handler.set(key, val)));
	}
	for (const [key, setter] of Object.entries(env.bindEvents(bind) || {})) {
		handler.addEvent(key, $event => setter($event));
	}

	return ()=> {
		const list = bk;
		bk = new Set();
		for (const s of list) {
			s();
		}
	}
}
