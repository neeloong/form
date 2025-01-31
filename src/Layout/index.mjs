export { default as parse } from './parse.mjs';
export { default as stringify } from './stringify.mjs';


/**
 * @typedef {object} Directives
 * 
 */



/**
 * @typedef {object} Enhancement
 * @property {Record<string, Node.Name | Node.Event>} events
 * @property {Record<string, Node.Name | Node.Calc>} attrs
 * @property {Node.Name | Node.Calc} [value]
 * @property {boolean | string} [bind]
 */

/**
 * @typedef {object} Options
 * @property {(t: string) => Calc} [options.createCalc]
 * @property {(t: string) => EventListener} [options.createEvent]
 * @property {Set<string>} [options.simpleTag]
 */
/**
 * @template [T=any]
 * @typedef {{value: T; name?: null; calc?: null; event?: null}} Node.Value
 */
/**
 * @typedef {{name: string; value?: null; calc?: null; event?: null}} Node.Name
 */
/**
 * @typedef {{event: EventListener; name?: null; calc?: null; value?: null}} Node.Event
 */
/**
 * @typedef {{calc: Calc; name?: null; value?: null; event?: null}} Node.Calc
 */
/**
 * @typedef {object} Node
 * @property {string} name
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, Node.Value | Node.Name | Node.Calc>} attrs
 * @property {Record<string, Node.Name | Node.Calc>} params
 * @property {Record<string, Node.Value<boolean> | Node.Name | Node.Calc>} classes
 * @property {Record<string, Node.Name | Node.Calc>} styles
 * @property {Record<string, Node.Name | Node.Event>} events
 * @property {Record<string, Node.Value<''> | Node.Name | Node.Calc>} vars
 * @property {Record<string, Node.Name | Node.Calc>} aliases
 * @property {Record<string, Enhancement>} enhancements
 * 
 * @property {string} [template]
 * @property {boolean | string} [fragment]
 * 
 * @property {Node.Name | Node.Calc} [if]
 * @property {boolean} [else]
 * 
 * @property {string} [value] 值关联（关联为列表）
 * @property {Node.Value<true> | Node.Name | Node.Calc} [enum] 列表属性枚举
 * 
 * @property {boolean | string} [bind]
 * @property {Node.Name | Node.Calc} [text]
 * @property {Node.Name | Node.Calc} [html]
 * 
 * @property {string} [comment] 注释
 * 
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
