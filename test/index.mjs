import { Store, Layout, render } from '@neeloong/form';
/** @import { Schema } from '@neeloong/form'; */
/**
 * @type {Schema}
 */
const schema = {
	int: { type: 'int' },
	a: { array: true, type: {
			b: { type: 'int', disabled: true },
			c: { array: true, type: { d: {type: 'int'}, } },
			x: { array: true, type: 'int' },
		},
	},
};
/** @type {Layout.Options} */
const layoutOptions = {
	createCalc: value => {
		const fn = new Function('globalThis', `with(globalThis) { return ${value} }`);
		fn.toString = () => value;
		return /** @type {*} */(fn);
	},
	createEvent: value => {
		const fn = new Function('$event', 'globalThis', `with(globalThis) { ${value} }`);
		fn.toString = () => value;
		return /** @type {*} */(fn);
	},
}

const defaultValue = {
	a: {b: 2, c: [{d:1},{d:2},{d:3},{d: 4},{d: 5}], x: [1, 2, 3, 4, 5]}
}
fetch('./template').then(v => v.text()).then(template => {
	const layouts = Layout.parse(template, layoutOptions);

	const store = Store.create(schema);
	store.value = defaultValue
	setTimeout(() => {
		const it = store.child('a')?.child(0)?.child('c')?.child(0);
		if (it)
		setInterval(() => {
			it.value= {d:Math.random()};
		}, 100);
	
	}, 100)
	/** @type {Element} */
	// @ts-ignore
	const app = document.querySelector('#app');
	render(store, layouts, app);
})
