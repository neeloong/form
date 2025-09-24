/** @import { Store } from './Store/index.mjs' */
import { ArrayStore } from './Store/index.mjs';
import watch from './watch.mjs';


/**
 * 
 * @param {(store: Store<any, any>, component: any) => [HTMLElement, () => void]?} renderField 
 * @param {Store} store 
 * @param {Node} node 
 * @param {Node} [anchor]
 * @param {(child?: Store<any, any> | undefined) => void} [dragenter]
 */
function render(renderField, store, node, anchor, dragenter) {
	if (node instanceof Element) {
		const tagName = node.tagName.toLowerCase();
		if (!node.parentNode) { return () => {}; }
		if (tagName === 'nl-form-field') {
			const name = node.getAttribute('name') || '';
			const fieldStore = name ? store.child(name) : store;
			if (!fieldStore) { return () => {}}
			const component = fieldStore.component;
			if (typeof component === 'function') {
				const res = renderField(fieldStore, component);
				if (res) {
					const [el, destroy] = res;
					node.replaceWith(el);
					return destroy;
				}
			}
			const value = node.getAttribute('placeholder') || '';
			node.replaceWith(document.createTextNode(value))
			return () => {};
		}
		const name = node.getAttribute('nl-form-field');
		if (name) {
			const array = name.endsWith('[]');
			const field = array ? name.slice(0, name.length - 2) : name;
			const fieldStore = field ? store.child(field) : store;
			if (!fieldStore) {
				return () => {}
			}
			node.removeAttribute('nl-form-field');
			if (!array) { return render(renderField, fieldStore, node, anchor, dragenter); }
			if (!(fieldStore instanceof ArrayStore)) {
				node.remove();
				return () => {};
			}
			const parentElement = node.parentElement;
			if (!parentElement) {
				node.remove();
				return () => {};
			}
			const comment = parentElement.insertBefore(document.createComment(''), node) || null;
			node.remove();

			/** @type {Map<Store, [Node, () => void]>} */
			let seMap = new Map();
			/** @param {Map<Store, [tbody: Node, destroy: () => void]>} map */
			function destroyMap(map) {
				for (const [el, destroy] of map.values()) {
					destroy();
					if (el instanceof Element) {
						el.remove();
					}
				}
			}
			let dragRow = -1;
			/**
			 * 
			 * @param {Store} [child] 
			 */
			const newDragenter = (child) =>{
				if (dragRow < 0) { return; }
				const index = child ? Number(child.index) : fieldStore.children.length;
				if (index < 0 || dragRow < 0 || dragRow === index) { return; }
				if (fieldStore.move(dragRow, index)) {
					dragRow = index;
				}
			}

			const childrenResult = watch(() => fieldStore.children, children => {
				let nextNode = comment.nextSibling;
				const oldSeMap = seMap;
				seMap = new Map();
				for (const child of children) {
					const old = oldSeMap.get(child);
					if (!old) {
						const el = parentElement.insertBefore(node.cloneNode(true), nextNode);
						const d = render(renderField, child, el, el, newDragenter);
						el.addEventListener('dragenter', () => { newDragenter(child); })
						el.addEventListener('dragstart', (event) => {
							if (event.target !== event.currentTarget) { return; }
							dragRow = Number(child.index);
						})
						el.addEventListener('dragend', () => { dragRow = -1; });
						seMap.set(child, [el, d]);
						continue;
					}
					oldSeMap.delete(child);
					seMap.set(child, old);
					if (nextNode === old[0]) {
						nextNode = nextNode.nextSibling;
						continue;
					}
					parentElement.insertBefore(old[0], nextNode);
				}
				destroyMap(oldSeMap);
			}, true);

			return () => {
				comment.remove();
				destroyMap(seMap);
				childrenResult();
			}

		}
		if (node.getAttribute('nl-form-remove') !== null) {
			const parent = store.parent;
			if (parent instanceof ArrayStore) {
				node.addEventListener('click', () => {
					parent.remove(Number(store.index));
				});
			}
		}
		if(node.getAttribute('nl-form-move') !== null && anchor instanceof HTMLElement) {
			// @ts-ignore
			node.addEventListener('pointerdown', ({pointerId}) => {
				anchor.draggable = true;
				/** @param {PointerEvent} event */
				const pointerup = (event) => {
					if (event.pointerId !== pointerId) { return }
					anchor.draggable = false;
					window.removeEventListener('pointerup', pointerup, {capture: true});
					window.removeEventListener('pointercancel', pointerup, {capture: true});
				}
				window.addEventListener('pointerup', pointerup, {capture: true});
				window.addEventListener('pointercancel', pointerup, {capture: true});
			});
		}
		const addField = node.getAttribute('nl-form-add');
		if (addField) {
			const fieldStore = store.child(addField);
			if (fieldStore instanceof ArrayStore) {
				node.addEventListener('click', () => { fieldStore.add({}); });
			}
		}
	}
	if (!(node instanceof Element || node instanceof DocumentFragment)) { return () => {}; }
	/** @type {(() => void)[]} */
	const destroyList = [];
	for (const n of [...node.children]) {
		destroyList.push(render(renderField, store, n, anchor, dragenter));
	}
	return () => {
		for (const destroy of destroyList) {
			destroy();
		}
	}

}
/**
 * 
 * @param {string | ParentNode} [html] 
 * @param {boolean} [clone] 
 */
function getContent(html, clone) {
	if (!html) {
		return document.createElement('template').content;
	}
	if (typeof html === 'string') {
	const template = document.createElement('template')
	template.innerHTML = html;
	return template.content;
	}
	return clone ? html : /** @type {ParentNode} */(html.cloneNode(true));
}
/**
 * 
 * @param {(store: Store<any, any>, component: any) => [HTMLElement, () => void]?} renderField 
 * @param {Store} store 
 * @param {HTMLElement} root 
 * @param {string | ParentNode} [html] 
 * @param {boolean} [clone] 
 */
export default function renderHtml(renderField, store, root, html, clone) {
	const content = getContent(html, clone);
	const destroy = render(renderField, store, content);
	root.appendChild(content);
	return destroy;
}
