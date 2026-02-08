/** @import Store from './Store/index.mjs' */
/** @import { StoreLayout } from './StoreLayout.types.mjs' */


/**
 * @callback Schema.Validator 同步验证器
 * @param {Store} store 存储体
 * @returns {string | string[] | void | null} 错误信息
 */
/**
 * @callback Schema.AsyncValidator 异步验证器
 * @param {Store} store 存储体
 * @param {AbortSignal} signal 终止信号
 * @returns {PromiseLike<string | string[] | void | null> | string | string[] | void | null} 错误信息
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
 * @property {Schema.Validator | Schema.Validator[] | null} [validator] 同步验证器
 * @property {{[k in 'change' | 'blur']?: Schema.AsyncValidator | Schema.AsyncValidator[] | null}} [validators] 异步验证器
 * @property {StoreLayout.Field<any>} [layout]
 */
