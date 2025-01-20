import { Signal } from 'signal-polyfill';
import { createBooleanStates } from './createBooleanStates.mjs';
import * as toValues from './toValues.mjs';
import createState from './createState.mjs';
import createRef from './ref.mjs';
import create, { setStore } from './create.mjs';
import { createAsyncValidator, createValidator, merge } from './createValidator.mjs';
/** @import { Ref } from './ref.mjs' */
/** @import { AsyncValidator, Schema, Validator } from '../types.mjs' */

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
		return create({type: schema}, { ...options, parent: null });
	}
	/**
	 * @param {string} type
	 * @param {{new(...p: ConstructorParameters<typeof Store>): Store}} Class
	 */
	static setStore(type, Class) {
		return setStore(type, Class);
	}
	#null = false;
	get null() { return this.#null; }
	get kind() { return ''; }
	/** @type {Ref?} */
	#ref = null;
	get ref() { return this.#ref || createRef(this); }
	/**
	 * @param {Schema.Field} schema
	 * @param {object} [options] 
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
	 * @param {number} [options.minLength] 
	 * @param {number} [options.maxLength] 
	 * @param {RegExp} [options.pattern] 
	 * @param {(Schema.Value.Group | Schema.Value | string | number)[]} [options.values] 可选值
	 * @param {Validator | Validator[] | null} [options.validator]
	 * @param {{[k in keyof Schema.Events]?: AsyncValidator | AsyncValidator[] | null}} [options.validators]
	 * 
	 * @param {Ref?} [options.ref]
	 * 
	 * @param {((value: any) => any)?} [options.setValue] 
	 * @param {((value: any) => any)?} [options.setState] 
	 * @param {((value: any, state: any) => [value: any, state: any])?} [options.convert] 
	 * 
	 * @param {((value: T?, index: any, store: Store) => void)?} [options.onUpdate] 
	 * @param {((value: T?, index: any, store: Store) => void)?} [options.onUpdateState] 
	 */
	constructor(schema, {
		null: isNull, state, ref,
		setValue, setState, convert, onUpdate, onUpdateState,
		validator, validators,
		index, length, new: isNew, parent: parentNode,
		hidden, clearable, required, disabled, readonly,
		label, description, placeholder, min, max, step, minLength, maxLength, pattern, values
	} = {}) {
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
			readonlyScript = new Signal.Computed(() => Boolean(readonlyFn(this)))
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
		[this.#selfMinLength, this.#minLength] = createState(this, toValues.number, minLength, schema.minLength);
		[this.#selfMaxLength, this.#maxLength] = createState(this, toValues.number, maxLength, schema.maxLength);
		[this.#selfPattern, this.#pattern] = createState(this, toValues.regex, pattern, schema.pattern);
		// @ts-ignore
		[this.#selfValues, this.#values] = createState(this, toValues.values, values, schema.values);

		const validatorResult = createValidator(this, schema.validator, validator);

		const [changed, changedResult, cancelChange] = createAsyncValidator(this, schema.validators?.change, validators?.change);
		const [blurred, blurredResult, cancelBlur] = createAsyncValidator(this, schema.validators?.blur, validators?.blur);
		this.listen('change', () => {changed()});
		this.listen('blur', () => {blurred()});
		this.#errors = merge(validatorResult, changedResult, blurredResult)
		this.#validatorResult = validatorResult;
		this.#changed = changed;
		this.#blurred = blurred;
		this.#cancelChange = cancelChange;
		this.#cancelBlur = cancelBlur;
		
		if (length instanceof Signal.State || length instanceof Signal.Computed) {
			this.#length = length;
		} else {
			this.#length = new Signal.State(length || 0);
		}

		if (isNull) {
			this.#null = true;
			this.#ref = createRef(this);
			return;
		}
		this.#ref = ref || null;
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

	/** @readonly @type {Signal.State<number?>} */
	#selfMinLength
	/** @readonly @type {Signal.Computed<number?>} */
	#minLength
	get selfMinLength() { return this.#selfMinLength.get(); }
	set selfMinLength(v) { this.#selfMinLength.set(toValues.number(v)); }
	get minLength() { return this.#minLength.get(); }
	set minLength(v) { this.#selfMinLength.set(toValues.number(v)); }

	/** @readonly @type {Signal.State<number?>} */
	#selfMaxLength
	/** @readonly @type {Signal.Computed<number?>} */
	#maxLength
	get selfMaxLength() { return this.#selfMaxLength.get(); }
	set selfMaxLength(v) { this.#selfMaxLength.set(toValues.number(v)); }
	get maxLength() { return this.#maxLength.get(); }
	set maxLength(v) { this.#selfMaxLength.set(toValues.number(v)); }

	/** @readonly @type {Signal.State<RegExp?>} */
	#selfPattern
	/** @readonly @type {Signal.Computed<RegExp?>} */
	#pattern
	get selfPattern() { return this.#selfPattern.get(); }
	set selfPattern(v) { this.#selfPattern.set(toValues.regex(v)); }
	get pattern() { return this.#pattern.get(); }
	set pattern(v) { this.#selfPattern.set(toValues.regex(v)); }


	/** @readonly @type {Signal.State<(Schema.Value.Group | Schema.Value)[] | null>} */
	#selfValues
	/** @readonly @type {Signal.Computed<(Schema.Value.Group | Schema.Value)[] | null>} */
	#values
	get selfValues() { return this.#selfValues.get(); }
	set selfValues(v) { this.#selfValues.set(toValues.values(v)); }
	get values() { return this.#values.get(); }
	set values(v) { this.#selfValues.set(toValues.values(v)); }


	/** @type {Signal.Computed<string[]>} */
	#errors
	/** @type {Signal.Computed<string[]>} */
	#validatorResult
	/** @type {() => Promise<string[]>} */
	#changed
	/** @type {() => Promise<string[]>} */
	#blurred
	/** @type {() => void} */
	#cancelChange
	/** @type {() => void} */
	#cancelBlur
	get errors() { return this.#errors.get(); }
	get error() { return this.#errors.get()[0]; }

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
		const newValue = this.#setValue?.(v)
		const val = newValue === undefined ? v : newValue;
		this.#value.set(val);
		if (!this.#set) {
			this.#initValue.set(val);
		}
		this.#onUpdate?.(val, this.#index.get(), this);
		this.#requestUpdate();
	}

	get state() { return this.#state.get(); }
	set state(v) {
		const newState = this.#setState?.(v)
		const sta = newState === undefined ? v : newState;
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
	 * @param {*} v 
	 * @returns 
	 */
	#reset(v) {
		const newValue = this.#setValue?.(v)
		const value = newValue === undefined ? v : newValue;
		this.#cancelChange();
		this.#cancelBlur();
		this.#set = true;
		if (!value || typeof value !== 'object') {
			for (const [, field] of this) {
				field.#reset(null);
			}
			this.#value.set(value);
			this.#initValue.set(value);
			return value;
		}
		/** @type {*} */
		const newValues = Array.isArray(value) ? [...value] : {...value};
		for (const [key, field] of this) {
			newValues[key] = field.#reset(newValues[key]);
		}
		this.#value.set(newValues);
		this.#initValue.set(newValues);
		return newValues;
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
	/**
	 * 
	 * @overload
	 * @param {null} [path]
	 * @returns {Promise<string[] | null>}
	 */
	/**
	 * @overload
	 * @param {(string | number)[]} path 
	 * @returns {Promise<{ path: (string | number)[]; store: Store; errors: string[]}[]>}
	 */
	/**
	 * 
	 * @param {(string | number)[]?} [path] 
	 * @returns {Promise<string[] | { path: (string | number)[]; store: Store; errors: string[] | null;}[] | null>}
	 */
	validate(path) {
		if (!Array.isArray(path)) {
			return Promise.all([this.#validatorResult.get(), this.#changed(), this.#blurred()])
				.then(v => {
					const errors = v.flat();
					return errors.length ? errors : null
				});
		}
		const list = [this.validate().then(errors => {
			if (!errors?.length) {return [];}
			return [{path: [...path], store: /** @type {Store} */(this), errors}]
		})];
		for (const [key, field] of this) {
			list.push(field.validate([...path, key]))
		}
		return Promise.all(list).then(v => v.flat())
	}
}
