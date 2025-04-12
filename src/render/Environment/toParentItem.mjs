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
		yield [`${key}${sign}removable`, {get: () => false}];
		yield [`${key}${sign}upMovable`, {get: () => false}];
		yield [`${key}${sign}downMovable`, {get: () => false}];
		yield [`${key}${sign}remove`, {exec: () => {}}];
		yield [`${key}${sign}upMove`, {exec: () => {}}];
		yield [`${key}${sign}downMove`, {exec: () => {}}];
		return
	}
	yield [`${key}${sign}removable`, {get: () => {
		if (parent.readonly) { return false; }
		if (parent.disabled) { return false; }
		if (!val.removable) { return false; }
		return true;
	}}]
	yield [`${key}${sign}upMovable`, {get: () => {
		if (parent.readonly) { return false; }
		if (parent.disabled) { return false; }
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s <= 0) { return false; }
		return true;
	}}];
	yield [`${key}${sign}downMovable`, {get: () => {
		if (parent.readonly) { return false; }
		if (parent.disabled) { return false; }
		const s = val.index;
		if (typeof s !== 'number') { return false; }
		if (s >= parent.size - 1) { return false; }
		return true;
	}}]
	yield [`${key}${sign}remove`, {exec: () => {
		if (parent.readonly) { return; }
		if (parent.disabled) { return; }
		if (!val.removable) { return; }
		parent.remove(Number(val.index))
	}}]
	yield [`${key}${sign}upMove`, {exec: () => {
		if (parent.readonly) { return; }
		if (parent.disabled) { return; }
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s <= 0) { return; }
		parent.move(s, s - 1);
	}}];
	yield [`${key}${sign}downMove`, {exec: () => {
		if (parent.readonly) { return; }
		if (parent.disabled) { return; }
		const s = val.index;
		if (typeof s !== 'number') { return; }
		if (s >= parent.size - 1) { return; }
		parent.move(s, s + 1);
	}}]
}
