import EventEmitter from '../EventEmitter.mjs';
import { Signal } from "signal-polyfill";
import { createBooleanStates } from './createBooleanStates.mjs';

/** @import { Schema } from '../types.mjs' */
/**
 * @template [T=any]
 * @extends {EventEmitter<Record<string, any[]>>}
 */
export default class Store extends EventEmitter {
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 */
	static create(schema, options = {}) {
		return new ObjectStore({type: null, props: schema}, { ...options, parent: null });
	}
	#null = false;
	get null() { return this.#null; }
	/**
	 * @param {Schema.Field} schema
	 * @param {object} options 
	 * @param {*} [options.parent] 
	 * @param {*} [options.state] 
	 * @param {number | string | null} [options.index] 
	 * @param {number} [options.length] 
	 * @param {boolean} [options.null] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 * @param {boolean} [options.clearable] 
	 * @param {boolean} [options.required] 
	 * @param {boolean} [options.readonly] 
	 * @param {boolean} [options.disabled] 
	 * @param {((value: any) => any)?} [options.setValue] 
	 * @param {((value: any) => any)?} [options.setState] 
	 * @param {((value: any, state: any) => [value: any, state: any])?} [options.convert] 
	 * @param {((value: T?, index: any) => void)?} [options.onUpdate] 
	 * @param {((value: T?, index: any) => void)?} [options.onUpdateState] 
	 */
	constructor(schema, {
		null: isNull, state,
		setValue, setState, convert, onUpdate, onUpdateState,
		index, length, new: isNew, parent: parentNode,
		hidden, clearable, required, disabled, readonly,
	}) {
		super();
		this.schema = schema;
		this.#stateSignal.set(typeof state === 'object' && state || {});
		const parent = parentNode instanceof Store ? parentNode : null;
		if (parent) {
			this.#parent = parent;
			this.#root = parent.#root;
			// TODO: 事件向上冒泡
		}

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
		this.#editable = new Signal.Computed(() => newState.get() ? creatable : !immutable);

		[this.#selfHidden, this.#hidden] = createBooleanStates(this, hidden, schema.hidden, parent ? parent.#hidden : null);
		[this.#selfClearable, this.#clearable] = createBooleanStates(this, clearable, schema.clearable, parent ? parent.#clearable : null);
		[this.#selfRequired, this.#required] = createBooleanStates(this, required, schema.required, parent ? parent.#required : null);
		[this.#selfDisabled, this.#disabled] = createBooleanStates(this, disabled, schema.disabled, parent ? parent.#disabled : null);
		[this.#selfReadonly, this.#readonly] = createBooleanStates(this, readonly, schema.readonly, parent ? parent.#readonly : null);

		if (isNull) {
			this.#null = true;
			return;
		}
		this.#onUpdate = onUpdate || null;
		this.#onUpdateState = onUpdateState || null;
		this.#setValue = typeof setValue === 'function' ? setValue : null;
		this.#setState = typeof setState === 'function' ? setState : null;
		this.#convert = typeof convert === 'function' ? convert : null;
		this.#length.set(length || 0);
		this.#index.set(index ?? '');

	}
	#destroyed = false;
	/** @type {((value: any) => any)?} */
	#setValue = null
	/** @type {((value: any) => any)?} */
	#setState = null
	/** @type {((value: any, state: any) => [value: any, state: any])?} */
	#convert = null
	/** @type {((value: any, index: any) => void)?} */
	#onUpdate = null
	/** @type {((value: any, index: any) => void)?} */
	#onUpdateState = null
	/** @readonly @type {Store?} */
	#parent = null;
	/** @readonly @type {Store} */
	#root = this;
	get parent() { return this.#parent; }
	get root() { return this.#root; }

	#length = new Signal.State(0);
	get length() { return this.#length.get(); }
	set length(v) { this.#length.set(v); }
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
	/** @readonly @type {Signal.Computed<boolean>} */
	#editable
	get selfNew() { return this.#selfNew.get(); }
	set selfNew(v) { this.#selfNew.set(Boolean(v)); }
	get new() { return this.#new.get(); }
	set new(v) { this.#selfNew.set(Boolean(v)); }
	get editable() { return this.#editable.get(); }

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





	/** @returns {IterableIterator<[key: string | number, value: Store]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) { return null; }

	#set = false;
	/** @type {T?} */
	#initValue = null;
	#lastValue = this.#initValue;
	#valueSignal = new Signal.State(this.#initValue);

	
	#stateSignal = new Signal.State(/** @type {any} */(null));
	#lastState = this.#stateSignal.get();


	get changed() { return this.#valueSignal.get() === this.#lastValue; }
	get saved() { return this.#valueSignal.get() === this.#initValue; }

	get value() { return this.#valueSignal.get(); }
	set value(v) {
		if (this.#destroyed) { return; }
		const val = this.#setValue?.(v) || v;
		this.#valueSignal.set(val);
		if (!this.#set) {
			this.#set = true;
			this.#initValue = v;
		}
		this.#onUpdate?.(this.#valueSignal.get(), this.#index.get());
		this.#requestUpdate();
	}

	get state() { return this.#stateSignal.get(); }
	set state(v) {
		if (this.#destroyed) { return; }
		const sta = this.#setState?.(v) || v;
		this.#stateSignal.set(sta);
		this.#set = true;
		this.#onUpdateState?.(this.#stateSignal.get(), this.#index.get());
		this.#requestUpdate();
	}
	#requestUpdate() {
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		queueMicrotask(() => {
			const oldValue = this.#valueSignal.get();
			const oldState = this.#stateSignal.get();
			return this.#runUpdate(oldValue, oldState);
		});
	}


	#needUpdate = false;
	/**
	 * 
	 * @param {T} value 
	 * @param {*} state 
	 * @returns 
	 */
	#toUpdate(value, state) {
		if (this.#destroyed) { return value; }
		const [val,sta] = this.#convert?.(value, state) || [value, state];
		if(this.#valueSignal.get() === val && this.#stateSignal.get() === sta) { return [val,sta] }
		this.#valueSignal.set(val);
		this.#stateSignal.set(sta);
		if (!this.#set) {
			this.#set = true;
			this.#initValue = val;
		}
		return this.#runUpdate(val, sta);
	}
	/**
	 * 
	 * @param {*} val 
	 * @param {*} sta 
	 * @returns 
	 */
	#runUpdate(val, sta) {
		if (this.#destroyed) { return [val, sta]; }
		this.#needUpdate = false;
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
				this.#valueSignal.set(val);
				this.#stateSignal.set(newStates);
			}
		}
		if (this.#lastValue === val && this.#lastState === sta) {
			return [val, sta];
		}
		this.#lastValue = val;
		this.#lastState = sta;
		this.emit('update', val, sta);
		return [val, sta];

	}



	get destroyed() { return this.#destroyed; }
	destroy() {
		if (this.#destroyed) { return; }
		this.#destroyed = true;
		for (const [, field] of this) {
			field.destroy();
		}
	}

	/**
	 * @param {T} v
	 */
	reset(v) {
		if (this.#destroyed) { return; }
		if (this.#parent) {
			if (!this.#set) { return; }
			this.#reset(this.#initValue);
		} else if (arguments.length) {
			this.#set = true;
			this.#reset(v);
		} else if (this.#set) {
			this.#reset(this.#initValue);
		}
	}
	/**
	 * @param {T?} v
	 */
	#reset(v) {
		if (this.#destroyed || !this.#set) { return; }
		this.#valueSignal.set(v);
		this.#lastValue = this.#initValue = v;
		this.#set = true;
		this.#needUpdate = false;
		this.#lastValue = this.#valueSignal.get();
		this.#lastState = this.#stateSignal.get();
		const val = this.#valueSignal.get();
		if (val && typeof val === 'object') {
			for (const [key, field] of this) {
				// @ts-ignore
				field.#reset(val[key]);
			}
		}
	}

	async verify() {
		return Promise.all([...this].map(([,field]) => {
			/** @type {import('../types.mjs').VerifyError[]} */
			const error = [];
			/** @type {*} */
			let promise
			let done = false;
			field.emit('verify', {
				waitUntil(p) {
					if (done) { return }
					if (promise) { return }
					promise = Promise.resolve().then(() => p).catch(() => {});
				},
				error(e) {
					if (done) { return }
					error.push(e)
				}
			});
			return Promise.resolve()
				.then(() => promise)
				.catch(() => {})
				.finally(() => {done = true})
				.then(() => error);
		})).then(v => v.flat());
	}

	/**
	 * 
	 * @param {...string | number | (string | number)[]} fields 
	 */
	refresh(...fields) {
		const allFields = fields.flat()
		if (!allFields.length) {
			for (const [, field] of this) {
				field.refresh();
			}
			this.emit('refresh');
			return;
		}
		const [field, ...newFields] = allFields;
		const child = this.child(field);
		if (!child) { return; }
		child.refresh(allFields);
		this.emit('refresh', newFields);
	}
}



export class ObjectStore extends Store {
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
	 * @param {Schema.Object & Schema.Event & Schema.Attr} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent] 
	 * @param {string | number} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any, index: any) => void} [options.onUpdate] 
	 * @param {(value: any, index: any) => void} [options.onUpdateState] 
	 */
	constructor(schema,{ parent, index, new: isNew, onUpdate, onUpdateState } = {}) {
		super(schema, {
			parent, index, new: isNew, onUpdate, onUpdateState,
			setValue(v) {
				if (typeof v !== 'object') { return {}; }
				return v;
			},
			setState(v) {
				if (typeof v !== 'object') { return {}; }
				return v;
			},
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
			/** @param {*} value @param {*} index */
			onUpdate: (value, index) => {
				this.value = {...this.value, [index]: value};
			},
			/** @param {*} state @param {*} index */
			onUpdateState: (state, index) => {
				this.state = {...this.state, [index]: state};
			}
		}

		for (const [index, field] of Object.entries(schema.props || {})) {
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
				child = new ObjectStore(field, { ...childCommonOptions, index});
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
	#children = new Signal.State(/** @type {Store[]} */([]));
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
	/**
	 * @param {Schema.Field} schema
	 * @param {object} [options] 
	 * @param {Store?} [options.parent]
	 * @param {string | number | null} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any, index: any) => void} [options.onUpdate] 
	 * @param {(value: any, index: any) => void} [options.onUpdateState] 
	 */
	constructor(schema,  { parent, onUpdate, onUpdateState, index, new: isNew} = {}) {
		// @ts-ignore
		const updateChildren = (list) => {
			if (this.destroyed) { return; }
			const length = Array.isArray(list) && list.length || 0;
			const children = [...this.#children.get()];
			const oldLength = children.length;
			for (let i = children.length; i < length; i++) {
					children.push(this.#create(i));
			}
			for (const schema of children.splice(length)) {
				schema.destroy();
			}
			if (oldLength !== length) {
				this.length = children.length;
				this.#children.set(children);
			}

		}
		super(schema, {
			index, new: isNew, parent,
			state: [],
			setValue(v) { return Array.isArray(v) ? v : v == null ? [] : [v] },
			setState(v) { return Array.isArray(v) ? v : v == null ? [] : [v] },
			convert(v, state) {
				const val = Array.isArray(v) ? v : v == null ? [] : [v];
				updateChildren(val);
				return [
					val,
					(Array.isArray(state) ? state : v == null ? [] : [state]),
				];
			},
			onUpdate:(value, index) => {
				updateChildren(value);
				onUpdate?.(value, index);
			},
			onUpdateState,
		});
		const childCommonOptions = {
			parent: this,
			/** @param {*} value @param {*} index */
			onUpdate: (value, index) => {
				const val = [...this.value || []];
				if (val.length < index) {
					val.length = index;
				}
				val[index] = value;
				this.value = val;
			},
			/** @param {*} state @param {*} index */
			onUpdateState: (state, index) => {
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
		} else if (!Array.isArray(schema.props)) {
			this.#create = (index, isNew) =>  {
				const child = new ObjectStore(schema, { ...childCommonOptions, index, new: isNew});
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
	 * @param {T} value 
	 * @param {boolean} [isNew] 
	 * @returns 
	 */
	insert(index, value, isNew) {
		if (this.destroyed) { return false; }
		const data = this.value;
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
		this.value = val;
		this.length = children.length;
		this.#children.set(children);
		return true;
	}
	/**
	 * 
	 * @param {T} value 
	 * @returns 
	 */
	add(value) {
		return this.insert(this.#children.get().length, value);
	}
	/**
	 * 
	 * @param {number} index 
	 * @returns 
	 */
	remove(index) {
		if (this.destroyed) { return; }
		const data = this.value;
		if (!Array.isArray(data)) { return; }
		const children = [...this.#children.get()];
		const removeIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const [item] = children.splice(removeIndex, 1);
		if (!item) { return; }
		for (let i = index; i < children.length; i++) {
			children[i].index = i;
		}
		item.destroy();
		const val = [...data];
		const [value] = val.splice(removeIndex, 1);
		const state = this.state;
		if (Array.isArray(state)) {
			const sta = [...this.state];
			sta.splice(removeIndex, 1);
			this.state = sta;
		}
		this.value = val;
		this.length = children.length;
		this.#children.set(children);
		return value;

	}
	/**
	 * 
	 * @param {number} from 
	 * @param {number} to 
	 * @returns 
	 */
	move(from, to) {
		if (this.destroyed) { return false; }
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
		this.value = val;
		this.#children.set(children);
		return true;

	}
	/**
	 * 
	 * @param {number} a 
	 * @param {number} b 
	 * @returns 
	 */
	exchange(a, b) {
		if (this.destroyed) { return false; }
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
		this.value = val;
		this.#children.set(children);
		return true;
	}
}
