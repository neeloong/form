/** @import Store from './Store/index.mjs' */
/** @import * as Layout from './Layout/index.mjs' */

/**
 * @typedef {any} VerifyError
 */
/**
 * @typedef {object} Component.Attr 组件属性定义
 * @property {string} type 属性类型
 * @property {boolean} [isProp] 是否为 js 属性
 * // TODO: 可否计算，可否关联
 * @property {[event: string, set: Layout.EventListener, boolean?] | 'hidden' | 'clearable' | 'readonly' | 'disabled' | 'required'} [bind] 绑定方式
 * @property {*} [default] 默认值
 * @property {boolean} [immutable] 是否不可变
 * 
 */
/**
 * @typedef {object} Component.Context.Events
 * @property {[value: {events: [string, ($event: any) => void, AddEventListenerOptions][]}]} init
 * @property {[]} destroy
 */
/**
 * @typedef {object} Component.Context 自定义组件的上下文
 * @property {Set<string>?} [props] js 属性列表
 * @property {[string, ($event: any) => void, AddEventListenerOptions][]} events 上下文事件
 * @property {Record<string, any>} attrs 上下文属性
 * @property {(name: any, fn: (value: any, old: any, name: string) => void) => () => void} watch 属性监听
 * @property {(el: Element | Relatedness) => () => void} relate 关联
 * @property {boolean} destroyed 是否已经销毁
 * @property {boolean} init 是否完成初始化
 * @property {<K extends keyof Component.Context.Events>(event: K, listener: (...p: Component.Context.Events[K]) => void) => () => void} listen 状态监听
 */

/**
 * @typedef {object} Component.Event 组件事件配置
 * @property {Record<string, Component.Event.Filter | string>} filters 过滤器配置
 * 
 */
/**
 * @callback Component.Event.Filter 组件事件过滤器
 * @param {*} $event 事件
 * @param {string[]} param 参数
 * @param {*} env 环境
 * @returns {boolean | null | void}
*/
/**
 * @typedef {object} Component 自定义组件
 * @property {string | ((ctx: Component.Context) => Element | [Element, (Element | null)?])} tag 组件标签
 * @property {string} [is]
 * @property {Record<string, Component.Attr>} [attrs] 组件属性
 * @property {Record<string, Component.Event>} [events] 组件事件
 */
/**
 * @callback Component.Getter 自定义组件函数获取器
 * @param {string[]} path 组件路径
 * @param {(path: string[]) => Component?} [next]
 * @returns {Component?}
 */
/**
 * @template [M=any]
 * @typedef {(Schema.Object<M> | Schema.Type) & Schema.Attr<M>} Schema.Field 字段定义
 */
/**
 * @template [M=any]
 * @typedef {Record<string, Schema.Field<M>>} Schema
 */
/**
 * @typedef {Schema.Value | string | number} Schema.Value.Define 可选值定义
 * @property {string} label 标签
 * @property {string | number} value 值
 */
/**
 * @typedef {object} Schema.Value.Group.Define 可选值分组定义
 * @property {string} label 标签
 * @property {string | number} [value] 值
 * @property {(Schema.Value.Group | Schema.Value.Define)[]} children 子数据
 */
/**
 * @typedef {object} Schema.Value 可选值
 * @property {string} label 标签
 * @property {string | number} value 值
 */
/**
 * @typedef {object} Schema.Value.Group 可选值分组
 * @property {string} label 标签
 * @property {string | number} [value] 值
 * @property {(Schema.Value.Group | Schema.Value)[]} children 子数据
 */
/**
 * @template [M=any]
 * @typedef {object} Schema.Object 对象类型定义
 * @property {Record<string, Schema.Field<M>>} type 字段定义
 * @property {boolean} [array] 是否为数组
 */
/**
 * @typedef {object} Schema.Type 基本类型字段定义
 * @property {string} type 类型
 * @property {boolean} [array] 是否为数组
 */


/**
 * @typedef {object} Schema.Events 函数定义
 * @property {InputEvent} input 输入
 * @property {InputEvent} change 变化
 * @property {Event} click 点击
 * @property {Event} focus 聚焦
 * @property {Event} blur 失焦
 */
/**
 * @callback Validator 同步验证器
 * @param {Store} store 存储体
 * @returns {string | string[] | void | null} 错误信息
 */
/**
 * @callback AsyncValidator 异步验证器
 * @param {Store} store 存储体
 * @param {AbortSignal} signal 终止信号
 * @returns {PromiseLike<string | string[] | void | null> | string | string[] | void | null} 错误信息
 */
/**
 * @template [M=any]
 * @typedef {object} Schema.Attr
 * @property {M} [meta] 元信息
 * @property {((store: Store) => any) | any} [default]
 * @property {any} [component] 自定义组件
 * @property {boolean} [immutable] 是否可修改
 * @property {boolean} [creatable] 是否可创建
 * @property {boolean | ((store: Store) => boolean) | null} [hidden] 是否隐藏
 * @property {boolean | ((store: Store) => boolean) | null} [clearable] 是否可清除
 * @property {boolean | ((store: Store) => boolean) | null} [required] 是否必填
 * @property {boolean | ((store: Store) => boolean) | null} [disabled] 是否禁用
 * @property {boolean | ((store: Store) => boolean) | null} [readonly] 是否只读
 * @property {string | ((store: Store) => string?) | null} [label] 字段标签
 * @property {string | ((store: Store) => string?) | null} [description] 字段描述
 * @property {string | ((store: Store) => string?) | null} [placeholder] 占位符
 * @property {number | ((store: Store) => number?) | null} [min] 日期、时间、数字的最小值
 * @property {number | ((store: Store) => number?) | null} [max] 日期、时间、数字的最大值
 * @property {number | ((store: Store) => number?) | null} [step] 日期、时间、数字的步长
 * @property {number | ((store: Store) => number?) | null} [minLength] 最小长度
 * @property {number | ((store: Store) => number?) | null} [maxLength] 最大长度
 * @property {RegExp | ((store: Store) => RegExp?) | null} [pattern] 模式规则
 * @property {boolean | ((store: Store) => boolean) | null} [addable] 数组内是否可添加
 * @property {boolean | ((store: Store) => boolean) | null} [removable] 数组内是否可移除
 * @property {(Schema.Value.Group.Define | Schema.Value.Define)[] | ((store: Store) => (Schema.Value.Group.Define | Schema.Value.Define)[])} [values] 可选值
 * @property {{[k in keyof Schema.Events]?: ((this: Store, value: Schema.Events[k], store: Store) => void | boolean | null)?}} [events] 监听函数
 * @property {Validator | Validator[] | null} [validator] 同步验证器
 * @property {{[k in 'change' | 'blur']?: AsyncValidator | AsyncValidator[] | null}} [validators] 异步验证器
 */

/**
 * @typedef {object} Relatedness 
 * @property {() => void} [focus] 聚焦函数
 * @property {() => void} [scrollIntoView] 展示函数
 * @property {Element} [input] 输入元素
 * @property {Element} [root] 根元素
 */


/**
 * @callback Enhancement 增强函数
 * @param {Enhancement.Context} context 上下文
 */




/**
 * @typedef {object} Enhancement.Context 增强函数上下文
 * @property {[string, ($event: any) => void, AddEventListenerOptions][]} events 关联的事件
 * @property {Record<string, any>} attrs 关联的属性
 * @property {(name: any, fn: (value: any, old: any, name: string) => void) => () => void} watch 监听属性
 * @property {boolean} destroyed 是否已经销毁
 * @property {(event: 'destroy', listener: () => void) => () => void} listen 监听状态
 * @property {any} tag 标签名
 * @property {Element} root 根元素
 * @property {Element?} [slot] 槽元素
 * @property {any} value 传入的默认值
 */
