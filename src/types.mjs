/**
 * @typedef {object} Directives
 * 
 * @property {string | Function} [if]
 * @property {*} [else]
 * 
 * @property {string} [name] 
 * @property {string} [value] 值关联（关联为列表）
 * @property {*} [item] 列表循环的项目名
 * @property {string} [index]
 * @property {string | Function} [for]
 * @property {string} [key]
 * 
 * 
 * @property {*} fragment
 * @property {string | Function} [template]
 * @property {string | Function} [text]
 * @property {string | Function} [html]
 */

/**
 * @typedef {object} Layout
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, string | Symbol | ((...any: any) => void)>} attrs
 * @property {Record<string, string | ((...any: any) => void)>} classes
 * @property {Record<string, string | ((...any: any) => void)>} styles
 * @property {Record<string, (...any: any) => void>} events
 * @property {Directives} directives
 * @property {(Layout | string)[]} [children]
 */
