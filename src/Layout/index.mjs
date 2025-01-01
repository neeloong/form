export { default as parse } from './parse.mjs';
export { default as toString } from './toString.mjs';


/**
 * @typedef {object} Directives
 * 
 * @property {boolean} [fragment]
 * 
 * @property {string | Function} [if]
 * @property {boolean} [else]
 * 
 * @property {string} [value] 值关联（关联为列表）
 * @property {boolean} [enum] 列表属性枚举
 * 
 * @property {string} [bind]
 * @property {string | Function} [text]
 * @property {string | Function} [html]
 */
/**
 * @typedef {object} Node
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {boolean} [simple]
 * @property {Record<string, string | {name: string} | ((global: any) => void)>} attrs
 * @property {Record<string, string | ((global: any) => void)>} classes
 * @property {Record<string, string | ((global: any) => void)>} styles
 * @property {Record<string, string | (($event: any, global: any) => void)>} events
 * @property {Record<string, string | ((global: any) => void)>} vars
 * @property {Record<string, string>} aliases
 * @property {Directives} directives
 * @property {(Node | string)[]} children
 */
