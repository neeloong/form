import { Value, Layout } from '../src/index.mjs';

fetch('./template.xml').then(v => v.text()).then(template => {
	const layouts = Layout.parse(template);
	
	const s = Value.create({
		int: {type: 'int'},
		a: {
			props: {
				b: {type: 'int'},
				c: {
					props: {
						d: {type: 'int'},
					},
					array: true,
				},
				x: {
					type: 'int',
					array: true,
				},
			},
			array: true,
		},
	});
	s.value = {
		a: {b: 2, c: [{d:1},{d:2},{d:3},4,5], x: [{d:1},{d:2},{d:3},4,5]}
	}
	setTimeout(() => {
		const it = s.child('a')?.child(0)?.child('c')?.child(0);
		console.log(s)
		if (it)
		setInterval(() => {
			it.value= {d:Math.random()};
		}, 100);
	
	}, 100)
	/** @type {Element} */
	// @ts-ignore
	const app = document.querySelector('#app');
	s.render(layouts, app)
	

})
