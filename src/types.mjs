/** @import Store from './Store/index.mjs' */

/**
 * @typedef {any} VerifyError
 */
/**
 * @typedef {object} Component.Attr
 * @property {string} type
 * @property {boolean} [isProp]
 * // TODO: 可否计算，可否关联
 * @property {[event: string, set: ($event: any, global: any) => any, boolean?] | 'hidden' | 'clearable' | 'readonly' | 'disabled' | 'required'} [bind]
 * @property {*} [default]
 * @property {boolean} [immutable]
 * 
 */
/**
 * @typedef {object} Component.Handler
 * @property {(name: string, value: any) => void} set
 * @property {(event: string, listener: ($event: any, global: any) => any) => void} addEvent
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
 * @property {Record<string, (($event: any, param: string[], env: any) => boolean | null | void) | string>} filters 过滤器
 * 
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
 * @typedef {object} Schema.Value
 * @property {string} label
 * @property {string | number} value
 */
/**
 * @typedef {object} Schema.Value.Group
 * @property {string} label
 * @property {string | number} [value]
 * @property {(Schema.Value.Group | Schema.Value | string | number)[]} children
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
 * @typedef {object} Schema.Attr
 * @property {boolean} [immutable]
 * @property {boolean} [creatable]
 * @property {boolean | ((store: Store) => boolean)?} [hidden]
 * @property {boolean | ((store: Store) => boolean)?} [clearable]
 * @property {boolean | ((store: Store) => boolean)?} [required]
 * @property {boolean | ((store: Store) => boolean)?} [disabled]
 * @property {boolean | ((store: Store) => boolean)?} [readonly]
 */
