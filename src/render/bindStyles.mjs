import computed from '../computed/index.mjs';
import { Schema } from '../schema.mjs';
import execSchema from './execSchema.mjs';

/** @type {Record<string, string>} */
const unit = {
	'width': 'px',
	'height': 'px',
	'top': 'px',
	'right': 'px',
	'bottom': 'px',
	'left': 'px',
	'border': 'px',
	'border-top': 'px',
	'border-right': 'px',
	'border-left': 'px',
	'border-bottom': 'px',
	'border-width': 'px',
	'border-top-width': 'px',
	'border-right-width': 'px',
	'border-left-width': 'px',
	'border-bottom-width': 'px',
	'border-radius': 'px',
	'border-top-left-radius': 'px',
	'border-top-right-radius': 'px',
	'border-bottom-left-radius': 'px',
	'border-bottom-right-radius': 'px',
	'padding': 'px',
	'padding-top': 'px',
	'padding-right': 'px',
	'padding-left': 'px',
	'padding-bottom': 'px',
	'margin': 'px',
	'margin-top': 'px',
	'margin-right': 'px',
	'margin-left': 'px',
	'margin-bottom': 'px',
};
/**
 * 
 * @param {string} name 
 * @param {any} value 
 * @returns {[string, 'important' | undefined]?}
 */
function toStyle(name, value) {
	let important = Array.isArray(value) ? Boolean(value[1]) : false;
	let style = '';
	/** @typedef {[string, 'important' | undefined]} Result */
	if (typeof value === 'string') {
		style = value.replace(/!important\s*$/, '');
		if (!style) { return null; }
		important = style !== value;
		return [style, important ? 'important' : undefined];
	}
	const val = Array.isArray(value) ? value[0] : value;
	if (typeof val === 'number' || typeof val === 'bigint') {
		style = val && name in unit ? `${ val }${ unit[name] }` : `${ val }`;
	} else if (typeof val === 'string') {
		style = val;
	}
	if (!style) { return null; }
	return [style, important ? 'important' : undefined];


}


/**
 * @param {Element} node
 * @param {Schema} schema
 * @param {any} envs
 * @param {Record<string, string | ((...any: any) => void)>} classes
 */
export default function bindStyles(node, classes, schema, envs) {
	if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) {
		return () => {};
	}

	/** @type {Set<() => void>?} */
	let bk = new Set();
	for (const [name, attr] of Object.entries(classes)) {
		const result = computed(() => toStyle(name, execSchema(schema, attr, envs)));
		let value = result.value;
		if (value) { node.style.setProperty(name, ...value); }
		bk.add(() => result.stop());
		result.listen((val) => {
			if (!bk) { return; }
			value = val;
			if (value) {
				node.style.setProperty(name, ...value);
			} else {
				node.style.removeProperty(name);
			}
		});
	}
	// TODO: 创建组件
	return ()=> {
		if (!bk) { return; }
		const list = bk;
		bk = null;
		for (const s of list) {
			s();
		}
	}
}
