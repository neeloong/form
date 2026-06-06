import { Signal } from 'signal-polyfill';
import createBooleanStates from './createBooleanStates.mjs';
import * as toValues from './toValues.mjs';
import createState from './createState.mjs';
import createRef from './ref.mjs';
import create, { setStore } from './create.mjs';
import createValidator from './createValidator.mjs';
import makeDefault from './makeDefault.mjs';
/** @import { Ref } from './ref.mjs' */
/** @import { Schema } from '../Schema.types.mjs' */
/** @import { StoreLayout } from '../StoreLayout.types.mjs' */

/**
 * 管理单个表单字段的状态和行为
 * @template [T=any]
 * @template [M=any]
 * @template {Object.<string, Schema.State>} [S=Object.<string, Schema.State>]
 */
export default class Store {
	/** @type {Store<T, M, S>?} */
	#originStore = null;

	/** @type {Schema.Field<M, S>}  字段的 Schema 定义 */
	#schema;
	get schema() { return this.#schema; }
	/** @type {Map<string, Set<(value: any, store: any) => void | boolean | null>>} */
	#events = new Map();
	/**
	 * 触发事件并通知监听器
	 * @template {keyof Schema.Events} K
	 * @param {K} event 
	 * @param  {Schema.Events[K]} value 
	 * @returns {boolean}
	 */
	emit(event, value) {
		const originStore = this.#originStore;
		if (originStore) { return originStore.emit(event, value); }
		const key = typeof event === 'number' ? String(event) : event;
		const events = this.#events;
		let canceled = false;
		for (const d of [...events.get(key) || []]) {
			canceled = d(value, this) === false || canceled;
		}
		return !canceled;
	}
	/**
	 * 监听事件
	 * @template {keyof Schema.Events} K
	 * @overload
	 * @param {K} event 
	 * @param  {(this: this, p: Schema.Events[K], store: this) => void | boolean | null} listener
	 * @returns {() => void}
	 */
	/**
	 * 监听事件
	 * @template {keyof Schema.Events} K
	 * @overload
	 * @param {string} event 
	 * @param  {(this: this, p: unknown, store: this) => void | boolean | null} listener
	 * @returns {() => void}
	 */
	/**
	 * 监听事件
	 * @param {string} event 
	 * @param  {(this: this, p: unknown, store: this) => void | boolean | null} listener
	 * @returns {() => void}
	 */
	listen(event, listener) {
		const originStore = this.#originStore;
		if (originStore) { return originStore.listen(event, p => listener.call(this, p, this)); }
		const fn = listener.bind(this);
		const events = this.#events;
		const key = typeof event === 'number' ? String(event) : event;
		let set = events.get(key);
		if (!set) {
			set = new Set();
			events.set(key, set);
		}
		set.add(fn);
		return () => { set?.delete(fn); };

	}
	/**
	 * 从数据结构模式创建存储
	 * @template [M=any]
	 * @template {Object.<string, Schema.State>} [S=Object.<string, Schema.State>]
	 * @param {Schema<M, S>} schema 数据结构模式
	 * @param {object} [options] 选项
	 * @param {boolean} [options.new] 是否为新建环境
	 */
	static create(schema, options = {}) {
		return create({ type: schema }, { ...options, parent: null });
	}
	/**
	 * 设置自定义类型的存储类
	 * @param {string} type
	 * @param {{new(...p: ConstructorParameters<typeof Store>): Store}} Class
	 */
	static setStore(type, Class) {
		return setStore(type, Class);
	}
	#null = false;
	/** 是否为无效空存储 */
	get null() { return this.#null; }
	/** 存储类类别，继承的自定义类需要设置自定义的此只读属性 */
	get kind() { return ''; }
	/** @type {Ref?} */
	#ref = null;
	get ref() { return this.#ref || createRef(this); }
	/**
	 * @param {Schema.Field<M, S> | Store<T,M,S>} schema 字段的 Schema 定义
	 * @param {StoreOptions | AbortSignal | null} [options] 可选配置
	 */
	constructor(schema, options) {
		if (schema instanceof Store) {
			const store = schema.#originStore || schema;
			this.#originStore = store;
			this.#schema = store.#schema;
			this.#null = store.#null;
			this.#ref = store.#ref;
			this.#states = store.#states;
			this.#layout = store.#layout;
			this.#createDefault = store.#createDefault;
			this.#setValue = store.#setValue;
			this.#convert = store.#convert;
			this.#onUpdate = store.#onUpdate;
			this.#parent = store.#parent;
			this.#root = store.#root;
			this.#type = store.#type;
			this.#meta = store.#meta;
			this.#component = store.#component;
			this.#selfLoading = store.#selfLoading;
			this.#loading = store.#loading;
			this.#size = store.#size;
			this.#index = store.#index;
			this.#creatable = store.#creatable;
			this.#immutable = store.#immutable;
			this.#new = store.#new;
			this.#selfNew = store.#selfNew;
			this.#selfHidden = store.#selfHidden;
			this.#hidden = store.#hidden;
			this.#selfClearable = store.#selfClearable;
			this.#clearable = store.#clearable;
			this.#selfRequired = store.#selfRequired;
			this.#required = store.#required;
			this.#selfDisabled = store.#selfDisabled;
			this.#disabled = store.#disabled;
			this.#selfReadonly = store.#selfReadonly;
			this.#readonly = store.#readonly;
			this.#selfRemovable = store.#selfRemovable;
			this.#removable = store.#removable;
			this.#selfLabel = store.#selfLabel;
			this.#label = store.#label;
			this.#selfDescription = store.#selfDescription;
			this.#description = store.#description;
			this.#selfPlaceholder = store.#selfPlaceholder;
			this.#placeholder = store.#placeholder;
			this.#selfMin = store.#selfMin;
			this.#min = store.#min;
			this.#selfMax = store.#selfMax;
			this.#max = store.#max;
			this.#selfStep = store.#selfStep;
			this.#step = store.#step;
			this.#selfMinLength = store.#selfMinLength;
			this.#minLength = store.#minLength;
			this.#selfMaxLength = store.#selfMaxLength;
			this.#maxLength = store.#maxLength;
			this.#selfPattern = store.#selfPattern;
			this.#pattern = store.#pattern;
			this.#selfValues = store.#selfValues;
			this.#values = store.#values;
			this.#errors = store.#errors;
			this.#execValidators = store.#execValidators;
			this.#cancelEventValidator = store.#cancelEventValidator;
			this.#set = store.#set;
			this.#initValue = store.#initValue;
			this.#value = store.#value;
			const signal = options instanceof AbortSignal ? options : null;
			if (signal?.aborted) { return; }
			const subBindStores = store.#subBindStores;
			subBindStores.add(this);
			signal?.addEventListener('abort', () => subBindStores.delete(this));
			store.#requestUpdate();
			return;
		}
		const {
			null: isNull, ref, default: defaultValue,
			setValue, convert, onUpdate, states, validator,
			index, size, new: isNew, parent: parentNode,
			hidden, clearable, required, disabled, readonly, removable,
			label, description, placeholder, min, max, step, minLength, maxLength, pattern, values
		} = !(options instanceof AbortSignal) && options || {};
		this.#schema = schema;
		const parent = parentNode instanceof Store ? parentNode : null;
		if (parent) {
			this.#parent = parent;
			this.#root = parent.#root;
			this.#loading = parent.#loading;
			// TODO: 事件向上冒泡
		}
		this.#createDefault = makeDefault(this, defaultValue ?? schema.default);
		const loading = new Signal.State(false);
		this.#selfLoading = loading;
		this.#loading = loading;
		this.#type = schema.type;
		this.#meta = schema.meta;
		this.#component = schema.component;
		this.#layout = schema.layout || {};

		const selfNewState = new Signal.State(Boolean(isNew));
		this.#selfNew = selfNewState;
		/** @type {Signal.Computed<boolean>} */
		const newState = parent
			? new Signal.Computed(() => parent.#new.get() || selfNewState.get())
			: new Signal.Computed(() => selfNewState.get());

		this.#new = newState;
		const immutable = Boolean(schema.immutable);
		const creatable = schema.creatable !== false;
		this.#immutable = immutable;
		this.#creatable = creatable;

		const readonlyFn = schema.readonly;
		const selfReadonly = new Signal.State(typeof readonly === 'boolean' ? readonly : null);
		/** @type {Signal.Computed<boolean>} */
		let readonlyScript;
		if (typeof readonlyFn === 'function') {
			readonlyScript = new Signal.Computed(() => Boolean(readonlyFn(this)));
		} else {
			const def = Boolean(readonlyFn);
			readonlyScript = new Signal.Computed(() => def);
		}
		const getReadonly = () => {
			if (newState.get() ? !creatable : immutable) { return true; }
			const s = selfReadonly.get();
			return s === null ? readonlyScript.get() : s;
		};
		const readonlyParent = parent ? parent.#readonly : null;
		this.#selfReadonly = selfReadonly;
		this.#readonly = readonlyParent
			? new Signal.Computed(() => readonlyParent.get() || getReadonly())
			: new Signal.Computed(getReadonly);

		[this.#selfHidden, this.#hidden] = createBooleanStates(this, hidden, schema.hidden, parent ? parent.#hidden : null);
		[this.#selfClearable, this.#clearable] = createBooleanStates(this, clearable, schema.clearable, parent ? parent.#clearable : null);
		[this.#selfRequired, this.#required] = createBooleanStates(this, required, schema.required, parent ? parent.#required : null);
		[this.#selfDisabled, this.#disabled] = createBooleanStates(this, disabled, schema.disabled, parent ? parent.#disabled : null);

		[this.#selfLabel, this.#label] = createState(this, toValues.string, label, schema.label);
		[this.#selfDescription, this.#description] = createState(this, toValues.string, description, schema.description);
		[this.#selfPlaceholder, this.#placeholder] = createState(this, toValues.string, placeholder, schema.placeholder);
		[this.#selfMin, this.#min] = createState(this, toValues.number, min, schema.min);
		[this.#selfMax, this.#max] = createState(this, toValues.number, max, schema.max);
		[this.#selfStep, this.#step] = createState(this, toValues.number, step, schema.step);
		[this.#selfMinLength, this.#minLength] = createState(this, toValues.number, minLength, schema.minLength);
		[this.#selfMaxLength, this.#maxLength] = createState(this, toValues.number, maxLength, schema.maxLength);
		[this.#selfPattern, this.#pattern] = createState(this, toValues.regex, pattern, schema.pattern);
		// @ts-ignore
		[this.#selfValues, this.#values] = createState(this, toValues.values, values, schema.values);

		[this.#selfRemovable, this.#removable] = createBooleanStates(this, removable, schema.removable ?? true);

		const schemaStates = schema.states;
		this.#states = schemaStates ? Object.defineProperties(Object.create(null),
			Object.fromEntries(
				Object.entries(schemaStates).map(([k, { get, set, toState }]) => {
					const state = new Signal.State(toState?.(states?.[k]));
					const computed = new Signal.Computed(() => get(this, state));
					return [k, {
						configurable: true,
						enumerable: true,
						get() { return computed.get(); },
						set(v) { return set?.(this, state, v); },
					}];
				})
			)) : null;

		const [execValidators, eventExecMap, errors, cancelEventValidator] = createValidator(this, schema.validator, validator);
		for (const [name, exec] of Object.entries(eventExecMap)) {
			this.listen(name, exec);
		}
		this.#errors = errors;
		this.#execValidators = execValidators;
		this.#cancelEventValidator = cancelEventValidator;

		if (size instanceof Signal.State || size instanceof Signal.Computed) {
			this.#size = size;
		} else {
			this.#size = new Signal.State(size || 0);
		}

		if (isNull) {
			this.#null = true;
			this.#ref = createRef(this);
			return;
		}
		this.#ref = ref || null;
		this.#onUpdate = onUpdate || null;
		this.#setValue = typeof setValue === 'function' ? setValue : null;
		this.#convert = typeof convert === 'function' ? convert : null;
		this.#index.set(index ?? '');

		for (const [k, f] of Object.entries(schema.events || {})) {
			if (typeof f !== 'function') { continue; }
			// @ts-ignore
			this.listen(k, f);
		}
	}
	/** @type {S?} */
	#states;
	get states() { return this.#states; }
	/** @type {StoreLayout.Field<any>} */
	#layout;
	get layout() { return this.#layout; }
	/** @type {(value?: any) => unknown} */
	#createDefault;
	/** @param {any} [value] @returns {any} */
	createDefault(value) { return this.#createDefault(value); }
	/** @type {((value: any) => any)?} */
	#setValue = null;
	/** @type {((value: any) => any)?} */
	#convert = null;
	/** @type {((value: any, index: any, store: Store) => void)?} */
	#onUpdate = null;
	/** @readonly @type {Store?} */
	#parent = null;
	/** @readonly @type {Store} */
	#root = this;
	/** @readonly @type {any} */
	#type;
	/** @readonly @type {M | void} */
	#meta;
	/** @readonly @type {any} */
	#component;
	/** @type {Signal.State<boolean>?} */
	#selfLoading = null;
	/** @type {Signal.State<boolean>} */
	#loading;
	get loading() {
		return this.#loading.get();
	}
	set loading(loading) {
		const s = this.#selfLoading;
		if (!s) { return; }
		s.set(Boolean(loading));
	}
	/** 存储对象自身 */
	get store() { return this; }
	/** 父级存储对象 */
	get parent() { return this.#parent; }
	/** 根节点的存储对象 */
	get root() { return this.#root; }
	/** 字段类型 */
	get type() { return this.#type; }
	/** 字段元信息 */
	get meta() { return this.#meta; }
	/** 自定义渲染组件信息 */
	get component() { return this.#component; }

	/** @type {Signal.State<number> | Signal.Computed<number>} */
	#size;
	/** 长度信息 */
	get size() { return this.#size.get(); }
	#index = new Signal.State(/** @type {string | number} */(''));
	/** 索引信息 */
	get index() { return this.#index.get(); }
	set index(v) { this.#index.set(v); }
	/** 数组项目的序号 */
	get no() {
		if (this.#null) { return ''; }
		const index = this.index;
		return typeof index === 'number' ? index + 1 : index;
	}

	#creatable = true;
	/** 值是否可创建（`$new` 为 `true` 时，字段只读） */
	get creatable() { return this.#creatable; }
	#immutable = false;
	/** 值是否不可改变（`$new` 为 `false` 时，字段只读） */
	get immutable() { return this.#immutable; }

	/** @readonly @type {Signal.Computed<boolean>} */
	#new;
	/** @readonly @type {Signal.State<boolean>} */
	#selfNew;
	get selfNew() { return this.#selfNew.get(); }
	set selfNew(v) { this.#selfNew.set(Boolean(v)); }
	/** 是否新建项 */
	get new() { return this.#new.get(); }
	set new(v) { this.#selfNew.set(Boolean(v)); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfHidden;
	/** @readonly @type {Signal.Computed<boolean>} */
	#hidden;
	get selfHidden() { return this.#selfHidden.get(); }
	set selfHidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }
	/** 是否可隐藏 */
	get hidden() { return this.#hidden.get(); }
	set hidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfClearable;
	/** @readonly @type {Signal.Computed<boolean>} */
	#clearable;
	get selfClearable() { return this.#selfClearable.get(); }
	set selfClearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }
	/** 是否可清除 */
	get clearable() { return this.#clearable.get(); }
	set clearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfRequired;
	/** @readonly @type {Signal.Computed<boolean>} */
	#required;
	get selfRequired() { return this.#selfRequired.get(); }
	set selfRequired(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }
	/** 是否必填 */
	get required() { return this.#required.get(); }
	set required(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfDisabled;
	/** @readonly @type {Signal.Computed<boolean>} */
	#disabled;
	get selfDisabled() { return this.#selfDisabled.get(); }
	set selfDisabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }
	/** 是否禁用字段 */
	get disabled() { return this.#disabled.get(); }
	set disabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfReadonly;
	/** @readonly @type {Signal.Computed<boolean>} */
	#readonly;
	get selfReadonly() { return this.#selfReadonly.get(); }
	set selfReadonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }
	/** 是否只读 */
	get readonly() { return this.#readonly.get(); }
	set readonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }


	/** @readonly @type {Signal.State<boolean?>} */
	#selfRemovable;
	/** @readonly @type {Signal.Computed<boolean>} */
	#removable;
	get selfRemovable() { return this.#selfRemovable.get(); }
	set selfRemovable(v) { this.#selfRemovable.set(typeof v === 'boolean' ? v : null); }
	/** 是否只读 */
	get removable() { return this.#removable.get(); }
	set removable(v) { this.#selfRemovable.set(typeof v === 'boolean' ? v : null); }


	/** @readonly @type {Signal.State<string?>} */
	#selfLabel;
	/** @readonly @type {Signal.Computed<string?>} */
	#label;
	get selfLabel() { return this.#selfLabel.get(); }
	set selfLabel(v) { this.#selfLabel.set(toValues.string(v)); }
	/** 字段的标签信息 */
	get label() { return this.#label.get(); }
	set label(v) { this.#selfLabel.set(toValues.string(v)); }


	/** @readonly @type {Signal.State<string?>} */
	#selfDescription;
	/** @readonly @type {Signal.Computed<string?>} */
	#description;
	get selfDescription() { return this.#selfDescription.get(); }
	set selfDescription(v) { this.#selfDescription.set(toValues.string(v)); }
	/** 字段的描述信息 */
	get description() { return this.#description.get(); }
	set description(v) { this.#selfDescription.set(toValues.string(v)); }

	/** @readonly @type {Signal.State<string?>} */
	#selfPlaceholder;
	/** @readonly @type {Signal.Computed<string?>} */
	#placeholder;
	get selfPlaceholder() { return this.#selfPlaceholder.get(); }
	set selfPlaceholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }
	/** 字段的占位符信息 */
	get placeholder() { return this.#placeholder.get(); }
	set placeholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfMin;
	/** @readonly @type {Signal.Computed<number?>} */
	#min;
	/** @deprecated */
	get selfMin() { return this.#selfMin.get(); }
	set selfMin(v) { this.#selfMin.set(toValues.number(v)); }
	/** @deprecated 数值字段的最小值限制 */
	get min() { return this.#min.get(); }
	set min(v) { this.#selfMin.set(toValues.number(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfMax;
	/** @readonly @type {Signal.Computed<number?>} */
	#max;
	/** @deprecated */
	get selfMax() { return this.#selfMax.get(); }
	set selfMax(v) { this.#selfMax.set(toValues.number(v)); }
	/** @deprecated 数值字段的最大值限制 */
	get max() { return this.#max.get(); }
	set max(v) { this.#selfMax.set(toValues.number(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfStep;
	/** @readonly @type {Signal.Computed<number?>} */
	#step;
	/** @deprecated */
	get selfStep() { return this.#selfStep.get(); }
	set selfStep(v) { this.#selfStep.set(toValues.number(v)); }
	/** @deprecated 数值字段的步长 */
	get step() { return this.#step.get(); }
	set step(v) { this.#selfStep.set(toValues.number(v)); }

	/** @readonly @type {Signal.State<number?>} */
	#selfMinLength;
	/** @readonly @type {Signal.Computed<number?>} */
	#minLength;
	/** @deprecated */
	get selfMinLength() { return this.#selfMinLength.get(); }
	set selfMinLength(v) { this.#selfMinLength.set(toValues.number(v)); }
	/** @deprecated 最小长度 */
	get minLength() { return this.#minLength.get(); }
	set minLength(v) { this.#selfMinLength.set(toValues.number(v)); }

	/** @readonly @type {Signal.State<number?>} */
	#selfMaxLength;
	/** @readonly @type {Signal.Computed<number?>} */
	#maxLength;
	/** @deprecated */
	get selfMaxLength() { return this.#selfMaxLength.get(); }
	set selfMaxLength(v) { this.#selfMaxLength.set(toValues.number(v)); }
	/** @deprecated 最大长度 */
	get maxLength() { return this.#maxLength.get(); }
	set maxLength(v) { this.#selfMaxLength.set(toValues.number(v)); }

	/** @readonly @type {Signal.State<RegExp?>} */
	#selfPattern;
	/** @readonly @type {Signal.Computed<RegExp?>} */
	#pattern;
	/** @deprecated */
	get selfPattern() { return this.#selfPattern.get(); }
	set selfPattern(v) { this.#selfPattern.set(toValues.regex(v)); }
	/** @deprecated 模式 */
	get pattern() { return this.#pattern.get(); }
	set pattern(v) { this.#selfPattern.set(toValues.regex(v)); }


	/** @readonly @type {Signal.State<(Schema.Value.Group | Schema.Value)[] | null>} */
	#selfValues;
	/** @readonly @type {Signal.Computed<(Schema.Value.Group | Schema.Value)[] | null>} */
	#values;
	/** @deprecated */
	get selfValues() { return this.#selfValues.get(); }
	set selfValues(v) { this.#selfValues.set(toValues.values(v)); }
	/** @deprecated 可选值列表 */
	get values() { return this.#values.get(); }
	set values(v) { this.#selfValues.set(toValues.values(v)); }


	/** @type {Signal.Computed<string[]>} */
	#errors;
	/** @type {() => Promise<string[]>} */
	#execValidators;
	/** @type {() => void} */
	#cancelEventValidator;
	/** 所有校验错误列表 */
	get errors() { return this.#errors.get(); }
	/** 字段校验错误信息 */
	get error() { return this.#errors.get()[0]; }

	/** @returns {IterableIterator<[key: string | number, value: Store]>} */
	*[Symbol.iterator]() { }
	/**
	 * 获取子存储
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return null; }

	#set = false;
	#initValue = new Signal.State(/** @type {T?} */(null));
	#value = new Signal.State(this.#initValue.get());

	/** @type {Set<Store>} */
	#subBindStores = new Set();

	/** 内容是否已改变 */
	get changed() { return !Object.is(this.#value.get(), this.#initValue.get()); }

	/** 字段当前值 */
	get value() { return this.#value.get(); }
	set value(v) {
		const originStore = this.#originStore;
		if (originStore) { originStore.value = v; return; }
		const newValue = this.#setValue?.(v);
		const val = newValue === undefined ? v : newValue;
		this.#value.set(val);
		if (!this.#set) {
			this.#initValue.set(val);
		}
		this.#onUpdate?.(val, this.#index.get(), this);
		this.#requestUpdate();
	}

	#requestUpdate() {
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		queueMicrotask(() => {
			const oldValue = this.#value.get();
			this.#runUpdate(oldValue);
		});
	}
	/** 重置数据 */
	reset(value = this.#set ? this.#initValue.get() : this.#createDefault(), isNew = this.#selfNew.get()) {
		const originStore = this.#originStore;
		if (originStore) { originStore.reset(value, isNew); return; }
		this.#reset(value, Boolean(isNew));
	}
	/**
	 * 
	 * @param {*} v 
	 * @param {boolean} isNew 
	 * @returns 
	 */
	#reset(v, isNew) {
		this.#selfNew.set(isNew);
		const newValue = this.#setValue?.(v);
		const value = newValue === undefined ? v : newValue;
		this.#cancelEventValidator();
		this.#set = true;
		if (!value || typeof value !== 'object') {
			for (const bind of [this, ...this.#subBindStores]) {
				for (const [, field] of bind) {
					field.#reset(null, false);
				}
			}
			this.#value.set(value);
			this.#initValue.set(value);
			this.#onUpdate?.(value, this.#index.get(), this);
			return value;
		}
		/** @type {*} */
		const newValues = Array.isArray(value) ? [...value] : { ...value };
		for (const bind of [this, ...this.#subBindStores]) {
			for (const [key, field] of bind) {
				newValues[key] = field.#reset(Object.hasOwn(newValues, key) ? newValues[key] : undefined, false);
			}
		}
		this.#value.set(newValues);
		this.#initValue.set(newValues);
		this.#onUpdate?.(newValues, this.#index.get(), this);
		return newValues;
	}


	#needUpdate = false;
	/**
	 * 
	 * @param {T} value 
	 * @returns 
	 */
	#toUpdate(value) {
		let val = this.#convert?.(value) ?? value;
		if (val === undefined) { val = value; }
		if (Object.is(this.#value.get(), val)) { return val; }
		return this.#runUpdate(val);
	}
	/**
	 * 
	 * @param {*} val 
	 * @returns {[any, any]}
	 */
	#runUpdate(val) {
		this.#needUpdate = false;
		let initValue = val;
		if (val && typeof val === 'object') {
			/** @type {T} */
			// @ts-ignore
			let newValues = Array.isArray(val) ? [...val] : { ...val };
			let updated = false;
			for (const bind of [this, ...this.#subBindStores]) {
				for (const [key, field] of bind) {
					// @ts-ignore
					const data = Object.hasOwn(val, key) ? val[key] : undefined;
					const newData = field.#toUpdate(data);
					if (Object.is(data, newData)) { continue; }
					// @ts-ignore
					newValues[key] = newData;
					updated = true;
				}
			}
			if (updated) {
				val = newValues;
				initValue = val;
				this.#value.set(val);
			}
		}
		if (!this.#set) {
			this.#set = true;
			this.#initValue.set(initValue);
		}
		this.#value.set(val);
		return val;
	}
	/**
	 * 异步校验
	 * @overload
	 * @param {true} [self]
	 * @returns {Promise<string[] | null>}
	 */
	/**
	 * 异步校验
	 * @overload
	 * @param {(string | number)[] | false | null} [path] 到当前层级的路径
	 * @returns {Promise<{ path: (string | number)[]; store: Store; errors: string[]}[]>}
	 */
	/**
	 * 异步校验
	 * @param {(string | number)[] | boolean | null} [path] 
	 * @returns {Promise<string[] | { path: (string | number)[]; store: Store; errors: string[];}[] | null>}
	 */
	validate(path) {
		if (path === true) {
			if (this.#originStore) { return Promise.resolve(null); }
			return this.#execValidators().then(errors => errors.length ? errors : null);
		}
		const selfPath = Array.isArray(path) ? path : [];
		if (!this.#originStore && this.#hidden.get()) { return Promise.resolve([]); }
		const list = [this.validate(true).then(errors => {
			if (!errors?.length) { return []; }
			return [{ path: [...selfPath], store: /** @type {Store} */(this), errors }];
		})];
		for (const [key, field] of this) {
			list.push(field.validate([...selfPath, key]));
		}
		for (const sub of this.#subBindStores) {
			list.push(sub.validate(selfPath));
		}
		return Promise.all(list).then(v => v.flat());
	}
}

/**
 * @template [T=any]
 * @template [M=any]
 * @template {Object.<string, Schema.State>} [S=Object.<string, Schema.State>]
 * @typedef {object} StoreOptions
 * @property {Store?} [parent] 
 * @property {Partial<S>?} [states] 
 * @property {((store: Store, value?: any) => any) | object | number | string | boolean | null | undefined} [default]
 * @property {number | string | null} [index] 
 * @property {number | Signal.State<number> | Signal.Computed<number>} [size] 
 * @property {boolean} [null] 
 * @property {boolean} [new] 
 * @property {boolean} [hidden] 
 * @property {boolean} [clearable] 
 * @property {boolean} [required] 
 * @property {boolean} [disabled] 
 * @property {boolean} [readonly] 
 * @property {boolean} [removable] 
 * 
 * @property {string} [label] 字段标签
 * @property {string} [description] 字段描述
 * @property {string} [placeholder] 占位符
 * @property {number} [min] 日期、时间、数字的最小值
 * @property {number} [max] 日期、时间、数字的最大值
 * @property {number} [step] 日期、时间、数字的步长
 * @property {number} [minLength] 
 * @property {number} [maxLength] 
 * @property {RegExp} [pattern] 
 * @property {(Schema.Value.Group | Schema.Value | string | number)[]} [values] 可选值
 * @property {Schema.Validator | Schema.Validator[] | null} [validator]
 * 
 * @property {Ref?} [ref]
 * 
 * @property {((value: any) => any)?} [setValue] 
 * @property {((value: any) => any)?} [convert] 
 * 
 * @property {((value: T?, index: any, store: Store) => void)?} [onUpdate] 
 */
