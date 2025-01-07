import Store, { ArrayStore } from '../../Store/index.mjs';
import bindableSet from './bindableSet.mjs';
/** @import { ValueDefine, ExecDefine, CalcDefine } from './index.mjs' */
/**
 * 
 * @param {Store} val 
 * @param {string | number} [key] 
 * @returns {Iterable<[string, ValueDefine | ExecDefine | CalcDefine]>}
 */
export default function *toItem(val, key = '', sign = '$') {
	yield [`${key}`, {get: () => val.value, set: v => val.value = v, store: val}]
	yield [`${key}${sign}value`, {get: () => val.value, set: v => val.value = v}]
	yield [`${key}${sign}state`, {get: () => val.state, set: v => val.state = v}]
	yield [`${key}${sign}store`, {get: () => val}]
	yield [`${key}${sign}schema`, {get: () => val.schema}]
	yield [`${key}${sign}null`, {get: () => val.null}]
	yield [`${key}${sign}index`, {get: () => val.index}]
	yield [`${key}${sign}no`, {get: () => val.no}]
	yield [`${key}${sign}length`, {get: () => val.length}]
	yield [`${key}${sign}creatable`, {get: () => val.creatable}]
	yield [`${key}${sign}immutable`, {get: () => val.immutable}]


	for (const k of bindableSet) {
		yield [`${key}${sign}${k}`, {get: () => val[k]}];
	}
	if (!(val instanceof ArrayStore)) { return; }
	yield [`${key}${sign}insert`, {exec: (index, value) => val.insert(index, value)}]
	yield [`${key}${sign}add`, {exec: (v) => val.add(v)}]
	yield [`${key}${sign}remove`, {exec: (index) => val.remove(index)}]
	yield [`${key}${sign}move`, {exec: (from, to) => val.move(from, to)}]
	yield [`${key}${sign}exchange`, {exec: (a, b) => val.exchange(a, b)}]
}
