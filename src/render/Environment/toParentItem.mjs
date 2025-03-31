import Store, { ArrayStore } from '../../Store/index.mjs';

/** @import { ValueDefine, ExecDefine, CalcDefine } from './index.mjs' */

/**
 * 
 * @param {Store?} parent 
 * @param {Store} val 
 * @param {string | number} [key] 
 * @returns {Iterable<[string, ValueDefine | ExecDefine | CalcDefine]>}
 */
export default function *toParentItem(parent, val, key = '', sign = '$') {
	if (!(parent instanceof ArrayStore)) {
		yield [`${key}${sign}upMovable`, {get: () => false}];
		yield [`${key}${sign}downMovable`, {get: () => false}]
		return
	}
	yield [`${key}${sign}upMovable`, {get: () => {
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s <= 0) { return false; }
		return true;
	}}];
	yield [`${key}${sign}downMovable`, {get: () => {
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s >= parent.size - 1) { return false; }
		return true;
	}}]
	yield [`${key}${sign}remove`, {exec: () => parent.remove(Number(val.index))}]
	yield [`${key}${sign}upMove`, {exec: () => {
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s <= 0) { return; }
		parent.move(s, s - 1);
	}}];
	yield [`${key}${sign}downMove`, {exec: () => {
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s >= parent.size - 1) { return; }
		parent.move(s, s + 1);
	}}]
}
