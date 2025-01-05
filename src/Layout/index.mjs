export { default as parse } from './parse.mjs';
export { default as stringify } from './stringify.mjs';


/**
 * @typedef {object} Directives
 * 
 * @property {string} [template]
 * 
 * @property {boolean | string} [fragment]
 * 
 * @property {string | Function} [if]
 * @property {boolean} [else]
 * 
 * @property {string} [value] 值关联（关联为列表）
 * @property {boolean | string | Function} [enum] 列表属性枚举
 * 
 * @property {string} [bind]
 * @property {string | Function} [text]
 * @property {string | Function} [html]
 * 
 * @property {string | Function} [comment] 注释
 */



/**
 * @typedef {object} Options
 * @property {(t: string) => (vars: Record<string, any>) => any} [options.creteCalc]
 * @property {(t: string) => ($event: any, vars: Record<string, any>) => any} [options.creteEvent]
 * @property {Set<string>} [options.simpleTag]
 */
/**
 * @typedef {object} Node
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, string | {name: string} | ((global: any) => void)>} attrs
 * @property {Record<string, string | ((global: any) => void)>} params
 * @property {Record<string, string | boolean | ((global: any) => void)>} classes
 * @property {Record<string, string | ((global: any) => void)>} styles
 * @property {Record<string, string | (($event: any, global: any) => void)>} events
 * @property {Record<string, string | ((global: any) => void)>} vars
 * @property {Record<string, string | Function>} aliases
 * @property {Directives} directives
 * @property {(Node | string)[]} children
 */
