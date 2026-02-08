/** @import { Schema } from '../Schema.types.mjs' */
/** @param {*} v  */
export const string = v => typeof v === 'string' && v || null;
/** @param {*} v  */
export const number = v => typeof v === 'number' && v || null;
/** @param {*} v  */
export const regex = v =>v instanceof RegExp ? v : null;

/** @type {(v: Schema.Value | Schema.Value.Group | null) => v is Schema.Value | Schema.Value.Group} */
const valueFilter = /** @type {*} */(Boolean);
/**
 * 
 * @param {*} v 
 * @returns {Schema.Value | Schema.Value.Group | null}
 */
function toValueItem(v) {
	if (typeof v === 'number' || typeof v === 'string') {
		return /** @type {Schema.Value} */({ label: v, value: v});
	}
	if (!v || typeof v !== 'object') { return null; }
	const {children, label, value} = v;
	const list = Array.isArray(children) ? children.map(toValueItem).filter(valueFilter) : [];
	if (list.length) {
		return {children: list, label, value}
	}
	if (typeof value === 'number' || typeof value === 'string') {
		return {label, value};
	}
	return null;

}
/** @param {*} v  */
export const values = v => {
	if (!v || !Array.isArray(v)) { return null;}
	const list = v.map(toValueItem).filter(valueFilter);
	if (!list.length) { return null; }
	return list;
};
