/**
 * 
 * @param {string | ParentNode | null} [html] 
 * @returns {ParentNode}
 */
export default function getHtmlContent(html) {
	if (!html) {
		return document.createElement('template').content;
	}
	if (typeof html !== 'string') {
		return /** @type {ParentNode} */(html.cloneNode(true));
	}
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content;
}
