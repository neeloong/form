import compare from './compare.mjs';
import Environment from './Environment/index.mjs';
/** @import { ObjectStore, Store } from '../Store/index.mjs' */
/** @import * as Layout from '../Layout/index.mjs' */

/**
 *
 * @param {Element} parent
 * @param {Node?} next
 * @param {ObjectStore} store
 * @param {Environment} env
 * @param {(next: Node | null, env: any) => () => void} renderItem
 * @param {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} [sort]
 */
export default function renderObject(parent, next, store, env, renderItem, sort) {
	/** @type {(() => void)[]} */
	const children = [];
	const childStores = [...store];
	const count = childStores.length;
	/** @type {[string, Store<any, any, any>, number][]} */
	const stores = sort
	? childStores
		.map(([k,v]) => [k,v,env.setStore(v, store).exec(sort)])
		.sort(([,,a], [,,b]) => compare(a, b))
		.map(([k,v], i) => [k,v,i])
	: childStores.map(([k,v], i) => [k,v,i]);
	for (const [key, child, index] of stores) {
	children.push(renderItem(next, env.setStore(child, store, {
		get count() { return count; },
		get key() { return key; },
		get index() { return index; },
		get item() { return child.value; },
	})));
	}

	return () => {
		for (const d of children) {
			d();
		}
	};
}
