/** @import * as Layout from '../Layout/index.mjs' */
import Environment from './Environment.mjs';
/**
 *
 * @param {any} val
 * @returns
 */
function toText(val) {
	if ((val ?? null) === null) {
		return "";
	}
	return String(val);
}


/**
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} envs
 * @param {Layout.Directives} layout
 */
export default function renderFillDirectives(parent, next, envs, { text, html }) {
	if (text != null) {
		const node = parent.insertBefore(document.createTextNode(''), next);
		const stop = envs.watch(text, val => node.textContent = toText(val));
		return () => {
			node.remove();
			stop();
		};
	}
	if (html == null) { return; }
	const start = parent.insertBefore(document.createComment(''), next);
	const end = parent.insertBefore(document.createComment(''), next);
	const div = document.createElement('div');
	/** @param {string} html  */
	function add(html) {
		div.innerHTML = html;
		for (let node = div.firstChild; node; node = start.firstChild) {
			parent.insertBefore(node, end);
		}
	}
	function remove() {
		for (let node = start.nextSibling; node && node !== end; node = start.nextSibling) {
			node.remove();
		}
	}
	const result = envs.watch(html, val => {
		remove();
		add(toText(val));
	});
	return () => {
		result();
		remove();
		start.remove();
		end.remove();
	};
}
