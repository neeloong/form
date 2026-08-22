/**
 * 
 * @param {string | ParentNode | null} [html] 
 * @param {function(string): string | ParentNode | null} [sanitize] 
 * @returns {ParentNode}
 */
export default function getHtmlContent(html, sanitize) {
	if (html && typeof html === 'string' && typeof sanitize === 'function') {
		html = sanitize(html);
	}
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
