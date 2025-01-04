
const errors = {
	CALC: 'no `creteCalc` option, no expression parsing support',
	EVENT: 'no `creteEvent`, options, no event parsing support',
	/** @param {string} endTag @param {string} startTag */
	CLOSE: (endTag, startTag) => `end tag name: ${endTag} is not match the current start tagName: ${startTag}`,
	/** @param {string} name */
	UNCLOSE: (name) => `end tag name: ${name} maybe not complete`,
	/** @param {string} char */
	QUOTE: (char) => `attribute value no end \'${char}\' match`,
	CLOSE_SYMBOL: `elements closed character '/' and '>' must be connected to`,
	/** @param {string} endTag @param {string} [startTag] */
	UNCOMPLETED: (endTag, startTag) => startTag 
	? `end tag name: ${endTag} is not complete: ${startTag}`
	: `end tag name: ${endTag} maybe not complete`,
	/** @param {string} entity */
	ENTITY: entity => `entity not found: ${entity}`,
	/** @param {string} symbol */
	SYMBOL: symbol => `unexpected symbol: ${symbol}`,
	/** @param {string} tag */
	TAG: tag => `invalid tagName: ${tag}`,
	/** @param {string} attr */
	ATTR: attr => `invalid attribute: ${attr}`,
	EQUAL: 'attribute equal must after attrName',
	ATTR_VALUE: 'attribute value must after "="',
	EOF: `unexpected end of file`,
}
export default class ParseError extends Error {
	/**
	 * @param {keyof typeof errors} code
	 * @param {...*} p 
	 */
	constructor(code, ...p) {
		/** @type {*} */
		const f = errors[code];
		if (typeof f === 'function') {
			super(f(...p));

		} else {
			super(f);
		}
		this.code = code;
	}
}
