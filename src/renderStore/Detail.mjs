/** @import { Store, ArrayStore } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */
import { Signal } from 'signal-polyfill';
import Form from './Form.mjs';

const verticalWritingMode = new Set([
	'vertical-lr', 'vertical-rl', 'sideways-lr', 'sideways-rl',
]);
/**
 *
 * @param {Element} root
 * @returns {[boolean, boolean]}
 */
function getLayout(root) {
	const style = getComputedStyle(root);
	const writingMode = style.writingMode?.toLowerCase();
	const vertical = verticalWritingMode.has(writingMode);
	const reverse = style.direction.toLowerCase() === 'rtl' !== (writingMode === 'sideways-lr');
	return [vertical, reverse];
}

/**
 *
 * @template T
 * @param {(detail: StoreLayout.InspectorStore<T>, store: ArrayStore, fieldRenderer: StoreLayout.Renderer<T>, layout: StoreLayout.Field<T>, options: StoreLayout.Options?) => Element} renderer
 * @param {ArrayStore} store
 * @param {StoreLayout.Renderer<T>} fieldRenderer 
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Options?} options
 * @returns {HTMLElement?}
 */
export default function Detail(renderer, store, fieldRenderer, layout, options) {
	if (options?.signal?.aborted) { return null; }
	const root = document.createElement('div');
	const splitter = document.createElement('div');
	const inspector = document.createElement('div');
	splitter.hidden = true;
	inspector.hidden = true;

	/** @type {number?} */
	let splitterPointerId = null;
	let splitterOffset = 0;
	function stopMove() {
		const pointerId = splitterPointerId;
		if (pointerId === null) { return; }
		splitterPointerId = null;
		splitter.releasePointerCapture(pointerId);
	}

	splitter.addEventListener('pointerdown', e => {
		const { pointerId } = e;
		if (![null, pointerId].includes(splitterPointerId)) { return; }
		splitterPointerId = pointerId;
		splitter.setPointerCapture(pointerId);
		switch (getLayout(splitter).map((v, i) => v ? 2 ** i : 0).reduce((a, b) => a + b)) {
			case 0: splitterOffset = -e.offsetX; break;
			case 1: splitterOffset = -e.offsetY; break;
			case 2: splitterOffset = e.offsetX - splitter.offsetWidth; break;
			case 3: splitterOffset = e.offsetY - splitter.offsetHeight; break;
		}
	});
	/**
	 * @param {boolean} vertical
	 * @returns {number}
	 */
	const getSize = vertical => vertical
		? root.clientHeight - splitter.offsetHeight
		: root.clientWidth - splitter.offsetWidth;
	/** @param {PointerEvent} e */
	const updateMove = e => {
		const [vertical, reverse] = getLayout(splitter);
		let os = 0;
		switch ([vertical, reverse].map((v, i) => v ? 2 ** i : 0).reduce((a, b) => a + b)) {
			case 0: os = e.clientX - root.getBoundingClientRect().left; break;
			case 1: os = e.clientY - root.getBoundingClientRect().top; break;
			case 2: os = root.getBoundingClientRect().right - e.clientX; break;
			case 3: os = root.getBoundingClientRect().bottom - e.clientY; break;
		}
		const value = 1 - Math.max(0, Math.min((os + splitterOffset) / getSize(vertical), 1));
		inspector.style.inlineSize = `${value * 100}%`;
	};
	splitter.addEventListener('pointermove', e => {
		const { pointerId } = e;
		if (!splitter.hasPointerCapture(pointerId)) { return; }
		updateMove(e);
	});
	splitter.addEventListener('pointerup', e => {
		const { pointerId } = e;
		if (pointerId !== splitterPointerId) { return; }
		updateMove(e);
		stopMove();
	});
	splitter.addEventListener('pointercancel', e => {
		const { pointerId } = e;
		if (pointerId !== splitterPointerId) { return; }
		updateMove(e);
		stopMove();
	});
	/** @type {AbortController?} */
	let detailAbortController = null;
	const currentStore = new Signal.State(/** @type{Store<any, any, any>?}*/(null));

	/** @type {StoreLayout.InspectorStore<T>} */
	const inspectorStore = {
		get: () => currentStore.get(),
		is: s => s === currentStore.get(),
		close(s) {
			const old = currentStore.get();
			if (s ? s === old : old) {
				detailAbortController?.abort();
				return true;
			}
			return false;
		},
		set(store, detailLayout) {
			if (options?.signal?.aborted) { detailAbortController?.abort(); return () => { }; }
			if (currentStore.get() === store && detailAbortController) {
				const ac = detailAbortController;
				return () => { ac.abort(); };
			}
			detailAbortController?.abort();
			currentStore.set(store);
			const ac = new AbortController();
			detailAbortController = ac;
			const signal = options?.signal ? AbortSignal.any([options?.signal, ac.signal]) : ac.signal;
			const currentLayout = detailLayout || layout;
			const form = Form(store, fieldRenderer, currentLayout, {
				...options,
				editable: !currentLayout.readonly && options?.editable,
				signal: options?.signal ? AbortSignal.any([options?.signal, signal]) : signal,
			});
			signal.addEventListener('abort', () => {
				currentStore.set(null);
				stopMove();
			}, { once: true });
			if (form) {
				inspector.appendChild(form);
				inspector.hidden = false;
				splitter.hidden = false;
				signal.addEventListener('abort', () => {
					form.remove();
					splitter.hidden = true;
					inspector.hidden = true;
				}, { once: true });
			}
			return () => { ac.abort(); };

		}
	};

	const explorer = renderer(inspectorStore, store, fieldRenderer, layout, options);
	root.appendChild(explorer);
	root.appendChild(splitter);
	root.appendChild(inspector);
	root.classList.add('NeeloongForm-detail');
	explorer.classList.add('NeeloongForm-detail-explorer');
	splitter.classList.add('NeeloongForm-detail-splitter');
	inspector.classList.add('NeeloongForm-detail-inspector');

	/** @deprecated */
	explorer.classList.add('NeeloongForm-tree-main');
	root.classList.add('NeeloongForm-tree');
	splitter.classList.add('NeeloongForm-tree-splitter');
	inspector.classList.add('NeeloongForm-tree-details');

	return root;
}
