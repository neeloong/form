import { Schema, LayoutNode } from './index.mjs';

const layouts = LayoutNode.parse(await fetch('./template.xml').then(v => v.text()));


const s = Schema.create({
	a: {
		props: {
			b: {type: 'int'},
			c: {
				props: {
					d: {type: 'int'},
				},
				array: true,
			},
		},
		array: true,
	},
});
s.value = {
	a: {b: 2, c: [{d:1},{d:2},{d:3},4,5]}
}
setTimeout(() => console.log(s, s.value), 1000)
setInterval(() => s.value = {
	a: {b: 2, c: [{d:1},{d:Math.random()},{d:3},4,5]}
}, 100)
/**
 * @typedef {object} Attr
 * @property {string} type
 * // TODO: 可否计算，可否关联
 */
/**
 * @typedef {object} LayoutAttr
 * @property {any} [value]
 * @property {string} [bind]
 * @property {string} [computed]
 */
/**
 * @typedef {object} Directives
 * @property {string | true} [item] 列表循环的项目名
 * @property {string} [name] 
 * @property {string} [key] 
 * @property {string} [no]
 * @property {string} [value] 值关联（关联为列表）
 */
/** @type {Element} */
// @ts-ignore
const app = document.querySelector('#app');
s.render(layouts, app, s, {
	common: {
		
	}, roots: {

	}
})
