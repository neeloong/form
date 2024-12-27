/**
 * @typedef {object} Directives
 * @property {string | true} [item] 列表循环的项目名
 * @property {string} [name] 
 * @property {string} [key] 
 * @property {string} [no]
 * @property {string} [value] 值关联（关联为列表）
 */

/**
 * @typedef {object} Layout
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, string | {value: string}>} attrs
 * @property {Record<string, any>} events
 * @property {Directives} directives
 * @property {(Layout | string)[]} [children]
 */
/**
 * @typedef {object} Component
 * @property {string | (() => Element)} tagName
 * @property {string} [is]
 * @property {Record<string, Attr>} attrs
 * @property {Record<string, Component>} [children]
 */
