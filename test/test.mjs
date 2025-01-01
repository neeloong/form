import { Value, Layout, render } from '../src/index.mjs';
/** @import { Schema } from '../src/types.mjs'; */
/**
 * @type {Record<string, Schema.Field>}
 */
const schema = {
	int: { type: 'int' },
	a: { array: true, props: {
			b: { type: 'int' },
			c: { array: true, props: { d: {type: 'int'}, } },
			x: { array: true, type: 'int' },
		},
	},
};
/** @type {Layout.Options} */
const layoutOptions = {
	creteCalc: value => {
		const fn = new Function('globalThis', `with(globalThis) { return ${value} }`);
		fn.toString = () => value;
		return /** @type {*} */(fn);
	},
	creteEvent: value => {
		const fn = new Function('$event', 'globalThis', `with(globalThis) { ${value} }`);
		fn.toString = () => value;
		return /** @type {*} */(fn);
	},
}

const dataValues = {
	a: {b: 2, c: [{d:1},{d:2},{d:3},{d: 4},{d: 5}], x: [1, 2, 3, 4, 5]}
}
fetch('./template.xml').then(v => v.text()).then(template => {
	const layouts = Layout.parse(template, layoutOptions);
	console.log(Layout.toString(layouts, true))
	console.log(Layout.toString(layouts))

	const data = Value.create(schema);
	data.value = dataValues
	setTimeout(() => {
		const it = data.child('a')?.child(0)?.child('c')?.child(0);
		if (it)
		setInterval(() => {
			it.value= {d:Math.random()};
		}, 100);
	
	}, 100)
	/** @type {Element} */
	// @ts-ignore
	const app = document.querySelector('#app');
	render(data, layouts, app);
})
