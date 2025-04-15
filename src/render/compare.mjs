/**
 *
 * @param {any} a
 * @param {any} b
 * @returns
 */
export default function compare(a, b) {
	if (typeof a === 'bigint' && typeof b === 'bigint') {
		return Number(a - b);
	}
	if ((typeof a === 'number' || typeof a === 'bigint') && (typeof b === 'number' || typeof b === 'bigint')) {
		return Number(a) - Number(b);
	}
	const sa = String(a);
	const sb = String(b);
	return sa > sb ? 1 : sa < sb ? -1 : 0;
}
