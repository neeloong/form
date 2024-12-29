/**
 * @template K
 * @template V
 * @overload
 * @param {Map<K, V>} map
 * @param {K} key
 * @param {() => V} def
 * @returns {V}
 */
/**
 * @template {object} K
 * @template V
 * @overload
 * @param {WeakMap<K, V>} map
 * @param {K} key
 * @param {() => V} def
 * @returns {V}
 */
/**
 * @template K
 * @template V
 * @param {WeakMap<K & object, V> | Map<K, V>} map
 * @param {K} key
 * @param {() => V} def
 * @returns {V}
 */
function getMapValue(map, key, def) {
	if (map.has(key)) {
		return /** @type {V} */(map.get(key));
	}
	const value = def();
	map.set(key, value);
	return value;
}
export default getMapValue;
