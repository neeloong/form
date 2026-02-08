/** @import Store from './Store/index.mjs' */


/**
 * @typedef {object} StoreLayout.Relatedness 
 * @property {() => void} [focus] 聚焦函数
 * @property {() => void} [scrollIntoView] 展示函数
 * @property {Element} [input] 输入元素
 * @property {Element} [root] 根元素
 */

/**
 * @typedef {'add' | 'move' | 'trigger' | 'remove' | 'serial' | 'open' | 'collapse'} StoreLayout.Action
 */
/**
 * @typedef {object} StoreLayout.Grid
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 * @property {'block' | 'inline' | 'collapse' | 'fieldset' | 'base' | ''} [cell]
 */

/**
 * @template [T=unknown]
 * @typedef {object} StoreLayout.Column
 * @property {StoreLayout.Action[]} [actions] 操作
 * @property {StoreLayout.Action} [action] 操作
 * @property {string} [field] 字段
 * @property {number} [placeholder] 占位符
 * @property {string} [pattern] 模式
 * @property {number} [width] 宽度
 * @property {string} [label] 标签
 * @property {string | ParentNode | null} [html]
 * @property {StoreLayout.Item<T>[]?} [fields]
 * @property {T} [renderer]
 * 
 */
/**
 * @template [T=unknown]
 * @typedef {object} StoreLayout.Field
 * @property {'field'} [type]
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 * @property {StoreLayout.Grid['cell']} [cell]
 * @property {T} [renderer]
 * 
 * @property {string} [field]
 * @property {string | ParentNode | null} [html]
 * @property {StoreLayout.Item<T>[]?} [fields]
 * @property {'header' | 'add' | 'none'} [tableFoot]
 * @property {(string | number | StoreLayout.Action[] | StoreLayout.Column<T>)[]} [columns]
 * @property {'tree' | 'table'} [arrayStyle]
 * @property {'collapse' | 'trigger' | 'open' | 'move'} [mainMethod]
 * @property {string} [levelKey]
 * 
 */
/**
 * @typedef {object} StoreLayout.Button
 * @property {'button'} type
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 * @property {StoreLayout.Grid['cell']} [cell]
 * 
 * @property {boolean} [required]
 * @property {string} [label]
 * @property {string} [description]
 * @property {(store: Store<any, any>, options?: StoreLayout.Options | null) => boolean} [disabled]
 * @property {string | ((store: Store<any, any>, options?: StoreLayout.Options | null) => string)} [text]
 * @property {string | ((event: Event, store: Store<any, any>, options?: StoreLayout.Options | null) => void)} [click]
 */
/**
 * @typedef {object} StoreLayout.Html
 * @property {'html'} type
 * @property {number} [colStart]
 * @property {number} [colSpan]
 * @property {number} [colEnd]
 * @property {number} [rowStart]
 * @property {number} [rowSpan]
 * @property {number} [rowEnd]
 * @property {StoreLayout.Grid['cell']} [cell]
 * 
 * @property {boolean} [required]
 * @property {string} [label]
 * @property {string} [description]
 * @property {string | ParentNode | null} [html]
 */
/**
 * @template [T=unknown]
 * @typedef {StoreLayout.Field<T> | StoreLayout.Button | StoreLayout.Html} StoreLayout.Item
 */
/**
 * @template [T=unknown]
 * @typedef {object} StoreLayout
 * @property {string | ParentNode | null} [html]
 * @property {StoreLayout.Item<T>[]?} [fields]
 * @property {T} [renderer]
 */

/**
 * @typedef {object} StoreLayout.Options
 * @property {(store: Store, el: Element | StoreLayout.Relatedness) => () => void} [relate]
 * @property {boolean} [editable] 
 * @property {AbortSignal} [signal] 
 * @property {((name: string, event: Event, store: Store<any, any>, options?: StoreLayout.Options | null) => void)} [call]
 */
/**
 * @template [T=unknown]
 * @typedef {(store: Store<any, any>, renderer?: T, options?: StoreLayout.Options | null) => HTMLElement?} StoreLayout.Renderer
 */
