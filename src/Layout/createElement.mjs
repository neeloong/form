/** @import * as Layout from './index.mjs' */

/**
 * @typedef {object} OldNode 布局节点
 * @property {string} name 标签名
 * @property {string?} [is]
 * @property {string} [id]
 * @property {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} attrs 属性
 * @property {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} params 模板参数定义
 * @property {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} classes 类名
 * @property {Record<string, Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value>} styles 样式
 * @property {Record<string, Layout.Node.Name | Layout.Node.Event>} events 事件
 * @property {Layout.Variable[]} vars 局部变量/别名/计算名
 * @property {Record<string, Layout.Enhancement>} enhancements 增强
 * 
 * @property {string} [template] 模板定义的名称
 * @property {boolean | string} [fragment] 是否为片段或模板调用
 * 
 * @property {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} [if] 分歧条件
 * @property {boolean} [else] 否定
 * 
 * @property {string} [value] 值关联
 * @property {Layout.Node.Name | Layout.Node.Calc | Layout.Node.Value} [enum] 列表属性枚举
 * 
 * @property {boolean | string} [bind] 绑定内容
 * @property {Layout.Node.Name | Layout.Node.Value | Layout.Node.Calc} [text] 文本渲染
 * @property {Layout.Node.Name | Layout.Node.Value | Layout.Node.Calc} [html] HTML 渲染
 * 
 * @property {string} [comment] 注释
 * 
 * @property {(OldNode | string)[]} children 子元素
 */
/**
 * @param {string} name
 * @param {string?} [is]
 * @returns {OldNode}
 * 
 */
export default function createElement(name, is) {
	return {
		name,
		is,
		children: [],
		attrs: Object.create(null),
		events: Object.create(null),
		classes: Object.create(null),
		styles: Object.create(null),
		vars: [],
		params: Object.create(null),
		enhancements: Object.create(null),
	};
}
