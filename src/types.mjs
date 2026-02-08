/** @import * as Layout from './Layout/index.mjs' */
/** @import { StoreLayout } from './StoreLayout.types.mjs' */

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
 * @property {(el: Element | StoreLayout.Relatedness) => () => void} relate 关联
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
