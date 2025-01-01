

/**
 * @typedef {any} VerifyError
 */
/**
 * @typedef {object} Component.Attr
 * @property {string} type
 * @property {boolean} [isAttr]
 * @property {boolean} [isProp]
 * // TODO: 可否计算，可否关联
 * @property {[event: string, set: ($event: any, global: any) => any]} [bind]
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
 * @property {Set<string>?} [attrs]
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
 * @typedef {(Schema.Object | Schema.Type) & Schema.Event & Schema.Attr} Schema.Field
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
 * @property {Record<string, Schema.Field>} props
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
 * @property {any} change
 * @property {any} input
 * @property {any} click
 * @property {any} focus
 * @property {any} blur
 * @property {Function?} [input]
 * @property {Function?} [change]
 * @property {Function?} [beforeCreate]
 * @property {Function?} [beforeUpdate]
 * @property {Function?} [beforeSave]
 * @property {Function?} [beforeDestroy]
 * @property {Function?} [beforeUpsert]
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
 * @typedef {boolean} [immutable]
 * @typedef {boolean} [creatable]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [hidden]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [clearable]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [required]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [disabled]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [readonly]
 * @property {any} [default] 默认值
 * @property {(Schema.Value.Group | Schema.Value | string | number)[]} values 可选值
 * @property {string} [label] 字段标签
 * @property {string} [description] 字段描述
 * @property {number} [min] 日期、时间、数字的最小值
 * @property {number} [max] 日期、时间、数字的最大值
 * @property {number} [step] 日期、时间、数字的步长
 * @property {number} [decimalDigits]
 * @property {RegExp} [regex] 字符串验证正则
 * @property {Filter[] | ((row: any, rowState: any, data: any, state: any) => Filter[])} [queryOptions]
 * @property {object | ((row: any, rowState: any, data: any, state: any) => object)} [findOptions]
 * 
 * @property {(data: any, state: any) => boolean} [addable] 对于数组，是否支持增加
 * @property {(data: any, state: any) => boolean} [deletable] 对于数组，是否支持删除
 * // TODO: 数组最小数量
 * // TODO: 数组最大数量
 * // TODO: 最小值、最大值、步长增加函数支持
 * 
 * 
 * @property {boolean} [nullable] 是否可为空
 * 
 * 
 * @property {Record<string, string>} [fieldMap]
 * @property {Record<string, any>} [fieldValues]
 * @property {string} [noField]
 * 
 * @property {string[]} [models]
 * @property {string} [model]
 * 
 * @property {string} [field]
 * @property {string[]} [fields]
 * 
 * @property {(number | bigint)[]} [workspaces]
 * 
 * @property {(number | bigint)[]} [roles]
 * @property {(number | bigint)[]} [users]
 * @property {(number | bigint)[]} [userGroups]
 * 
 * @property {(number | bigint)[]} [workgroups]
 * @property {(number | bigint)[]} [workgroupAncestors]
 * @property {(number | string)[]} [workgroupAncestorFields]
 * @property {(number | bigint)[]} [workgroupDescendants]
 * @property {(number | string)[]} [workgroupDescendantFields]
 * 
 * @property {string} [optionConstraintScript]
 * 
 * 
 * @property {string} [label]
 * @property {string} [description]
 * @property {string} [options]
 * 
 * @property {boolean} [translatable]
 * 
 * @property {boolean} [ignorePermissions]
 */
