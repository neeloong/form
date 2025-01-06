/** @import Store from './Store/index.mjs' */
/** @import * as Layout from './Layout/index.mjs' */

/**
 * @typedef {any} VerifyError
 */
/**
 * @typedef {object} Component.Attr
 * @property {string} type
 * @property {boolean} [isProp]
 * // TODO: 可否计算，可否关联
 * @property {[event: string, set: Layout.EventListener, boolean?] | 'hidden' | 'clearable' | 'readonly' | 'disabled' | 'required'} [bind]
 * @property {*} [default]
 * @property {boolean} [immutable]
 * 
 */
/**
 * @typedef {object} Component.Handler
 * @property {(name: string, value: any) => void} set
 * @property {(event: string, listener: Layout.EventListener) => void} addEvent
 * @property {() => void} destroy
 * @property {any} tag
 * @property {() => void} init
 */
/**
 * @typedef {object} Component.Context.Events
 * @property {[value: {events: [string, ($event: any) => void, AddEventListenerOptions][]}]} init
 * @property {[]} destroy
 */
/**
 * @typedef {object} Component.Context
 * @property {Set<string>?} [props]
 * @property {[string, ($event: any) => void, AddEventListenerOptions][]} events
 * @property {Record<string, any>} tagAttrs
 * @property {(name: any, fn: (value: any, old: any, name: string) => void) => () => void} watchAttr
 * @property {boolean} destroyed
 * @property {boolean} init
 * @property {<K extends keyof Component.Context.Events>(event: K, listener: (...p: Component.Context.Events[K]) => void) => () => void} listen
 */

/**
 * @typedef {object} Component.Event
 * @property {Record<string, Component.Event.Filter | string>} filters 过滤器
 * 
 */
/**
 * @callback Component.Event.Filter
 * @param {*} $event
 * @param {string[]} param
 * @param {*} env
 * @returns {boolean | null | void}
*/
/**
 * @typedef {object} Component
 * @property {string | ((ctx: any) => Element)} tag
 * @property {string} [is]
 * @property {Record<string, Component.Attr>} [attrs]
 * @property {Record<string, Component.Event>} [events]
 */
/**
 * @callback ComponentGetter
 * @param {string[]} path
 * @param {(path: string[]) => Component?} [next]
 * @returns {Component?}
 */
/**
 * @typedef {(Schema.Object | Schema.Type) & Schema.Attr} Schema.Field
 */
/**
 * @typedef {Record<string, Schema.Field>} Schema
 */
/**
 * @typedef {Schema.Value | string | number} Schema.Value.Define
 * @property {string} label
 * @property {string | number} value
 */
/**
 * @typedef {object} Schema.Value.Group.Define
 * @property {string} label
 * @property {string | number} [value]
 * @property {(Schema.Value.Group | Schema.Value.Define)[]} children
 */
/**
 * @typedef {object} Schema.Value
 * @property {string} label
 * @property {string | number} value
 */
/**
 * @typedef {object} Schema.Value.Group
 * @property {string} label
 * @property {string | number} [value]
 * @property {(Schema.Value.Group | Schema.Value)[]} children
 */
/**
 * @typedef {object} Schema.Object
 * @property {null} [type]
 * @property {Record<string, Schema.Field>} [props]
 * @property {boolean} [array] 
 * @property {any} [meta]
 */
/**
 * @typedef {object} Schema.Type
 * @property {string} type
 * @property {null} [props]
 * @property {boolean} [array] 
 * @property {any} [meta]
 */


/**
 * @typedef {object} Schema.Event
 * 
 * @property {Function?} [input]
 * @property {Function?} [change]
 * @property {Function?} [click]
 * @property {Function?} [focus]
 * @property {Function?} [blur]
 * 
 * @property {Function?} [add]
 * @property {Function?} [remove]
 * @property {Function?} [move]
 */
/**
 * @typedef {object} Schema.Attr
 * @property {boolean} [immutable]
 * @property {boolean} [creatable]
 * @property {boolean | ((store: Store, root: Store) => boolean) | null} [hidden]
 * @property {boolean | ((store: Store, root: Store) => boolean) | null} [clearable]
 * @property {boolean | ((store: Store, root: Store) => boolean) | null} [required]
 * @property {boolean | ((store: Store, root: Store) => boolean) | null} [disabled]
 * @property {boolean | ((store: Store, root: Store) => boolean) | null} [readonly]
 * @property {string | ((store: Store, root: Store) => string) | null} [label] 字段标签
 * @property {string | ((store: Store, root: Store) => string) | null} [description] 字段描述
 * @property {string | ((store: Store, root: Store) => string) | null} [placeholder] 占位符
 * @property {number | ((store: Store, root: Store) => number) | null} [min] 日期、时间、数字的最小值
 * @property {number | ((store: Store, root: Store) => number) | null} [max] 日期、时间、数字的最大值
 * @property {number | ((store: Store, root: Store) => number) | null} [step] 日期、时间、数字的步长
 * @property {(Schema.Value.Group.Define | Schema.Value.Define)[]} [values] 可选值
 */
