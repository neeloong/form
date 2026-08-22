/** @import Store, { ArrayStore } from './Store/index.mjs' */


/**
 * @typedef {object} StoreLayout.Relatedness 
 * @property {() => void} [focus] 聚焦函数
 * @property {() => void} [scrollIntoView] 展示函数
 * @property {Element} [input] 输入元素
 * @property {Element} [root] 根元素
 */

/**
 * @typedef {'add' | 'move' | 'trigger' | 'remove' | 'serial' | 'open' | 'collapse' | 'removeTree' | 'copy' | 'copyTree'} StoreLayout.Action
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
 * @property {((store: Store, options: { signal: AbortSignal; pattern?: string }) => Node) | null} [render]
 * @property {string} [field] 字段
 * @property {number} [placeholder] 占位符
 * @property {string} [pattern] 模式
 * @property {number} [width] 宽度
 * @property {string} [label] 标签
 * @property {'start' | 'center' | 'end' | 'justify'} [align] 对齐方式
 * @property {string | ParentNode | null} [html]
 * @property {StoreLayout.Item<T>[]?} [fields]
 * @property {T} [renderer]
 * @property {boolean?} [editable]
 * @property {boolean?} [readonly]
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
 * @property {boolean} [readonly]
 * @property {StoreLayout.Grid['cell']} [cell]
 * @property {T} [renderer]
 * 
 * @property {string} [field]
 * @property {string | ParentNode | null} [html]
 * @property {StoreLayout.Item<T>[]?} [fields]
 * @property {'header' | 'add' | 'none'} [tableFoot]
 * @property {(string | number | StoreLayout.Action[] | StoreLayout.Column<T>)[]} [columns]
 * @property {'tree' | 'table' | StoreLayout.Explorer<T>} [arrayStyle]
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
 * @property {boolean} [readonly]
 * @property {StoreLayout.Grid['cell']} [cell]
 * 
 * @property {boolean} [required]
 * @property {string} [label]
 * @property {string} [description]
 * @property {(store: Store<any, any, any>, options?: StoreLayout.Options | null) => boolean} [disabled]
 * @property {string | ((store: Store<any, any, any>, options?: StoreLayout.Options | null) => string)} [text]
 * @property {string | ((event: Event, store: Store<any, any, any>, options?: StoreLayout.Options | null) => void)} [click]
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
 * @property {boolean} [readonly]
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
 * @typedef {object} StoreLayout.Operation
 * @property {AbortSignal} signal 
 * @property {StoreLayout.Action | 'footAdd' | 'headAdd'} type
 * @property {boolean} disabled 
 * @property {boolean} collapsed 
 * @property {boolean | 'until-found'} shown 
 * @property {boolean} hasChildren
 * @property {'tree' | 'table'} component
 */
/**
 * @typedef {object} StoreLayout.Options
 * @property {(store: Store, el: Element | StoreLayout.Relatedness) => () => void} [relate]
 * @property {boolean} [editable] 
 * @property {string?} [pattern] 
 * @property {AbortSignal} [signal] 
 * @property {function(string): string | ParentNode | null} [sanitizeHtml] 
 * @property {((name: string, event: Event, store: Store<any, any, any>, options?: StoreLayout.Options | null) => void)} [call]
 * @property {(el: Element, store: Store<any, any, any>, options?: StoreLayout.Options | null) => Node | null} [render]
 * @property {(btn: StoreLayout.Operation) => HTMLElement | null} [operation]
 */
/**
 * @template [T=unknown]
 * @typedef {(store: Store<any, any, any>, renderer?: T | string, options?: StoreLayout.Options | null) => Element?} StoreLayout.Renderer
 */

/**
 * @template [T=unknown]
 * @typedef {object} StoreLayout.InspectorStore
 * @property {() => Store<any, any, any>?} get
 * @property {(s: Store<any, any, any>) => boolean} is
 * @property {(s?: Store<any, any, any> | null) => boolean} close
 * @property {(s: Store<any, any, any>, layout?: StoreLayout.Field<T> | null) => () => void} set
 */

/**
 *
 * @template T
 * @callback StoreLayout.Explorer
 * @param {StoreLayout.InspectorStore<T>} inspector 
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLElement}
 */
