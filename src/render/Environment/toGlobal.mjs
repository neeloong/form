import Store from '../../Store/index.mjs';
import globals from './globals.mjs';
import toItem from './toItem.mjs';
/** @import { ValueDefine, ExecDefine, CalcDefine } from './index.mjs' */


/**
 * 
 * @param {string} key 
 */
function testKey(key) {
	if (!key) { return false; }
	const index = key.indexOf('$');
	if (index < 0) { return true; }
	if (key.indexOf('$',  index + 2) > 0) { return true; }
	if (key[0] !== '$') { return false;}
	return '_$'.includes(key[1]);
}
/**
 * @param {Record<string, Store | {get?(): any; set?(v: any): void; exec?: any; calc?: any }>?} [global] 
 */
export default function toGlobal(global) {
	/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
	const items = Object.create(null, globals);
	if (!global || typeof global !== 'object') { return items; }
	for (const [key, value] of Object.entries(global)) {
		if (!testKey(key)) { continue; }
		if (!value || typeof value !== 'object') { continue; }
		if (value instanceof Store) {
			for (const [k, v] of toItem(value, key)) {
				items[k] = v;
			}
			continue;
		}
		const {get,set,exec,calc} = value;
		if (typeof get === 'function') {
			items[key] = typeof set === 'function' ? {get,set} : {get};
			continue;
		}
		if (typeof calc === 'function' || calc && typeof calc === 'object') {
			items[key] = {calc};
			continue;
		}
		if (typeof exec === 'function' || calc && typeof calc === 'object') {
			items[key] = {exec};
			continue;
		}
	}
	return items;
}
