export { default as parse } from './parse.mjs';


/**
 * @typedef {object} Enhancement 增强信息
 * @property {Record<string, Node.Name | Node.Event>} events 事件
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} attrs 属性
 * @property {Node.Name | Node.Calc | Node.Value} [value] 主值
 * @property {boolean | string} [bind] 绑定信息
 */

/**
 * @typedef {object} Options 解析选项
 * @property {boolean} [enableHTML] 启用 `!html` 指令
 * @property {(t: string) => Calc} [createCalc] 创建计算属性的工厂函数
 * @property {(t: string) => Calc} [createInit] 创建变量初始化的工厂函数
 * @property {(t: string) => EventListener} [createEvent] 创建事件监听器的工厂函数
 * @property {Set<string>} [simpleTag] 简单标签的集合
 */
/**
 * @template [T=any]
 * @typedef {{value: T; name?: undefined; calc?: undefined; event?: undefined}} Node.Value 基础值
 */
/**
 * @typedef {{name: string; value?: undefined; calc?: undefined; event?: undefined}} Node.Name 名称
 */
/**
 * @typedef {{event: EventListener; name?: undefined; calc?: undefined; value?: undefined}} Node.Event 事件
 */
/**
 * @typedef {{calc: Calc; name?: undefined; value?: undefined; event?: undefined}} Node.Calc 计算
 */

/**
 * 
 * @typedef {Divergent | Select | Enum | Content | CallTemplate | Fragment | Node | string} Child 分歧
 */
/**
 * 
 * @template [T=unknown]
 * @typedef {object} Variable 变量定义
 * @property {string} variable
 * @property {string} [name]
 * @property {Calc} [calc]
 * @property {T} [value]
 * @property {boolean} [init] 是否普通变量
 * @property {string} [comment] 注释
 */
/**
 * @typedef {object} Template
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} params 模板参数定义
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} DivergentChildren 分歧项
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} Divergent 分歧
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'divergent'} type
 * @property {[children: DivergentChildren, condition?: Node.Name | Node.Calc | Node.Value | null][]} children
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} Select 选值
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'value'} type
 * @property {string} name
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} Enum 枚举
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'enum'} type
 * @property {Node.Name | Node.Calc | Node.Value} value
 * @property {Node.Name | Node.Calc | Node.Value} [sort]
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} Content 内容填充
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'content'} type
 * @property {Node.Name | Node.Calc | Node.Value} value
 * @property {boolean} [html]
 * @property {string} [comment] 注释
 */
/**
 * 
 * @typedef {object} CallTemplate 模板调用
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'template'} type
 * @property {string} template 模板名
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} attrs 属性
 * @property {boolean | string} [bind] 绑定内容
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */

/**
 * @typedef {object} Fragment 片段
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {'fragment'} type
 * @property {Child[]} children 子元素
 * @property {string} [comment] 注释
 */


/**
 * @typedef {object} Node 布局节点
 * @property {Variable[]?} [vars] 局部变量/别名/计算名
 * @property {Record<string, Template>} [templates]
 * @property {null} [type]
 * 
 * @property {string} name 标签名
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} attrs 属性
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} classes 类名
 * @property {Record<string, Node.Name | Node.Calc | Node.Value>} styles 样式
 * @property {Record<string, Node.Name | Node.Event>} events 事件
 * @property {Record<string, Enhancement>} enhancements 增强
 * 
 * 
 * @property {boolean | string} [bind] 绑定内容
 * 
 * @property {string} [comment] 注释
 * 
 * @property {Child[]} children 子元素
 */


/**
 * @callback Calc 计算函数
 * @param {Record<string, any>} env 上下文环境
 * @returns {any}
 */


/**
 * @callback EventListener 事件监听器
 * @param {*} $event 事件
 * @param {Record<string, any>} env 上下文环境
 * @returns {void}
*/
