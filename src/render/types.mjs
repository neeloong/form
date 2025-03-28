/** @import * as Layout from '../Layout/index.mjs' */

/**
 * @typedef {object} ComponentHandler
 * @property {(name: string, value: any) => void} set
 * @property {(event: string, listener: Layout.EventListener) => void} addEvent
 * @property {() => void} destroy
 * @property {any} tag
 * @property {() => void} mount
 */
