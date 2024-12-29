/**
 *
 * @param {any} val
 * @returns
 */
export default function toText(val) {
	if ((val ?? null) === null) {
		return "";
	}
	return String(val);
}
