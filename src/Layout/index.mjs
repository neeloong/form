export { default as parse } from './parse.mjs';
export { default as stringify } from './stringify.mjs';


/**
 * @typedef {object} Directives
 * 
 * @property {string} [template]
 * 
 * @property {boolean | string} [fragment]
 * 
 * @property {string | Calc} [if]
 * @property {boolean} [else]
 * 
 * @property {string} [value] 值关联（关联为列表）
 * @property {boolean | string | Calc} [enum] 列表属性枚举
 * 
 * @property {boolean | string} [bind]
 * @property {string | Calc} [text]
 * @property {string | Calc} [html]
 * 
 * @property {string} [comment] 注释
 */



/**
 * @typedef {object} Enhancement
 * @property {Record<string, string | EventListener>} events
 * @property {Record<string, string | Calc>} attrs
 * @property {string | Calc | null} value
 * @property {boolean | string | null} bind
 */

/**
 * @typedef {object} Options
 * @property {(t: string) => Calc} [options.createCalc]
 * @property {(t: string) => EventListener} [options.createEvent]
 * @property {Set<string>} [options.simpleTag]
 */
/**
 * @typedef {object} Node
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, string | {name: string} | Calc>} attrs
 * @property {Record<string, string | Calc>} params
 * @property {Record<string, string | boolean | Calc>} classes
 * @property {Record<string, string | Calc>} styles
 * @property {Record<string, string | EventListener>} events
 * @property {Record<string, string | Calc>} vars
 * @property {Record<string, string | Calc>} aliases
 * @property {Directives} directives
 * @property {Record<string, Enhancement>} enhancements
 * @property {(Node | string)[]} children
 */

/**
 * @callback Calc
 * @param {Record<string, any>} env
 * @returns {any}
*/


/**
 * @callback EventListener
 * @param {*} $event
 * @param {Record<string, any>} env
 * @returns {void}
*/
