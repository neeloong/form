
import { Store, Layout, render } from '@neeloong/form';
/** @import { Schema } from '@neeloong/form'; */
const template = `
<input !value="a" !bind="$value" />
<input !bind="a" />
<ul +a=1 *alias="list">
	<li !enum="alias">
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
<select !bind="select">
	<option value !text="select$placeholder"></option>
	<option !fragment !enum="select$values" *children="$value.children">
		<optgroup !if="$value.children" :label="$value.label">
			<option !enum="$value.children" :value="$value.value" !text="$value.value"></option>
		</optgroup>
		<option !else :value="$value.value" !text="$value.value"></option>

	</option>
</select>
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
	a: { type: 'int', disabled: true, placeholder: '这是a的占位符', },
	list: { array: true, props: {
			b: { type: 'int', disabled: true, placeholder: '这是b的占位符' },
			c: { array: true, type: 'int' },
		},
	},
	select: {
		type: 'string',
		placeholder: '这是占位符',
		values: [
			{label: 'test 1', value: '1'},
			{label: 'test 2', value: '2'},
			{label: 'test 3', value: '3'},
			{label: 'g 4',  children: [
				{label: 'g 4 test 1', value: '4-1'},
				{label: 'g 4 test 2', value: '4-2'},
				{label: 'g 4 test 3', value: '4-3'},

			]},
			{label: 'test 5', value: '5'},
			{label: 'g 6',  children: [
				{label: 'g 6 test 1', value: '6-1'},
				{label: 'g 6 test 2', value: '6-2'},
				{label: 'g 6 test 3', value: '6-3'},

			]},
		]
	}
};
const defaultValue = {
	a: 5,
	list: {b: 2, c: [1,2,3,4,5]},
}
const layouts = Layout.parse(template, layoutOptions);

const store = Store.create(schema);
setInterval(() => console.log(store.value), 500);
store.value = defaultValue
/** @type {Element} */
// @ts-ignore
const app = document.querySelector('#app');
render(store, layouts, app);
