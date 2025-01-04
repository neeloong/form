
import { Store, Layout, render } from '@neeloong/form';
/** @import { Schema } from '@neeloong/form'; */
const template = `
<input !value="a" !bind="$value" />
		<input !bind="a" />
<ul +a=1>
	<li !value="list" !enum>
		<input !bind="b" />
		<ul !value="c" +x="0">
			<li !enum +b=alias$length +a=2 +k="++x">
				<div !fragment !text="k"></div>
				<button @click="a+=1">a+1:<span !fragment !text="a"></span></button>
				<button @click="b+=1">b+1:<span !fragment !text="b"></span></button>
					<input !bind=a type=number />
				<div !fragment !text="$no"/>. <div !fragment !text="d">1</div> <div !fragment !text>1</div>
				<button @click="$remove">移除</button>
				<button @click="$upMove" :disabled="!$upMovable">上移</button>
				<button @click="$downMove()" :disabled="!$downMovable">下移</button>
			</li>
			<li><button @click="$add(0)">添加</button><button @click="$add( - $length - 1)">添加(<span !fragment !text=" - $length - 1"></span>)</button></li>
		</ul>
	</li>
</ul>
`

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

/**
 * @type {Schema}
 */
const schema = {
	a: { type: 'int', disabled: true },
	list: { array: true, props: {
			b: { type: 'int', disabled: true },
			c: { array: true, type: 'int' },
		},
	},
};
const defaultValue = {
	a: 5,
	list: {b: 2, c: [1,2,3,4,5]}
}
const layouts = Layout.parse(template, layoutOptions);

const store = Store.create(schema);
store.value = defaultValue
/** @type {Element} */
// @ts-ignore
const app = document.querySelector('#app');
render(store, layouts, app);
