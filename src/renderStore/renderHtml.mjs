/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../types.mjs' */
import Form from './Form.mjs';
import { ArrayStore } from '../Store/index.mjs';
import watch from '../watch.mjs';
import effect from '../effect.mjs';


/**
 * 
 * @param {string} field 
 */
function createFieldFilter(field) {

	/**
	 * 
	 * @param {StoreLayout.Item} v 
	 * @returns {v is StoreLayout.Field}
	 */

	return function (v) {
		if (v.type && v.type !== 'field') { return false; }
		return v.field === field;

	};
}
/**
 * 
 * @param {StoreLayout.Renderer} fieldRenderer 
 * @param {Store} store 
 * @param {Node} node 
 * @param {StoreLayout.Options?} options
 * @param {StoreLayout?} [layout] 
 * @param {Node} [anchor]
 * @param {(child?: Store<any, any> | undefined) => void} [dragenter]
 */
export default function renderHtml(store, fieldRenderer, node, options, layout, anchor, dragenter) {
	/** @type {(() => void)[]} */
	const destroyList = [];
	if (node instanceof Element) {
		const tagName = node.tagName.toLowerCase();
		if (!node.parentNode) { return () => { }; }
		if (tagName === 'nl-form-field') {
			const field = node.getAttribute('name') || '';
			const mode = node.getAttribute('mode') || '';
			const fieldStore = field ? store.child(field) : store;
			const fieldLayout = field ? layout?.fields?.find(createFieldFilter(field)) || null : null;
			if (!fieldStore) { return () => { }; }
			switch (mode) {
				case 'grid': {
					const [el, destroy] = Form(store, fieldRenderer, fieldLayout, options);
					node.replaceWith(el);
					return destroy;
				}
			}
			const component = fieldStore.component;
			if (component) {
				const res = fieldRenderer(fieldStore, component, options);
				if (res) {
					const [el, destroy] = res;
					node.replaceWith(el);
					return destroy;
				}
			}
			const value = node.getAttribute('placeholder') || '';
			node.replaceWith(document.createTextNode(value));
			return () => { };
		}
		if (tagName === 'nl-form-button') {
			const button = document.createElement('button');
			button.className = 'NeeloongForm-item-button';
			const click = node.getAttribute('click') || '';
			const call = options?.call;
			if (click && typeof call === 'function') {
				button.addEventListener('click', e => call(click, e, store, options));
			}
			for (const n of [...node.childNodes]) {
				button.appendChild(n);
			}
			node.replaceWith(button);
			return () => { };
		}
		const name = node.getAttribute('nl-form-field');
		if (name) {
			const array = name.endsWith('[]');
			const field = array ? name.slice(0, name.length - 2) : name;

			const fieldStore = field ? store.child(field) : store;
			if (!fieldStore) {
				return () => { };
			}
			node.removeAttribute('nl-form-field');
			const fieldLayout = field ? layout?.fields?.find(createFieldFilter(field)) : layout;
			if (!array) { return renderHtml(fieldStore, fieldRenderer, node, options, fieldLayout, anchor, dragenter); }
			if (!(fieldStore instanceof ArrayStore)) {
				node.remove();
				return () => { };
			}
			const parentElement = node.parentElement;
			if (!parentElement) {
				node.remove();
				return () => { };
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
			const newDragenter = (child) => {
				if (dragRow < 0) { return; }
				const index = child ? Number(child.index) : fieldStore.children.length;
				if (index < 0 || dragRow < 0 || dragRow === index) { return; }
				if (fieldStore.move(dragRow, index)) {
					dragRow = index;
				}
			};

			const childrenResult = watch(() => fieldStore.children, children => {
				let nextNode = comment.nextSibling;
				const oldSeMap = seMap;
				seMap = new Map();
				for (const child of children) {
					const old = oldSeMap.get(child);
					if (!old) {
						const el = parentElement.insertBefore(node.cloneNode(true), nextNode);
						const d = renderHtml(child, fieldRenderer, el, options, fieldLayout, el, newDragenter);
						el.addEventListener('dragenter', () => { newDragenter(child); });
						el.addEventListener('dragstart', (event) => {
							if (event.target !== event.currentTarget) { return; }
							dragRow = Number(child.index);
						});
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
			};

		}
		if (node.getAttribute('nl-form-remove') !== null) {
			const parent = store.parent;
			if (parent instanceof ArrayStore) {
				node.addEventListener('click', () => {
					parent.remove(Number(store.index));
				});
			}
		}
		if (node.getAttribute('nl-form-move') !== null && anchor instanceof HTMLElement) {
			// @ts-ignore
			node.addEventListener('pointerdown', ({ pointerId }) => {
				anchor.draggable = true;
				/** @param {PointerEvent} event */
				const pointerup = (event) => {
					if (event.pointerId !== pointerId) { return; }
					anchor.draggable = false;
					window.removeEventListener('pointerup', pointerup, { capture: true });
					window.removeEventListener('pointercancel', pointerup, { capture: true });
				};
				window.addEventListener('pointerup', pointerup, { capture: true });
				window.addEventListener('pointercancel', pointerup, { capture: true });
			});
		}
		const addField = node.getAttribute('nl-form-add');
		if (addField) {
			const fieldStore = store.child(addField);
			if (fieldStore instanceof ArrayStore) {
				node.addEventListener('click', () => { fieldStore.add({}); });
			}
		}
		const call = options?.call;
		for (const attr of [...node.getAttributeNames()]) {
			const index = attr.indexOf(':');
			if (index < 0) { continue; }
			const prefix = attr.slice(0, index).toLowerCase();
			const name = attr.slice(index + 1);
			if (prefix === 'nl-form-field') {
				const field = node.getAttribute(attr);
				const fieldStore = field ? store.child(field) : store;
				if (!fieldStore) { continue; }
				destroyList.push(effect(() => {
					try {
						node.setAttribute(name, fieldStore.value);
					} catch { }
				}));
			} else if (prefix === 'nl-form-event' && typeof call === 'function') {
				const event = node.getAttribute(attr);
				if (!event) { continue; }
				try {
					node.addEventListener(name, e => call(event, e, store, options));
				} catch { }
			}
		}
	}
	if (node instanceof Element || node instanceof DocumentFragment) {
		for (const n of [...node.children]) {
			destroyList.push(renderHtml(store, fieldRenderer, n, options, layout, anchor, dragenter));
		}
	}
	return () => {
		for (const destroy of destroyList) {
			destroy();
		}
	};

}
