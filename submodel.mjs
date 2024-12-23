import Form from './Form.mjs';
import subModelTable from './subModelTable.mjs';

/**
 * @param {import('../services/model.mjs').FieldScriptConfiguration} field
 * @param {import('./types.mjs').FormLike?} from
 * @param {((...v: any[]) => any) | undefined | null} fn
 * @returns {(...v: any[]) => any}
 */

function createUpdateFn(field, from, fn) {
	if (typeof fn !== 'function' || !from) { return () => { }; }
	let rootFrom = from.root;
	return (...v) => {
		/** @type {[field: string, ...fields: (string | number)[]]} */
		const fields = [field.name];
		/** @type {import('./types.mjs').FormLike?} */
		let currentFrom = from;
		while (currentFrom) {
			/** @type {import('./types.mjs').FormLike?} */
			const parent = currentFrom.parent;
			if (!parent) { break; }
			fields.unshift(currentFrom.field || '', currentFrom.no || 0);
			currentFrom = parent;
		}
		return fn(...v, rootFrom.data, rootFrom.define, rootFrom, ...fields);
	};
}

/**
* @param {string} [t] 
* @return {boolean}
*/
function isDataType(t) {
	if (!t) { return false; }
	const f = t[0];
	if (f === '#') { return false; }
	if (f === '.') { return false; }
	if ('id' === t.split('.')[0]) { return false; }
	return true;
}
/** @type {import('./types.mjs').FieldComponent} */
const component = (ctx) => {
	const field = ctx.field;
	const subFields = field.subFields || [];
	const noField = field.noField;
	const hiddenField = new Set(Object.keys({ ...field.fieldMap, ...field.fieldValues }));
	hiddenField.add(noField || '');
	const fieldsShow = subFields.filter(v => !(v.primary && v.hidden) && isDataType(v.type) && !hiddenField.has(v.name));

	const fieldComponent = ctx.from?.fieldComponents?.[field.name];
	const fieldComponents = typeof fieldComponent === 'object' && fieldComponent || {};


	const root = document.createElement('div');
	/** @type {Map<string, Set<any>>} */
	const events = new Map();
	/**
	 * @template {keyof import('./types.mjs').SubmodelsLayoutEvent} K
	 * @param {K} k 
	 * @param  {Parameters<import('./types.mjs').SubmodelsLayoutEvent[K]>} p 
	 */
	function emit(k, ...p) {
		for (const fn of [...events.get(k) || []]) {
			fn(...p);
		}
	}
	const script = field.script || {}
	const addFn = createUpdateFn(field, ctx.from, script.add);
	const removeFn = createUpdateFn(field, ctx.from, script.remove);
	const moveFn = createUpdateFn(field, ctx.from, script.move);
	/** @type {Form[]} */
	let forms = [];
	/** @type {import('./types.mjs').SubmodelsLayoutContext<Form>} */
	const smlCtx = {
		fields: fieldsShow,
		get hidden() { return ctx.hidden; },
		get readonly() { return ctx.readonly; },
		listen(event, listen) {
			const fn = listen.bind(this);
			let set = events.get(event);
			if (!set) {
				set = new Set();
				events.set(event, set);
			}
			set.add(fn);
			return () => { set?.delete(fn); };
		},
		setHidden(form, main, added) {
			form.parentHidden = main;
			for (const field of form.addedField) {
				field.parentHidden = added;
			}

		},
		add() {
			const values = [ctx.value].flat().filter(v => v && typeof v === 'object');
			values.push(Object.defineProperty(addFn() || {}, '!new', { value: true, configurable: true }));
			return ctx.value = values;
		},
		create(root, hidden) {
			const form = new Form({
				root, parent: ctx.from, field: field.name, no: forms.length + 1,
				fieldComponents, hidden: Boolean(hidden || ctx.hidden),
				define: { fields: subFields },
			});
			form.readonly = ctx.readonly;
			forms.push(form);
			return form;
		},
		destroy(form) {
			const index = forms.indexOf(form);
			if (index < 0) { return; }
			forms.splice(index, 1);
			form.destroy();
		},
		remove(form) {
			const formsRemoved = new Set(form);
			const removed = [];
			let index = 0;
			while (index < forms.length) {
				const form = forms[index];
				if (formsRemoved.has(form)) {
					forms.splice(index, 1);
					removed.push(form.data);
					form.destroy();
					continue;
				}
				index++;
				form.no = index;
			}
			const value = forms.map(v => v.data);
			if (removed) { removeFn(removed); }
			ctx.value = value;
			return value;
		},
		move(form, to) {
			const list = [...form];
			const formsRemoved = new Set(form);
			const next = forms.slice(to);
			let index = 0;
			while (index < forms.length) {
				const form = forms[index];
				if (formsRemoved.has(form)) {
					forms.splice(index, 1);
					continue;
				}
				index++;
			}
			let nextIndex = form.length;
			for (const form of next) {
				const index = forms.indexOf(form);
				if (index < 0) { continue }
				nextIndex = index;
				break;
			}
			forms.splice(nextIndex, 0, ...list);
			for (let index = 0; index < forms.length; index++) {
				forms[index].no = index + 1;
			}
			const value = forms.map(v => v.data);
			ctx.value = value;
			moveFn(list, to);
			return value
		},
		init(form, value, isNew) { form.initData(value, isNew); },
		update(form, value, isNew) { form.updateData(value, isNew); },
	}
	const el = subModelTable(smlCtx);
	root.appendChild(el);
	ctx.listen('move', () => {
		for (const form of [...forms]) {
			form.move();
		}
	});
	ctx.listen('verify', (e) => {
		const list = [...forms].map((form) => form.verify().then(errors => {
			for (const r of errors) {
				e.error(r);
			}
		}));
		e.waitUntil(Promise.allSettled(list).then(() => { }));
	});
	ctx.listen('hidden', v => emit('hidden', v));
	ctx.listen('readonly', (readonly) => {
		emit('readonly', readonly);
		for (const form of [...forms]) {
			form.readonly = readonly;
		}
	});
	ctx.listen('refresh', () => {
		for (const form of [...forms]) {
			// TODO:
			form.refresh();
		}
	});
	ctx.listen('reset', v => emit('reset', v));
	ctx.listen('update', (v, d, modified) => modified && emit('update', v));
	ctx.listen('destroy', () => {
		emit('destroy');
		const list = [...forms];
		forms.length = 0;
		for (const form of list) {
			form.destroy();
		}
	});
	return root;
};
export default component;
