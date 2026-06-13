/** @import { Store } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import Form from './Form.mjs';
import { ArrayStore } from '../Store/index.mjs';
import watch from '../watch.mjs';
import effect from '../effect.mjs';

/**
 * 
 * @template T
 * @param {string} field 
 * @returns {(v: StoreLayout.Item<T>) => v is StoreLayout.Field<T>}
 */
function createFieldFilter(field) {
	/**
	 * 
	 * @param {StoreLayout.Item<T>} v 
	 * @returns {v is StoreLayout.Field<T>}
	 */
	return v => {
		if (v.type && v.type !== 'field') { return false; }
		return v.field === field;

	};
}
/**
 * @template T
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {Store} store 
 * @param {Node} node 
 * @param {StoreLayout.Options?} options
 * @param {StoreLayout<T>} layout 
 * @param {Node} [anchor]
 * @param {(child?: Store<any, any, any> | undefined) => void} [dragenter]
 * @returns {void}
 */
export default function renderHtml(store, fieldRenderer, node, options, layout, anchor, dragenter) {
	if (options?.signal?.aborted) { return; }
	if (node instanceof Element) {
		const tagName = node.tagName.toLowerCase();
		if (!node.parentNode) { return; }
		if (tagName === 'nl-form-field') {
			const field = node.getAttribute('name') || '';
			const mode = node.getAttribute('mode') || '';
			const renderer = node.getAttribute('renderer') || '';
			const editable = options?.editable && !node.hasAttribute('non-editable');
			const fieldStore = field ? store.child(field) : store;
			if (!fieldStore) { return; }
			/** @type {Element?} */
			let el = null;
			switch (mode) {
				case 'grid': {
					const fieldLayout = field
						? layout?.fields?.find(createFieldFilter(field)) || fieldStore.layout
						: { ...layout, html: '' };
					el = Form(fieldStore, fieldRenderer, fieldLayout, { ...options, editable });
					break;
				}
				default: {
					el = fieldRenderer(fieldStore, renderer || layout.renderer, { ...options, editable });
					break;
				}
			}
			if (!el) {
				const value = node.getAttribute('placeholder') || '';
				node.replaceWith(document.createTextNode(value));
				return;
			}
			const className = node.getAttribute('class') || '';
			if (className) {
				el.setAttribute('class', [
					el.getAttribute('class') || '',
					className,
				].filter(Boolean).join(' '));
			}
			const style = node.getAttribute('style') || '';
			if (style) {
				el.setAttribute('style', [
					el.getAttribute('style') || '',
					style,
				].filter(Boolean).join(' '));
			}
			node.replaceWith(el);
			return;
		}
		if (tagName === 'nl-form-button') {
			const button = document.createElement('button');
			const className = node.getAttribute('class') || '';
			const style = node.getAttribute('style') || '';
			if (className) { button.setAttribute('class', className); }
			if (style) { button.setAttribute('style', style); }
			button.classList.add('NeeloongForm-item-button');
			const click = node.getAttribute('click') || '';
			const call = options?.call;
			if (click && typeof call === 'function') {
				button.addEventListener('click', e => call(click, e, store, options));
			}
			for (const n of [...node.childNodes]) {
				button.appendChild(n);
			}
			node.replaceWith(button);
			return;
		}
		if (tagName === 'nl-form-component') {
			const render = options?.render;
			const newNode = typeof render === 'function' && render(node, store, options);
			if (newNode) {
				node.replaceWith(newNode);
			} else {
				node.remove();
			}
			return;
		}
		const name = node.getAttribute('nl-form-field');
		if (name) {
			const array = name.endsWith('[]');
			const field = array ? name.slice(0, name.length - 2) : name;

			const fieldStore = field ? store.child(field) : store;
			if (!fieldStore) {
				return;
			}
			node.removeAttribute('nl-form-field');
			const fieldLayout = field
				? layout.fields?.find(createFieldFilter(field)) || fieldStore.layout
				: { ...layout, html: '' };
			if (!array) {
				renderHtml(fieldStore, fieldRenderer, node, options, fieldLayout, anchor, dragenter);
				return;
			}
			if (!(fieldStore instanceof ArrayStore)) {
				node.remove();
				return;
			}
			const parentElement = node.parentElement;
			if (!parentElement) {
				node.remove();
				return;
			}
			const comment = parentElement.insertBefore(document.createComment(''), node) || null;
			node.remove();

			/** @type {Map<Store, [Node, AbortController]>} */
			let seMap = new Map();
			/** @param {Map<Store, [Node, AbortController]>} map */
			function destroyMap(map) {
				for (const [el, ac] of map.values()) {
					if (el instanceof Element) {
						el.remove();
					}
					ac.abort();
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

			watch(() => fieldStore.children, children => {
				let nextNode = comment.nextSibling;
				const oldSeMap = seMap;
				seMap = new Map();
				for (const child of children) {
					const old = oldSeMap.get(child);
					if (!old) {
						const ac = new AbortController();
						const el = parentElement.insertBefore(node.cloneNode(true), nextNode);
						renderHtml(child, fieldRenderer, el, {
							...options,
							signal: options?.signal ? AbortSignal.any([options?.signal, ac.signal]) : ac.signal,
						}, fieldLayout, el, newDragenter);
						el.addEventListener('dragenter', () => { newDragenter(child); });
						el.addEventListener('dragstart', (event) => {
							if (event.target !== event.currentTarget) { return; }
							dragRow = Number(child.index);
						});
						el.addEventListener('dragend', () => { dragRow = -1; });
						seMap.set(child, [el, ac]);
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
			}, true, options?.signal);

			options?.signal?.addEventListener('abort', () => {
				comment.remove();
				destroyMap(seMap);
			}, { once: true });
			return;

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
				effect(() => {
					try {
						node.setAttribute(name, fieldStore.value);
					} catch { }
				}, options?.signal);
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
			renderHtml(store, fieldRenderer, n, options, layout, anchor, dragenter);
		}
	}
}
