
const numRegex = /^([+-]?(\d(_?\d)*(\.(\d(_?\d)*)?)?|\.\d(_?\d)*)(?:e[+-]?\d(_?\d)*)|0(b[01](?:_?[01])*|o[0-7](?:_?[0-7])*|x[\dA-F](?:_?[\dA-F])*))$/is;
/**
 * 
 * @param {string} t 
 * @returns 
 */
export default function(t) {
	return numRegex.test(t) ? Number(t.replaceAll('_', '')) : NaN;
}
