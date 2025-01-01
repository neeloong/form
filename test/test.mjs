import { Value, Layout, render } from '../src/index.mjs';

fetch('./template.xml').then(v => v.text()).then(template => {
	const layouts = Layout.parse(template);
	
	const data = Value.create({
		int: { type: 'int' },
		a: { array: true, props: {
				b: { type: 'int' },
				c: { array: true, props: { d: {type: 'int'}, } },
				x: { array: true, type: 'int' },
			},
		},
	});
	data.value = {
		a: {b: 2, c: [{d:1},{d:2},{d:3},4,5], x: [{d:1},{d:2},{d:3}, 4, 5]}
	}
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
