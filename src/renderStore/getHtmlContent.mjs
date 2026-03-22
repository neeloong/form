/**
 * 
 * @param {string | ParentNode | null} [html] 
 * @param {function(string): string} [sanitize] 
 * @returns {ParentNode}
 */
export default function getHtmlContent(html, sanitize) {
	if (!html) {
		return document.createElement('template').content;
	}
	if (typeof html !== 'string') {
		return /** @type {ParentNode} */(html.cloneNode(true));
	}
	const template = document.createElement('template');
	template.innerHTML = sanitize ? sanitize(html) : html;
	return template.content;
}
