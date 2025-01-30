neeloongForm
===================

一个表单布局渲染库

相应式的实现,目前采用 [tc39/proposal-signals](https://github.com/tc39/proposal-signals) 的 [polyfill](https://github.com/proposal-signals/signal-polyfill.git)

```js

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


```

## API

- `Layout.parse(template, options)` 解析模板
- `Store.create(schema)` 创建存储
- `render(store, layouts, element, global, components)` 渲染表单


## 模板语法

### 属性绑定

```html
<div :id="dynamicId"></div>
```

### 事件监听

```html
<div @click="doSomething"></div>
```

### 条件渲染

```html
<h1 !if="a"></h1>
<h2 !else !if="b"></h2>
<h3 !else !if="c"></h3>
<p !else></p>
```

### 子属性

```html
<h1 !value="subField"></h1>
```

### 列表子属性

```html
<h1 !enum="subArrayField"></h1>
```

### 字段绑定

```html
<input !bind="field" />
```

### 片段

```html
<tagName !fragment></tagName>
```

### 文本渲染与 html 渲染

```html
<span !text="text"></span>
```

```html
<div !html="html"></div>
```

### 注释
```html
<div !comment="注释内容"></div>
```

### 别名与计算值

```html
<div *alias1="v1" *computed="v1 + v2"></div>
```


### 显式变量（局部变量）

```html
<div +var1="123"></div>
```

### 增强
```html
<div ~en:attr="a" ~en@event="show($event)" ~en!bind="bindValue" ~en="value"></div>

```

### 各用法的优先级

优先级从高到低:

1. 模板定义: `!template`
1. 条件: `!if` `!else`
1. 子属性: `!value`
1. 枚举: `!enum`
1. 别名与计算名: `*别名` `*计算名`
1. 显式变量: `+变量`
1. 片段与模板调用: `!fragment` 
1. 属性与事件: `:绑定属性` `@事件` `普通属性` `!bind`
1. 子内容: `!text` `!html`
1. 注释: `!comment`


### 变量
1. 字段扩展隐式属性
   - `$value` 
   - `$state` 
   - `$store` 只读属性
   - `$schema` 只读属性
   - `$null` 只读属性
   - `$index` 只读属性
   - `$no` 只读属性
   - `$length` 只读属性
   - `$creatable` 只读属性
   - `$immutable` 只读属性
   - `$new` 只读属性
   - `$readonly` 只读属性
   - `$hidden` 只读属性
   - `$clearable` 只读属性
   - `$required` 只读属性
   - `$disabled` 只读属性
   - `$label` 只读属性
   - `$description` 只读属性
   - `$placeholder` 只读属性
   - `$min` 只读属性
   - `$max` 只读属性
   - `$step` 只读属性
   - `$minLength` 只读属性
   - `$maxLength` 只读属性
   - `$pattern` 只读属性
   - `$values` 只读属性
   - `$type` 只读属性
   - `$meta` 只读属性
   - `$component` 只读属性
   - `$kind` 只读属性
   - `$error` 只读属性
   - `$errors` 只读属性
1. 数组字段扩展隐式函数（只在事件中可用）
   - `$insert(index, value)`
   - `$add(value)`
   - `$remove(index)`
   - `$move(from, to)`
   - `$exchange(a, b)`
   - `$reset()`
   - `$validate()`
   - `$validate(true)`
1. 数组成员字段扩展隐式属性
   - `$upMovable` 只读属性
   - `$downMovable` 只读属性
1. 数组成员字段扩展隐式函数（只在事件中可用）
   - `$remove()`
   - `$upMove()`
   - `$downMove()`
1. 上下文隐式变量
   - '$store' 只读属性
   - '$root' 只读属性
1. 当前范围及组件范围的所有字段（数组字段的成员除外，因为数组字段成员索引为数字，不符合标识符命名规则）都存在 `field$value` 及 `field$$value` 形式的变量
1. 如果别名为字段的别名，则也存在 `alias$value` 形式的变量
1. 当存在同名变量时，则会按照变量来源类型决定优先级，从高到低依次为：
   1. 上下文隐式变量
   1. 显式声明（如别名、计算名、显式变量），如果别名是字段的别名，则也包括 `alias$value` 形式的变量
   1. 全局变量，此部分由 `render` 的参数传入
   1. 字段声明，包括 `field$value` 及 `field$$value` 形式的变量
1. 在同一来源类型重复的变量名，再按照作用域处理
1. 同一作用域下的别名（或计算名）与显式变量重名时，由于会先处理别名，所以，显式变量会覆盖别名。
