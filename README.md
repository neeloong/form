@neeloong/form
===================

`@neeloong/form` 是一个基于响应式数据绑定的表单渲染库，目前使用 [tc39/proposal-signals](https://github.com/tc39/proposal-signals) 的 [polyfill](https://github.com/proposal-signals/signal-polyfill.git)实现状态管理。其模板语法结合了声明式指令和灵活的变量管理，支持复杂表单的动态渲染和交互。

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

- `Layout.parse(template, options)` 解析模板字符串，返回布局配置。
- `Store.create(schema)` 创建表单存储实例，绑定数据与 Schema。
- `render(store, layouts, parent)` 将表单渲染到指定 DOM 元素。

具体定义类型定义文件

## 模板语法

###  基础语法

####  标签属性
- **指令属性**：以 `!` 开头，用于条件渲染、循环等。  
- **增强指令**：以 `~` 开头，用于自定义功能扩展（如表单验证、动态行为）。  
- **事件绑定**：以 `@` 开头，绑定事件处理函数。  
- **属性绑定**：以 `:` 开头，绑定动态属性值。  

#### 表达式语法
直接写在属性值中，支持 JavaScript 表达式。

```html
<div !text="a + b"></div>
```

#### 属性绑定

```html
<div :id="dynamicId"></div>
```

#### 事件绑定

```html
<button @click="handleClick($event)">点击</button>
```

事件对象（如鼠标坐标、键盘键码）可通过 `$event` 获取。  

```html
<input @input="value = $event.target.value">
```

### 数据绑定与变量

#### 变量声明
- **显式变量（`+var`）**：  
  在标签中声明局部变量，作用域仅限当前标签及子标签。  
  ```html
  <div +count="0"> <!-- 初始化 count 为 0 -->
    <button @click="count += 1" v-text="count"></button>
  </div>
  ```

- **别名（`*alias`）**：  
  为复杂表达式或字段设置别名，简化引用。  
  ```html
  <div *len="array$length" !text="len"></div> <!-- 别名 len 指向当前数组长度 -->
  ```

- **计算值（`*computed`）**：  
  动态计算表达式，值随依赖变量变化自动更新。  
  ```html
  <div *double="a * 2" !text="double"></div>
  ```

- **字段变量（`field$value`）**：  
  直接访问字段的原始值，例如：  
  ```html
  <input !value="a" !text="field$value"> <!-- field$value 是字段 field 的原始值 -->
  ```

#### **2.2 变量优先级**
变量优先级从高到低：  
1. **显式变量（`+var`）与别名（`*alias`）**  
3. **计算值（`*computed`）**  
4. **字段变量（`field$value`）**  
5. **全局变量（通过 `render` 的 `global` 参数传入）**  

### 条件渲染（`!if` `!else`）
- **基本用法**：  
  ```html
  <div !if="a > 0">条件成立</div>
  <div !else !if="b < 0">条件二成立</div>
  <div !else>其他情况</div>
  ```
- **注意事项**：  
  - `!else` 必须与同级的 `!if` 同级，否则会被忽略。  
  - 嵌套条件需使用多个同级标签。  

```html
<div !if="a">
  <div !else !if="b"></div> <!-- !else 未与前一个 !if 同级，会被忽略 -->
</div>
```

### 循环与枚举渲染（`!enum`）

#### 基础用法

```html
<ul>
  <li !enum="items" !text="$item"></li> <!-- items 是数组 -->
</ul>
```

#### 嵌套循环

```html
<div !enum="outerArray" *outerLen="$length">
  <div !enum="innerArray">
    <span !text="outerLen + ' + ' + $length"></span> <!-- 外层长度 + 内层长度 -->
  </div>
</div>
```

### 循环中的变量作用域

每个循环项拥有独立作用域，变量互不影响。  
```html
<ul>
  <li !enum="items" +count="0">
    <button @click="count += 1" v-text="count"></button> <!-- 每个按钮独立计数 -->
  </li>
</ul>
```

### 子属性

```html
<h1 !value="subField"></h1>
```

### 字段绑定

```html
<input !bind="a" !placeholder="请输入值" />
```
- **双向绑定**：字段值与表单数据同步更新。  

### 片段（`!fragment`）

包裹多标签内容，形成作用域。

```html
<span !fragment !if="a">
   <p>内容1</p>
   <p>内容2</p>
</span>
```

`!fragment` 所在的标签不会被渲染。

### 文本渲染(`!text`) 与 html 渲染(`!html`)

**`!text`**：渲染纯文本

```html
<div !text="a"></div>
```

- **`!html`**：渲染 HTML 内容（需确保内容安全）

```html
<div !html="safeHTML"></div>
```

若 `!text` 与 `!html` 同时存在，`!html` 会被忽略。

### 注释（`!comment`）

仅用于开发，对渲染无影响。  

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

### 增强指令（`~`）

#### 自定义指令

通过参数注册自定义指令

- **使用增强指令**：  
  ```html
<div ~en:attr="a" ~en@event="show($event)" ~en!bind="bindValue" ~en="value"></div>
  ```

#### 增强指令顺序
按标签中首次出现的顺序执行。  

```html
<div ~a ~b ~c></div> <!-- 先执行 a，再 b，最后 c -->
```

### 各用法的优先级

优先级从高到低:

1. 模板定义: `!template`
1. 条件: `!if` `!else`
1. 子属性: `!value`
1. 枚举: `!enum`
1. 别名、计算名与显式变量: `*别名` `*计算名` `+变量`
1. 片段与模板调用: `!fragment` 
1. 属性与事件: `:绑定属性` `@事件` `普通属性` `!bind`
1. 子内容: `!text` `!html`
1. 注释: `!comment`

### 变量
1. 字段扩展隐式属性
   - `$value` 字段当前值
   - `$state` 字段状态
   - `$store` 只读 当前字段表单存储实例
   - `$schema` 只读 字段的 Schema 定义
   - `$null` 只读 是否为空元素
   - `$index` 只读 当前项的索引
   - `$no` 只读 数组项目的序号
   - `$length` 只读 数组的长度、对象的成员数
   - `$creatable` 只读 值是否可创建（`$new` 为 `true` 时，字段只读）
   - `$immutable` 只读 值是否不可改变（`$new` 为 `false` 时，字段只读）
   - `$new` 只读 是否新建项
   - `$readonly` 只读 是否只读
   - `$hidden` 只读 是否可隐藏
   - `$clearable` 只读 是否可清除
   - `$required` 只读 是否必填
   - `$disabled` 只读 是否禁用字段
   - `$label` 只读 字段的标签信息
   - `$description` 只读 字段的描述信息
   - `$placeholder` 只读 字段的占位符信息
   - `$min` 只读 数值字段的最小值限制
   - `$max` 只读 数值字段的最大值限制
   - `$step` 只读 数值字段的步长
   - `$minLength` 只读 最小长度
   - `$maxLength` 只读 最大长度
   - `$pattern` 只读 模式
   - `$values` 只读 可选值
   - `$type` 只读 字段类型
   - `$meta` 只读 字段元信息
   - `$component` 只读 自定义渲染组件信息
   - `$kind` 只读 字段类别
   - `$error` 只读 字段校验错误信息
   - `$errors` 只读 所有校验错误列表
1. 数组字段扩展隐式函数（只在事件中可用）
   - `$reset()` 重置数据
   - `$validate()` 触发当前项的异步校验
   - `$validate(true)` 触发当前项及其后代的异步校验
1. 数组字段扩展隐式函数（只在事件中可用）
   - `$insert(index, value)` 在指定索引插入值
   - `$add(value)` ：向数组末尾添加值。
   - `$remove(index)` 删除指定索引的项
   - `$move(from, to)` 移动数组项
   - `$exchange(a, b)` 切换 a b 两项
1. 数组成员字段扩展隐式属性
   - `$upMovable` 只读 是否可上移
   - `$downMovable` 只读 是否可下移
1. 数组成员字段扩展隐式函数（只在事件中可用）
   - `$remove()` 移除当前项
   - `$upMove()` 上移当前项
   - `$downMove()` 下移当前项
1. 上下文隐式变量
   - '$store' 只读 当前表单存储实例。
   - '$root' 只读 根上下文对象。
1. 当前范围及组件范围的所有字段（数组字段的成员除外，因为数组字段成员索引为数字，不符合标识符命名规则）都存在 `field$value` 及 `field$$value` 形式的变量
1. 如果别名为字段的别名（如 `*alias="v"`），则也存在 `alias$value` 形式的变量
1. 当存在同名变量时，则会按照变量来源类型决定优先级，从高到低依次为：
   1. 上下文隐式变量
   1. 显式声明（如别名、计算名、显式变量），如果别名是字段的别名，则也包括 `alias$value` 形式的变量
   1. 全局变量，此部分由 `render` 的参数传入
   1. 字段声明，包括 `field$value` 及 `field$$value` 形式的变量
1. 在同一来源类型重复的变量名，再按照作用域处理
1. 同一作用域下的别名（或计算名）与显式变量重名时，由于会先处理别名，所以，显式变量会覆盖别名。

### 示例代码

#### 嵌套表单与循环

```html
<ul !enum="users">
  <li !enum="user.orders">
    <div !text="user.name"></div>
    <div !text="order.amount"></div>
    <button @click="$remove">删除</button>
  </li>
</ul>
```

#### 条件渲染与字段绑定

```html
<div !if="showForm">
  <input !bind="username" !placeholder="用户名" />
  <button @click="$submit">提交</button>
</div>
<div !else !text="暂无表单"></div>
```

#### 渲染一个带条件和循环的表单

```html
<div>
  <h1 !text="title"></h1>
  
  <div !if="showForm">
    <form !enum="fields">
      <div !enum="items">
        <input !bind="value" !placeholder="placeholder">
      </div>
    </form>
  </div>
  <div !else !text="暂无数据"></div>

  <!-- 添加按钮 -->
  <button @click="$add('new item')">添加项</button>
</div>
```
