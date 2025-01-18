import { Signal } from 'signal-polyfill';
import { createBooleanStates } from './createBooleanStates.mjs';
import * as toValues from './toValues.mjs';
import createState from './createState.mjs';
/** @import { Schema } from '../types.mjs' */
/**
 * @template [T=any]
 */
export default class Store {
	/** @type {Map<string, Set<(value: any, store: any) => void | boolean | null>>} */
	#events = new Map()
	/**
	 * 
	 * @template {keyof Schema.Events} K
	 * @param {K} event 
	 * @param  {Schema.Events[K]} value 
	 */
	emit(event, value) {
		const key = typeof event === 'number' ? String(event) : event;
		const events = this.#events;
		let canceled = false;
		for (const d of [...events.get(key) || []]) {
			canceled = d(value, this) === false || canceled;
		}
		return !canceled;
	}
	/**
	 * 
	 * @template {keyof Schema.Events} K
	 * @param {K} event 
	 * @param  {(this: this, p: Schema.Events[K], store: this) => void | boolean | null} listener
	 * @returns {() => void}
	 */
	listen(event, listener) {
		const fn = listener.bind(this);
		const events = this.#events;
		const key = typeof event === 'number' ? String(event) : event;
		let set = events.get(key);
		if (!set) {
			set = new Set();
			events.set(key, set);
		}
		set.add(fn);
		return () => { set?.delete(fn); }

	}
	/**
	 * @param {Schema} schema
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 */
	static create(schema, options = {}) {
		return new ObjectStore({type: schema}, { ...options, parent: null });
	}
	#null = false;
	get null() { return this.#null; }
	get kind() { return ''; }
	/**
	 * @param {Schema.Field} schema
	 * @param {object} options 
	 * @param {*} [options.parent] 
	 * @param {*} [options.state] 
	 * @param {number | string | null} [options.index] 
	 * @param {number | Signal.State<number> | Signal.Computed<number>} [options.length] 
	 * @param {boolean} [options.null] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 * @param {boolean} [options.clearable] 
	 * @param {boolean} [options.required] 
	 * @param {boolean} [options.readonly] 
	 * @param {boolean} [options.disabled] 
	 * 
	 * @param {string} [options.label] 字段标签
	 * @param {string} [options.description] 字段描述
	 * @param {string} [options.placeholder] 占位符
	 * @param {number} [options.min] 日期、时间、数字的最小值
	 * @param {number} [options.max] 日期、时间、数字的最大值
	 * @param {number} [options.step] 日期、时间、数字的步长
	 * @param {(Schema.Value.Group | Schema.Value | string | number)[]} [options.values] 可选值
	 * 
	 * @param {((value: any) => any)?} [options.setValue] 
	 * @param {((value: any) => any)?} [options.setState] 
	 * @param {((value: any, state: any) => [value: any, state: any])?} [options.convert] 
	 * 
	 * @param {((value: T?, index: any, store: Store) => void)?} [options.onUpdate] 
	 * @param {((value: T?, index: any, store: Store) => void)?} [options.onUpdateState] 
	 */
	constructor(schema, {
		null: isNull, state,
		setValue, setState, convert, onUpdate, onUpdateState,
		index, length, new: isNew, parent: parentNode,
		hidden, clearable, required, disabled, readonly,
		label, description, placeholder, min, max, step, values
	}) {
		this.schema = schema;
		this.#state.set(typeof state === 'object' && state || {});
		const parent = parentNode instanceof Store ? parentNode : null;
		if (parent) {
			this.#parent = parent;
			this.#root = parent.#root;
			// TODO: 事件向上冒泡
		}
		this.#type = schema.type;
		this.#meta = schema.meta;
		this.#component = schema.component;

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

		const readonlyFn = schema.readonly
		const selfReadonly = new Signal.State(typeof readonly === 'boolean' ? readonly : null);
		/** @type {Signal.Computed<boolean>} */
		let readonlyScript
		if (typeof readonlyFn === 'function') {
			readonlyScript = new Signal.Computed(() => Boolean(readonlyFn(this, this.root)))
		} else {
			const def = Boolean(readonlyFn)
			readonlyScript = new Signal.Computed(() => def);
		}
		const getReadonly = () => {
			if (newState.get() ? !creatable : immutable) { return true; }
			const s = selfReadonly.get();
			return s === null ? readonlyScript.get() : s;
		};
		const readonlyParent =  parent ? parent.#readonly : null;
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
		// @ts-ignore
		[this.#selfValues, this.#values] = createState(this, toValues.values, values, schema.values);

		if (length instanceof Signal.State || length instanceof Signal.Computed) {
			this.#length = length;
		} else {
			this.#length = new Signal.State(length || 0);
		}

		if (isNull) {
			this.#null = true;
			return;
		}
		this.#onUpdate = onUpdate || null;
		this.#onUpdateState = onUpdateState || null;
		this.#setValue = typeof setValue === 'function' ? setValue : null;
		this.#setState = typeof setState === 'function' ? setState : null;
		this.#convert = typeof convert === 'function' ? convert : null;
		this.#index.set(index ?? '');
		
		for (const [k, f] of Object.entries(schema.events || {})) {
			if (typeof f !== 'function') { continue; }
			// @ts-ignore
			this.listen(k, f);
		}
	}
	/** @type {((value: any) => any)?} */
	#setValue = null
	/** @type {((value: any) => any)?} */
	#setState = null
	/** @type {((value: any, state: any) => [value: any, state: any])?} */
	#convert = null
	/** @type {((value: any, index: any, store: Store) => void)?} */
	#onUpdate = null
	/** @type {((value: any, index: any, store: Store) => void)?} */
	#onUpdateState = null
	/** @readonly @type {Store?} */
	#parent = null;
	/** @readonly @type {Store} */
	#root = this;
	/** @readonly @type {any} */
	#type;
	/** @readonly @type {any} */
	#meta;
	/** @readonly @type {any} */
	#component;
	get store() { return this; }
	get parent() { return this.#parent; }
	get root() { return this.#root; }
	get type() { return this.#type; }
	get meta() { return this.#meta; }
	get component() { return this.#component; }

	/** @type {Signal.State<number> | Signal.Computed<number>} */
	#length;
	get length() { return this.#length.get(); }
	#index = new Signal.State(/** @type {string | number} */(''));
	get index() { return this.#index.get(); }
	set index(v) { this.#index.set(v); }
	get no() {
		if (this.#null) { return ''; }
		const index = this.index;
		return typeof index === 'number' ? index + 1 : index;
	}

	#creatable = true;
	get creatable() { return this.#creatable; }
	#immutable = false;
	get immutable() { return this.#immutable; }

	/** @readonly @type {Signal.Computed<boolean>} */
	#new
	/** @readonly @type {Signal.State<boolean>} */
	#selfNew
	get selfNew() { return this.#selfNew.get(); }
	set selfNew(v) { this.#selfNew.set(Boolean(v)); }
	get new() { return this.#new.get(); }
	set new(v) { this.#selfNew.set(Boolean(v)); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfHidden
	/** @readonly @type {Signal.Computed<boolean>} */
	#hidden
	get selfHidden() { return this.#selfHidden.get(); }
	set selfHidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }
	get hidden() { return this.#hidden.get(); }
	set hidden(v) { this.#selfHidden.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfClearable
	/** @readonly @type {Signal.Computed<boolean>} */
	#clearable
	get selfClearable() { return this.#selfClearable.get(); }
	set selfClearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }
	get clearable() { return this.#clearable.get(); }
	set clearable(v) { this.#selfClearable.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfRequired
	/** @readonly @type {Signal.Computed<boolean>} */
	#required
	get selfRequired() { return this.#selfRequired.get(); }
	set selfRequired(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }
	get required() { return this.#required.get(); }
	set required(v) { this.#selfRequired.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfDisabled
	/** @readonly @type {Signal.Computed<boolean>} */
	#disabled
	get selfDisabled() { return this.#selfDisabled.get(); }
	set selfDisabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }
	get disabled() { return this.#disabled.get(); }
	set disabled(v) { this.#selfDisabled.set(typeof v === 'boolean' ? v : null); }

	/** @readonly @type {Signal.State<boolean?>} */
	#selfReadonly
	/** @readonly @type {Signal.Computed<boolean>} */
	#readonly
	get selfReadonly() { return this.#selfReadonly.get(); }
	set selfReadonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }
	get readonly() { return this.#readonly.get(); }
	set readonly(v) { this.#selfReadonly.set(typeof v === 'boolean' ? v : null); }




	/** @readonly @type {Signal.State<string?>} */
	#selfLabel
	/** @readonly @type {Signal.Computed<string?>} */
	#label
	get selfLabel() { return this.#selfLabel.get(); }
	set selfLabel(v) { this.#selfLabel.set(toValues.string(v)); }
	get label() { return this.#label.get(); }
	set label(v) { this.#selfLabel.set(toValues.string(v)); }


	/** @readonly @type {Signal.State<string?>} */
	#selfDescription
	/** @readonly @type {Signal.Computed<string?>} */
	#description
	get selfDescription() { return this.#selfDescription.get(); }
	set selfDescription(v) { this.#selfDescription.set(toValues.string(v)); }
	get description() { return this.#description.get(); }
	set description(v) { this.#selfDescription.set(toValues.string(v)); }

	/** @readonly @type {Signal.State<string?>} */
	#selfPlaceholder
	/** @readonly @type {Signal.Computed<string?>} */
	#placeholder
	get selfPlaceholder() { return this.#selfPlaceholder.get(); }
	set selfPlaceholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }
	get placeholder() { return this.#placeholder.get(); }
	set placeholder(v) { this.#selfPlaceholder.set(toValues.string(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfMin
	/** @readonly @type {Signal.Computed<number?>} */
	#min
	get selfMin() { return this.#selfMin.get(); }
	set selfMin(v) { this.#selfMin.set(toValues.number(v)); }
	get min() { return this.#min.get(); }
	set min(v) { this.#selfMin.set(toValues.number(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfMax
	/** @readonly @type {Signal.Computed<number?>} */
	#max
	get selfMax() { return this.#selfMax.get(); }
	set selfMax(v) { this.#selfMax.set(toValues.number(v)); }
	get max() { return this.#max.get(); }
	set max(v) { this.#selfMax.set(toValues.number(v)); }


	/** @readonly @type {Signal.State<number?>} */
	#selfStep
	/** @readonly @type {Signal.Computed<number?>} */
	#step
	get selfStep() { return this.#selfStep.get(); }
	set selfStep(v) { this.#selfStep.set(toValues.number(v)); }
	get step() { return this.#step.get(); }
	set step(v) { this.#selfStep.set(toValues.number(v)); }


	/** @readonly @type {Signal.State<(Schema.Value.Group | Schema.Value)[] | null>} */
	#selfValues
	/** @readonly @type {Signal.Computed<(Schema.Value.Group | Schema.Value)[] | null>} */
	#values
	get selfValues() { return this.#selfValues.get(); }
	set selfValues(v) { this.#selfValues.set(toValues.values(v)); }
	get values() { return this.#values.get(); }
	set values(v) { this.#selfValues.set(toValues.values(v)); }

	/** @returns {IterableIterator<[key: string | number, value: Store]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return null; }

	#set = false;
	#initValue = new Signal.State(/** @type {T?} */(null));
	#value = new Signal.State(this.#initValue.get());

	
	#state = new Signal.State(/** @type {any} */(null));

	get changed() { return this.#value.get() === this.#initValue.get(); }

	get value() { return this.#value.get(); }
	set value(v) {
		const val = this.#setValue?.(v) || v;
		this.#value.set(val);
		if (!this.#set) {
			this.#initValue.set(val);
		}
		this.#onUpdate?.(val, this.#index.get(), this);
		this.#requestUpdate();
	}

	get state() { return this.#state.get(); }
	set state(v) {
		const sta = this.#setState?.(v) || v;
		this.#state.set(sta);
		this.#onUpdateState?.(sta, this.#index.get(), this);
		this.#requestUpdate();
	}
	#requestUpdate() {
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		queueMicrotask(() => {
			const oldValue = this.#value.get();
			const oldState = this.#state.get();
			this.#runUpdate(oldValue, oldState);
		});
	}
	reset(value = this.#initValue.get()) {
		this.#reset(value);
	}
	/**
	 * 
	 * @param {*} value 
	 * @returns 
	 */
	#reset(value) {
		this.#value.set(value);
		this.#initValue.set(value);
		if (!value || typeof value !== 'object') {
			for (const [, field] of this) {
				field.#reset(null);
			}
			return;
		}
		for (const [key, field] of this) {
			field.#reset(value[key]);
		}
	}


	#needUpdate = false;
	/**
	 * 
	 * @param {T} value 
	 * @param {*} state 
	 * @returns 
	 */
	#toUpdate(value, state) {
		const [val,sta] = this.#convert?.(value, state) || [value, state];
		if(this.#value.get() === val && this.#state.get() === sta) { return [val,sta] }
		this.#value.set(val);
		this.#state.set(sta);
		return this.#runUpdate(val, sta);
	}
	/**
	 * 
	 * @param {*} val 
	 * @param {*} sta 
	 * @returns {[any, any]}
	 */
	#runUpdate(val, sta) {
		this.#needUpdate = false;
		let initValue = val;
		if (val && typeof val === 'object') {
			/** @type {T} */
			// @ts-ignore
			let newValues = Array.isArray(val) ? [...val] : {...val};
			let newStates = Array.isArray(val) ? Array.isArray(sta) ? [...sta] : [] : {...sta};
			let updated = false;
			for (const [key, field] of this) {
				// @ts-ignore
				const data = val[key];
				const state = sta?.[key];
				const [newData, newState] = field.#toUpdate(data, state);
				if (data !== newData) {
					// @ts-ignore
					newValues[key] = newData;
					updated = true;
				}
				if (state !== newState) {
					newStates[key] = newState;
					updated = true;
				}
			}
			if (updated) {
				val = newValues;
				sta = newStates;
				initValue = val;
				this.#value.set(val);
				this.#state.set(newStates);
			}
		}
		if (!this.#set) {
			this.#set = true;
			this.#initValue.set(initValue);
		}
		return [val, sta];
	}

}



export class ObjectStore extends Store {
	get kind() { return 'object'; }
	/** @type {Record<string, Store>} */
	#children
	*[Symbol.iterator]() {yield* Object.entries(this.#children);}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return this.#children[key] || null; }
	/**
	 * @param {Schema.Object & Schema.Attr} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent] 
	 * @param {string | number} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdate] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdateState] 
	 */
	constructor(schema,{ parent, index, new: isNew, onUpdate, onUpdateState } = {}) {
		const childrenTypes = Object.entries(schema.type);
		super(schema, {
			parent, index, new: isNew, onUpdate, onUpdateState,
			length: childrenTypes.length,
			setValue(v) { return typeof v === 'object' ? v : null; },
			setState(v) { return typeof v === 'object' ? v : null; },
			convert(v, state) {
				return [
					typeof v === 'object' ? v : {},
					typeof state === 'object' ? state : {},
				]
			},
		});
		const children = Object.create(null);
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index @param {Store} store */
			onUpdate: (value, index, store) => {
				if (store !== this.#children[index]) { return; }
				this.value = {...this.value, [index]: value};
			},
			/** @param {*} state @param {*} index @param {Store} store */
			onUpdateState: (state, index, store) => {
				if (store !== this.#children[index]) { return; }
				this.state = {...this.state, [index]: state};
			}
		}

		for (const [index, field] of childrenTypes) {
			let child;
			if (typeof field.type === 'string') {
				if (field.array) {
					child = new ArrayStore(field, {...childCommonOptions, index});
				} else {
					child = new Store(field, {...childCommonOptions, index});
				}
			} else if (field.array) {
				child = new ArrayStore(field, {...childCommonOptions, index});
			} else {
				child = new ObjectStore(/**@type {*}*/(field), { ...childCommonOptions, index});
			}
			children[index] = child;
		}
		this.#children = children;
	}
}

/**
 * @template [T=any]
 * @extends {Store<(T | null)[]>}
 */
export class ArrayStore extends Store {
	/** @type {(index: number, isNew?: boolean) => Store} */
	#create = () => {throw new Error}
	/** @type {Signal.State<Store[]>} */
	#children
	get children() { return [...this.#children.get()]; }
	*[Symbol.iterator]() { return yield*[...this.#children.get().entries()]; }
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) {
		const children = this.#children.get();
		if (typeof key === 'number' && key < 0) {
			return children[children.length + key] || null;
		}
		return children[Number(key)] || null;
	}
	get kind() { return 'array'; }
	/**
	 * @param {Schema.Field} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent]
	 * @param {string | number | null} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdate] 
	 * @param {(value: any, index: any, store: Store) => void} [options.onUpdateState] 
	 */
	constructor(schema, { parent, onUpdate, onUpdateState, index, new: isNew} = {}) {
		const childrenState = new Signal.State(/** @type {Store[]} */([]));
		// @ts-ignore
		const updateChildren = (list) => {
			const length = Array.isArray(list) && list.length || 0;
			const children = [...childrenState.get()];
			const oldLength = children.length;
			for (let i = children.length; i < length; i++) {
					children.push(this.#create(i));
			}
			if (oldLength !== length) {
				childrenState.set(children);
			}

		}
		super(schema, {
			index, new: isNew, parent,
			length: new Signal.Computed(() => childrenState.get().length),
			state: [],
			setValue(v) { return Array.isArray(v) ? v : v == null ? null : [v] },
			setState(v) { return Array.isArray(v) ? v : v == null ? null : [v] },
			convert(v, state) {
				const val = Array.isArray(v) ? v : v == null ? null : [v];
				updateChildren(val);
				return [
					val,
					(Array.isArray(state) ? state : v == null ? [] : [state]),
				];
			},
			onUpdate:(value, index, state) => {
				updateChildren(value);
				onUpdate?.(value, index, state);
			},
			onUpdateState,
		});
		this.#children = childrenState;
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index @param {Store} store */
			onUpdate: (value, index, store) => {
				if (childrenState.get()[index] !== store) { return;}
				const val = [...this.value || []];
				if (val.length < index) {
					val.length = index;
				}
				val[index] = value;
				this.value = val;
			},
			/** @param {*} state @param {*} index @param {Store} store */
			onUpdateState: (state, index, store) => {
				if (childrenState.get()[index] !== store) { return;}
				const sta = [...this.state || []];
				if (sta.length < index) {
					sta.length = index;
				}
				sta[index] = state;
				this.state = sta;
			},
		}
		if (typeof schema.type === 'string') {
			this.#create = (index, isNew) =>  {
				const child = new Store(schema, {...childCommonOptions, index, new: isNew });
				child.index = index;
				return child
			}
		} else if (schema.type && typeof schema.type === 'object' && !Array.isArray(schema.type)) {
			this.#create = (index, isNew) =>  {
				const child = new ObjectStore(/** @type {*} */(schema), { ...childCommonOptions, index, new: isNew});
				child.index = index;
				return child
			}
		} else {
			throw new Error();
		}
		
	}
	/**
	 * 
	 * @param {number} index 
	 * @param {T?} [value] 
	 * @param {boolean} [isNew] 
	 * @returns 
	 */
	insert(index, value = null, isNew) {
		const data = this.value || [];
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const insertIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const item = this.#create(insertIndex, isNew);
		item.new = true;
		children.splice(insertIndex, 0, item);
		for (let i = index + 1; i < children.length; i++) {
			children[i].index = i;
		}
		const val = [...data];
		val.splice(insertIndex, 0, value);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			sta.splice(insertIndex, 0, {});
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;
	}
	/**
	 * 
	 * @param {T?} [value] 
	 * @returns 
	 */
	add(value = null) {
		return this.insert(this.#children.get().length, value);
	}
	/**
	 * 
	 * @param {number} index 
	 * @returns 
	 */
	remove(index) {
		const data = this.value;
		if (!Array.isArray(data)) { return; }
		const children = [...this.#children.get()];
		const removeIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const [item] = children.splice(removeIndex, 1);
		if (!item) { return; }
		for (let i = index; i < children.length; i++) {
			children[i].index = i;
		}
		const val = [...data];
		const [value] = val.splice(removeIndex, 1);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...this.state];
			sta.splice(removeIndex, 1);
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return value;

	}
	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 * @returns 
	 */
	move(from, to) {
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const [item] = children.splice(from, 1);
		if (!item) { return false; }
		children.splice(to, 0, item);
		let lft = Math.min(from, to);
		let rgt = Math.max(from, to);
		for (let i = lft; i <= rgt; i++) {
			children[i].index = i;
		}
		const val = [...data];
		const [value] = val.splice(from, 1);
		val.splice(to, 0, value);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			const [value = {}] = sta.splice(from, 1);
			if (to <= sta.length) {
				sta.splice(to, 0, value);
			} else {
				sta[to] = value;
			}
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;

	}
	/**
	 * 
	 * @param {number} a 
	 * @param {number} b 
	 * @returns 
	 */
	exchange(a, b) {
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = [...this.#children.get()];
		const aItem = children[a];
		const bItem = children[b];
		if (!aItem || !bItem) { return false; }
		children[b] = aItem;
		children[a] = bItem;
		aItem.index = b;
		bItem.index = a;
		const val = [...data];
		const aValue = val[a];
		const bValue = val[b];
		val[b] = aValue;
		val[a] = bValue;
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...state];
			const aValue = sta[a];
			const bValue = sta[b];
			sta[b] = aValue;
			sta[a] = bValue;
			this.state = sta;
		}
		this.#children.set(children);
		this.value = val;
		return true;
	}
}
