import Store, { ArrayStore } from '../../Store/index.mjs';
import toItem from './toItem.mjs';


/** @import { ValueDefine, ExecDefine, CalcDefine } from './index.mjs' */
/**
 * 
 * @param {Record<string, ValueDefine | ExecDefine | CalcDefine>} items 
 * @param {Store} store 
 * @param {Store} [parent] 
 */
export default function setStore(items, store, parent) {
	for (const [name, val] of store) {
		for (const [b, x] of toItem(val, name)) {
			items[b] = x;
		}
		for (const [b, x] of toItem(val, name, '$$')) {
			items[b] = x;
		}
	}
	if (parent instanceof ArrayStore) {

	}

}
