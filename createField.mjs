import { getField } from './field.mjs';

/**
 * @param {[field: string, ...fields: (string | number)[]]} fields
 * @param {import('./types.mjs').FormLike?} [from]
 */

function getFields(fields, from) {
	while (from) {
		/** @type {import('./types.mjs').FormLike?} */
		const parent = from.parent;
		if (!parent) { break; }
		fields.unshift(from.field || '', from.no || 0);
		from = parent;
	}
	return fields
}
/**
 *
 * @param {import('../services/model.mjs').FieldScriptConfiguration} field
 * @param {import('./types.mjs').FormLike?} from
 * @param {boolean} defaultValue
 * @param {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean | void)?} [fn]
 */

function createBoolFn(field, from, defaultValue, fn) {
	if (typeof fn !== 'function' || !from) { return () => defaultValue; }
	const rootFrom = from.root;
	return () => {
		const fields = getFields([field.name], from);
		const val = fn(rootFrom.data, rootFrom, ...fields);
		return typeof val === 'boolean' ? val : defaultValue;
	};
}
/**
 *
 * @param {import('../services/model.mjs').FieldScriptConfiguration} field
 * @param {object} [options]
 * @param {import('./types.mjs').FormLike?} [options.from]
 * @returns {import('./types.mjs').FieldHandle}
 */
export default function createField(field, { from = null } = {}) {
	let mounted = false;
	let destroyed = false;
	const name = field.name;
	/** @type {Map<string, Set<any>>} */
	const events = new Map();
	/** @type {Map<string, Set<any>>} */
	const handlerEvents = new Map();
	/** @type {any} */
	let data;
	/** @type {any} */
	let value;
	const comp = from?.fieldComponents?.[field.name];
	const component = typeof comp === 'function' ? comp : getField(field);

	/**
	 * @template {keyof import('./types.mjs').FieldComponentEvent} K
	 * @param {K} k 
	 * @param  {Parameters<import('./types.mjs').FieldComponentEvent[K]>} p 
	 */
	function emit(k, ...p) {
		for (const fn of [...events.get(k) || []]) {
			fn(...p);
		}
	}
	/**
	 * @template {keyof import('./types.mjs').FieldHandleEvent} K
	 * @param {K} k 
	 * @param  {Parameters<import('./types.mjs').FieldHandleEvent[K]>} p 
	 */
	function emitHandler(k, ...p) {
		for (const fn of [...handlerEvents.get(k) || []]) {
			fn(...p);
		}
	}
	const script = field.script || {};
	const readonlyByFrom = from && !from.new ? Boolean(field.immutable) : false;
	const readonlyFn = createBoolFn(field, from, Boolean(field.readonly), script.readonly);
	// TODO: 作用域数据
	let readonlyByScript = readonlyByFrom || readonlyFn();
	let readonlyByStyle = false;
	let disabledBySet = false;
	let writeableByPermission = true;
	let commonReadonly = false;
	const getReadonly = readonlyByFrom ? () => true : () => readonlyByScript || readonlyByStyle || disabledBySet || commonReadonly || !writeableByPermission;
	let readonly = getReadonly();
	function setReadonly() {
		const newReadonly = getReadonly();
		if (newReadonly === readonly) { return; }
		readonly = newReadonly;
		emit('readonly', readonly);
	}

	const requiredFn = createBoolFn(field, from, Boolean(field.required), script.required);
	// TODO: 作用域数据
	let requiredByScript = requiredFn();
	let requiredBySet = false;
	const getRequired = () => requiredByScript || requiredBySet;
	let required = getRequired();
	function setRequired() {
		const newRequired = getRequired();
		if (newRequired === required) { return; }
		required = newRequired;
		emit('required', required);
	}

	const hiddenFn = createBoolFn(field, from, Boolean(field.hidden), script.hidden);
	// TODO: 作用域数据
	let hiddenByScript = hiddenFn();
	let hiddenBySet = false;
	const getHidden = () => hiddenByScript || hiddenBySet;
	let selfHidden = getHidden();
	let parentHidden = false;
	let hidden = selfHidden || parentHidden;
	function setHidden() {
		const newHidden = selfHidden || parentHidden;
		if (newHidden === hidden) { return; }
		hidden = newHidden;
		emit('hidden', hidden);
	}
	function setSelfHidden() {
		const newHidden = getHidden();
		if (newHidden === selfHidden) { return; }
		selfHidden = newHidden;
		root.hidden = selfHidden;
		setHidden();
	}
	// TODO: hidden/readonly 脚本结果执行
	// TODO: 选项、过滤条件

	function updateState() {
		// TODO: 刷新显示、只读、选项、过滤条件
		readonlyByScript = readonlyByFrom || readonlyFn();
		requiredByScript = requiredFn();
		hiddenByScript = hiddenFn();
		setReadonly();
		setRequired();
		setSelfHidden();
	}
	const root = component({
		from, field,
		get required() { return required; },
		get hidden() { return hidden; },
		get readonly() { return readonly; },
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
		onChange() { emitHandler('change', ...getFields([field.name], from)); },
		onFocus() { emitHandler('click', ...getFields([field.name], from)); },
		onClick() { emitHandler('focus', ...getFields([field.name], from)); },
		onBlur() { emitHandler('blur', ...getFields([field.name], from)); },
		get value() { return value; },
		set value(v) {
			if (!mounted || destroyed) { return; }
			const oldValue = value;
			value = v;
			emitHandler('update', value, name);
			if (!from) { return; }
			data = from.update(name, v);
			emitHandler('input', value, oldValue, ...getFields([field.name], from));
		},
		get data() { return value; },
		updatable: Boolean(from),
		update(key, value) {
			if (!mounted || destroyed || !from) { return; }
			data = from.update(key, value);
			emitHandler('update', value, key);
		},
	});

	/** @type {import('./types.mjs').FieldHandle} */
	const fieldHandle = {
		root,
		field,
		name: field.name,
		get value() { return value; },
		reset(d) {
			if (destroyed) { return; }
			mounted = true;
			data = d;
			value = data[name];
			updateState();
			emit('reset', value, data);
		},
		destroy() {
			if (destroyed) { return; }
			destroyed = true;
			emit('destroy');
		},
		update(d) {
			if (!mounted || destroyed) { return; }
			if (data === d) { return; }
			data = d;
			updateState();
			const modified = value !== data[name];
			value = data[name];
			emit('update', value, data, modified);
		},
		get required() { return requiredBySet; },
		set required(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (requiredBySet === v) { return; }
			requiredBySet = v;
			setRequired();
		},
		get hidden() { return hiddenBySet; },
		set hidden(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (hiddenBySet === v) { return; }
			hiddenBySet = v;
			setSelfHidden();
		},
		get parentHidden() { return parentHidden; },
		set parentHidden(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (parentHidden === v) { return; }
			parentHidden = v;
			setHidden();
		},
		get disabled() { return disabledBySet; },
		set disabled(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (disabledBySet === v) { return; }
			disabledBySet = v;
			setReadonly();
		},
		get commonReadonly() { return commonReadonly; },
		set commonReadonly(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (commonReadonly === v) { return; }
			commonReadonly = v;
			setReadonly();
		},
		get shown() { return !hidden; },
		get readonly() { return readonly; },

		get writeable() { return writeableByPermission; },
		set writeable(value) {
			if (!mounted || destroyed) { return; }
			const v = Boolean(value);
			if (writeableByPermission === v) { return; }
			writeableByPermission = v;
			setReadonly();
		},
		emit(name, ...args) {
			if (!mounted || destroyed) { return; }
			for (const fn of [...events.get(name) || []]) {
				fn(...args);
			}
		},
		refresh() {
			if (!mounted || destroyed) { return; }
			const modified = value === data[name];
			updateState();
			value = data[name];
			emit('refresh', value, data, modified);
		},
		listen(event, listen) {
			const fn = listen.bind(this);
			let set = handlerEvents.get(event);
			if (!set) {
				set = new Set();
				handlerEvents.set(event, set);
			}
			set.add(fn);
			return () => { set?.delete(fn); };
		},
	};

	let rootFrom = from?.root;
	if (rootFrom) {
		const { change, click, focus, blur, input } = script;
		if (typeof change === 'function') { fieldHandle.listen('change', (...fields) => change(rootFrom.data, rootFrom, ...fields)); }
		if (typeof click === 'function') { fieldHandle.listen('click', (...fields) => click(rootFrom.data, rootFrom, ...fields)); }
		if (typeof focus === 'function') { fieldHandle.listen('focus', (...fields) => focus(rootFrom.data, rootFrom, ...fields)); }
		if (typeof blur === 'function') { fieldHandle.listen('blur', (...fields) => blur(rootFrom.data, rootFrom, ...fields)); }
		if (typeof input === 'function') { fieldHandle.listen('input',  (value, oldValue, ...fields) => input(value, oldValue, rootFrom.data, rootFrom, ...fields)); }
	}
	return fieldHandle;
}
