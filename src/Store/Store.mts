import type { Ref } from './ref.mjs'
import type { Schema } from '../Schema.types.mts'
import { Signal } from 'signal-polyfill';
import createBooleanStates from './createBooleanStates.mjs';
import * as toValues from './toValues.mjs';
import createState from './createState.mjs';
import createRef from './ref.mjs';
import create, { setStore } from './create.mts';
import createValidator from './createValidator.mjs';
import makeDefault from './makeDefault.mjs';

/** 管理单个表单字段的状态和行为 */
export default class Store<
	T = any,
	M = any,
	S extends {[k in string & keyof S]: Schema.State} = object,
	L extends { [k in keyof L]: L[k] } = object,
> {
	#originStore: Store<T, M, S, L> | null = null;

	/** 字段的 Schema 定义 */
	#schema: Schema.Field<M, S, L>;
	get schema() { return this.#schema; }
	#events: Map<string, Set<(value: any, store: any) => void | boolean | null>> = new Map();
	/** 触发事件并通知监听器 */
	emit<K extends keyof Schema.Events>(
		event: K,
		value: Schema.Events[K],
	): boolean {
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
	/** 监听事件 */
	listen<K extends keyof Schema.Events>(
		event: K,
		listener: (this: this, p: Schema.Events[K], store: this) => void | boolean | null,
	): () => void;
	/** 监听事件 */
	listen<K extends keyof Schema.Events>(
		event: string,
		listener: (this: this, p: unknown, store: this) => void | boolean | null,
	): () => void;
	/** 监听事件 */
	listen(
		event: string,
		listener: (this: this, p: unknown, store: this) => void | boolean | null,
	): () => void {
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
	 * @param schema 数据结构模式
	 * @param options 选项
	 * @param options.new 是否为新建环境
	 */
	static create<
		M = any,
		S extends {[k in string & keyof S]: Schema.State} = object,
		L extends { [k in keyof L]: L[k] } = object,
	>(schema: Schema<M, S, L>, options: { new?: boolean; } = {}) {
		return create({ type: schema }, { ...options, parent: null });
	}
	/** 设置自定义类型的存储类 */
	static setStore(type: string, Class: { new(...p: ConstructorParameters<typeof Store>): Store; }) {
		return setStore(type, Class);
	}
	#null = false;
	/** 是否为无效空存储 */
	get null() { return this.#null; }
	/** 存储类类别，继承的自定义类需要设置自定义的此只读属性 */
	get kind() { return ''; }
	#ref: Ref | null = null;
	get ref() { return this.#ref || createRef(this); }
	/**
	 * @param schema 字段的 Schema 定义
	 * @param options 可选配置
	 */
	constructor(
		schema: Schema.Field<M, S, L> | Store<T, M, S, L>,
		options?: StoreOptions | AbortSignal | null,
	) {
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
			label, description, placeholder,
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
		this.#layout = schema.layout || null;

		const selfNewState = new Signal.State(Boolean(isNew));
		this.#selfNew = selfNewState;
		const newState: Signal.Computed<boolean> = parent
			? new Signal.Computed(() => parent.#new.get() || selfNewState.get())
			: new Signal.Computed(() => selfNewState.get());

		this.#new = newState;
		const immutable = Boolean(schema.immutable);
		const creatable = schema.creatable !== false;
		this.#immutable = immutable;
		this.#creatable = creatable;

		const readonlyFn = schema.readonly;
		const selfReadonly = new Signal.State(typeof readonly === 'boolean' ? readonly : null);
		let readonlyScript: Signal.Computed<boolean>;
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

		[this.#selfRemovable, this.#removable] = createBooleanStates(this, removable, schema.removable ?? true);

		const schemaStates = schema.states as { [k in string]: Schema.Stater<any, any>; };
		this.#states = schemaStates ? Object.defineProperties(Object.create(null),
			Object.fromEntries(
				Object.entries(schemaStates).map(([k, { get, set, toState }]) => {
					const state = new Signal.State(toState?.(states?.[k as keyof typeof states]));
					const computed = new Signal.Computed(() => get(this, state));
					return [k, {
						configurable: true,
						enumerable: true,
						get: () => computed.get(),
						set: (v) => set?.(this, state, v),
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
	#states: S | null;
	get states() { return this.#states; }
	#layout: L | null;
	get layout() { return this.#layout; }
	#createDefault: (value?: any) => unknown;
	createDefault(value: any): any { return this.#createDefault(value); }
	#setValue: ((value: any) => any) | null = null;
	#convert: ((value: any) => any) | null = null;
	#onUpdate: ((value: any, index: any, store: Store) => void) | null = null;
	readonly #parent: Store | null = null;
	readonly #root: Store = this;
	readonly #type: any;
	readonly #meta: M | void;
	readonly #component: any;
	#selfLoading: Signal.State<boolean> | null = null;
	#loading: Signal.State<boolean>;
	get loading() { return this.#loading.get(); }
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

	#size: Signal.State<number> | Signal.Computed<number>;
	/** 长度信息 */
	get size() { return this.#size.get(); }
	#index = new Signal.State<string | number>('');
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

	readonly #new: Signal.Computed<boolean>;
	readonly #selfNew: Signal.State<boolean>;
	get selfNew() { return this.#selfNew.get(); }
	set selfNew(v) { this.#selfNew.set(Boolean(v)); }
	/** 是否新建项 */
	get new() { return this.#new.get(); }
	set new(v) { this.#selfNew.set(Boolean(v)); }

	readonly #selfHidden: Signal.State<boolean | null>;
	readonly #hidden: Signal.Computed<boolean>;
	get selfHidden() { return this.#selfHidden.get(); }
	set selfHidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }
	/** 是否可隐藏 */
	get hidden() { return this.#hidden.get(); }
	set hidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }

	readonly #selfClearable: Signal.State<boolean | null>;
	readonly #clearable: Signal.Computed<boolean>;
	get selfClearable() { return this.#selfClearable.get(); }
	set selfClearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }
	/** 是否可清除 */
	get clearable() { return this.#clearable.get(); }
	set clearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }

	readonly #selfRequired: Signal.State<boolean | null>;
	readonly #required: Signal.Computed<boolean>;
	get selfRequired() { return this.#selfRequired.get(); }
	set selfRequired(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }
	/** 是否必填 */
	get required() { return this.#required.get(); }
	set required(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }

	readonly #selfDisabled: Signal.State<boolean | null>;
	readonly #disabled: Signal.Computed<boolean>;
	get selfDisabled() { return this.#selfDisabled.get(); }
	set selfDisabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }
	/** 是否禁用字段 */
	get disabled() { return this.#disabled.get(); }
	set disabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }

	readonly #selfReadonly: Signal.State<boolean | null>;
	readonly #readonly: Signal.Computed<boolean>;
	get selfReadonly() { return this.#selfReadonly.get(); }
	set selfReadonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }
	/** 是否只读 */
	get readonly() { return this.#readonly.get(); }
	set readonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }


	readonly #selfRemovable: Signal.State<boolean | null>;
	readonly #removable: Signal.Computed<boolean>;
	get selfRemovable() { return this.#selfRemovable.get(); }
	set selfRemovable(v) { this.#selfRemovable.set(typeof v === 'boolean' ? v : null); }
	/** 是否只读 */
	get removable() { return this.#removable.get(); }
	set removable(v) { this.#selfRemovable.set(typeof v === 'boolean' ? v : null); }


	readonly #selfLabel: Signal.State<string | null>;
	readonly #label: Signal.Computed<string | null>;
	get selfLabel() { return this.#selfLabel.get(); }
	set selfLabel(v) { this.#selfLabel.set(toValues.string(v)); }
	/** 字段的标签信息 */
	get label() { return this.#label.get(); }
	set label(v) { this.#selfLabel.set(toValues.string(v)); }


	readonly #selfDescription: Signal.State<string | null>;
	readonly #description: Signal.Computed<string | null>;
	get selfDescription() { return this.#selfDescription.get(); }
	set selfDescription(v) { this.#selfDescription.set(toValues.string(v)); }
	/** 字段的描述信息 */
	get description() { return this.#description.get(); }
	set description(v) { this.#selfDescription.set(toValues.string(v)); }

	readonly #selfPlaceholder: Signal.State<string | null>;
	readonly #placeholder: Signal.Computed<string | null>;
	get selfPlaceholder() { return this.#selfPlaceholder.get(); }
	set selfPlaceholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }
	/** 字段的占位符信息 */
	get placeholder() { return this.#placeholder.get(); }
	set placeholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }



	#errors: Signal.Computed<string[]>;
	#execValidators: () => Promise<string[]>;
	#cancelEventValidator: () => void;
	/** 所有校验错误列表 */
	get errors() { return this.#errors.get(); }
	/** 字段校验错误信息 */
	get error() { return this.#errors.get()[0]; }

	*[Symbol.iterator](): IterableIterator<[key: string | number, value: Store<any, M, S, L>]> { }
	/** 获取子存储 */
	child(key: string | number): Store<any, M, S, L> | null { return null; }

	#set = false;
	#initValue = new Signal.State(null as T | null);
	#value = new Signal.State(this.#initValue.get());

	#subBindStores: Set<Store> = new Set();

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
	reset(
		value = this.#set ? this.#initValue.get() : this.#createDefault(),
		isNew = this.#selfNew.get(),
	) {
		const originStore = this.#originStore;
		if (originStore) { originStore.reset(value, isNew); return; }
		this.#reset(value, Boolean(isNew));
	}
	#reset(v: any, isNew: boolean) {
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
		const newValues: any = Array.isArray(value) ? [...value] : { ...value };
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
	#toUpdate(value: T) {
		let val = this.#convert?.(value) ?? value;
		if (val === undefined) { val = value; }
		if (Object.is(this.#value.get(), val)) { return val; }
		return this.#runUpdate(val);
	}
	#runUpdate(val: any): [any, any] {
		this.#needUpdate = false;
		let initValue = val;
		if (val && typeof val === 'object') {
			// @ts-ignore
			let newValues: T = Array.isArray(val) ? [...val] : { ...val };
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
	/** 异步校验 */
	validate(self: true): Promise<string[] | null>
	/** 异步校验 @param path 到当前层级的路径 */
	validate(
		path?: (string | number)[] | false | null
	): Promise<{ path: (string | number)[]; store: Store; errors: string[]; }[]>
	/** 异步校验 */
	validate(
		path?: (string | number)[] | boolean | null
	): Promise<string[] | { path: (string | number)[]; store: Store; errors: string[]; }[] | null>
	/** 异步校验 */
	validate(
		path?: (string | number)[] | boolean | null
	): Promise<string[] | { path: (string | number)[]; store: Store; errors: string[]; }[] | null> {
		if (path === true) {
			if (this.#originStore) { return Promise.resolve(null); }
			return this.#execValidators().then(errors => errors.length ? errors : null);
		}
		const selfPath = Array.isArray(path) ? path : [];
		if (!this.#originStore && this.#hidden.get()) { return Promise.resolve([]); }
		const list = [this.validate(true).then(errors => {
			if (!errors?.length) { return []; }
			return [{ path: [...selfPath], store: this as Store, errors }];
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

export interface StoreOptions<
	T = any,
	M = any,
	S extends {[k in string & keyof S]: Schema.State} = object,
> {
	parent?: Store | null;
	states?: Partial<S> | null;
	default?: ((store: Store, value?: any) => any) | object | number | string | boolean | null | undefined;
	index?: number | string | null;
	size?: number | Signal.State<number> | Signal.Computed<number>;
	null?: boolean;
	new?: boolean;
	hidden?: boolean;
	clearable?: boolean;
	required?: boolean;
	disabled?: boolean;
	readonly?: boolean;
	removable?: boolean;
	/** 字段标签 */
	label?: string;
	/** 字段描述 */
	description?: string;
	/** 占位符 */
	placeholder?: string;
	min?: number;
	max?: number;
	step?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	values?: (Schema.Value.Group | Schema.Value | string | number)[];
	validator?: Schema.Validator | Schema.Validator[] | null;

	ref?: Ref | null;

	setValue?: (value: any) => any;
	convert?: (value: any) => any;

	onUpdate?: ((value: T, index: any, store: Store) => void) | null;
}
