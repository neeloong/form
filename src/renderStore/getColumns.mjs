/** @import { ArrayStore } from '../Store/index.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */

/**
 *
 * @template T
 * @param {ArrayStore} store
 * @param {StoreLayout.Field<T>} layout
 * @param {StoreLayout.Action[]} actionOptions
 * @param {(fields: { field: string; width: any; label: any; editable?: boolean? }[]) => StoreLayout.Column<T>[]} createDefault
 * @returns {StoreLayout.Column<T>[]}
 */
export function getColumns(store, layout, actionOptions, createDefault) {
	const fieldList = Object.entries(store.type || {})
		.filter(([k, v]) => typeof v?.type !== 'object')
		.map(([field, { width, label }]) => ({ field, width, label }));
	const headerColumns = layout.columns;
	if (Array.isArray(headerColumns)) {
		const map = new Map(fieldList.map(v => [v.field, v]));
		/** @type {(StoreLayout.Column<T> | null)[]} */
		const allColumns = headerColumns.map(v => {
			if (!v) { return null; }
			if (typeof v === 'number') { return { placeholder: v }; }
			if (typeof v === 'string') { return map.get(v) || null; }
			if (typeof v !== 'object') { return null; }
			if (Array.isArray(v)) {
				/** @type {Set<StoreLayout.Action>} */
				const options = new Set(actionOptions);
				const actions = v.filter(v => options.delete(v));
				if (!actions) { return null; }
				return { actions };
			}
			const { action, actions, render: renderFn, field, placeholder, pattern, width, label } = v;
			const readonly = v.readonly || v.editable === false;
			const render = typeof renderFn === 'function' ? renderFn : null;
			if (field) {
				const define = map.get(field);
				if (define) {
					return { field, placeholder, width, label: label || define.label, render, readonly };
				}
			} else if (render) {
				return { placeholder, width, label: label || '', render, readonly };
			}
			const options = new Set(actionOptions);
			const allActions = [action, actions].flat().filter(v => v && options.delete(v));
			if (allActions.length) {
				return { actions: /** @type {StoreLayout.Action[]} */(allActions), width, label, readonly };
			}
			if (pattern) {
				return { pattern, placeholder, width, label, readonly };
			}
			if (placeholder || width) {
				return { placeholder, width, label, readonly };
			}
			return null;
		});
		const columns = /** @type {StoreLayout.Column<T>[]} */(allColumns.filter(Boolean));
		if (columns.length) { return columns; }
	}
	return createDefault(fieldList);
}
