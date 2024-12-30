import createContext from './createContext.mjs';
import toAttrValue from './toAttrValue.mjs';

/**
 * 
 * @param {ReturnType<typeof createContext>['cContext']} cContext 
 * @param {*} name 
 * @param {*} is 
 */
export default function (cContext, name, is) {
	const node = document.createElement(name, {is: is || undefined});
	const {event, tagAttrs, watchAttr, attrs, props } = cContext;

	for (const a of Object.keys(event)) {
		node.addEventListener(a, event[a]);
	}
	for (const a of Object.keys(tagAttrs)) {
		watchAttr(a, v => {
			if (attrs.has(a)) {
				const val = toAttrValue(v);
				if (val == null) {
					node.removeAttribute(a);
				} else {
					node.setAttribute(a, val);
				}
			}
			if (props.has(a)) { node[a] = v; }
		})
		// @ts-ignore
		const v = tagAttrs[a];
		if (props.has(a)) { node[a] = v; }
		if (attrs.has(a)) {
			const val = toAttrValue(v);
			if (val !== null) {
				node.setAttribute(a, val);
			}
		}
	}
	return node;
}
