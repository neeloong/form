import type { Store } from '../Store/index.mjs';
import type * as StoreLayout from './types.mts';
import Form from './Form.mjs';
import getHtmlContent from './getHtmlContent.mjs';
import renderHtml from './renderHtml.mjs';

export type * from './types.mts';

export default function renderStore<T>(
	store: Store, 
	fieldRenderer: StoreLayout.Renderer<T>, 
	root: HTMLElement, 
	layout: StoreLayout.Layout<T>, 
	options?: (StoreLayout.Options & { clone?: boolean; }) | null,
): void {
	if (options?.signal?.aborted) { return; }
	const storeLayout = layout || store.layout  ||{};
	const html = storeLayout.html;
	if (!html) {
		Form(store, fieldRenderer, storeLayout, options || null, root);
		return;
	}
	const content = getHtmlContent(html, options?.sanitizeHtml);
	renderHtml(store, fieldRenderer, content, options || null, storeLayout);
	root.appendChild(content);
	options?.signal?.addEventListener('abort', () => {
		root.removeChild(content);
	}, { once: true });
}
