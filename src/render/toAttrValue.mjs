/**
 *
 * @param {any} val
 * @returns
 */
export default function toAttrValue(val) {
	if (typeof val === 'number') {
		return String(val);
	}
	if (typeof val === 'bigint') {
		return String(val);
	}
	if (typeof val === 'boolean') {
		return val ? '' : null;
	}
	if (typeof val === 'string') {
		return val;
	}
	if ((val ?? null) === null) {
		return null;
	}
	return String(val);
}
