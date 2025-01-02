import { markChange, markRead } from '../computed/index.mjs';
import EventEmitter from '../EventEmitter.mjs';
import { BoolStateKeys, stateInParent, stateInScript } from './BoolStateKeys.mjs';
import runBooleanScript from './runBooleanScript.mjs';
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
	 * @param {Partial<Record<BoolStateKeys, boolean?>>} [options.script] 
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
		this.state = typeof state === 'object' && state || {};
		const parent = parentNode instanceof Store ? parentNode : null;
		if (parent) {
			this.#parent = parent;
			this.#root = parent.#root;
			// TODO: 事件向上冒泡
		}
		/** @type {Set<() => void>} */
		const destroySet = new Set();
		this.#destroySet = destroySet;

		if (isNull) {
			this.#null = true;
			return;
		}
		this.#onUpdate = onUpdate || null;
		this.#onUpdateState = onUpdateState || null;
		this.#setValue = typeof setValue === 'function' ? setValue : null;
		this.#setState = typeof setState === 'function' ? setState : null;
		this.#convert = typeof convert === 'function' ? convert : null;
		this.#length = length || 0;
		this.#index = index ?? null;

		this.#selfNew = Boolean(isNew);
		this.#new = parent && parent.#new || this.#selfNew;
		this.#immutable = Boolean(schema.immutable);
		this.#creatable = schema.creatable !== false;
		this.#editable = this.#new ? this.#creatable : !this.#immutable;

		const stateParams = { hidden, clearable, required, disabled, readonly }
		/** @type {Partial<Record<BoolStateKeys, boolean | ((value: Store) => boolean) | null>>} */
		const script = {
			hidden: schema.hidden,
			clearable: schema.clearable,
			required: schema.required,
			disabled: schema.disabled,
			readonly: schema.readonly,
		}
		const selfStates = Object.fromEntries(BoolStateKeys.map(k => [k, typeof stateParams[k] === 'boolean' ? stateParams[k] : null] ));
		this.#selfStates = selfStates;
		const scriptStates = Object.fromEntries(BoolStateKeys.map(k => [k, stateInScript[k] && runBooleanScript(script[k], destroySet, v => { this.#updateStates(k, v); }, this)]));
		this.#scriptStates = scriptStates;
		const states = Object.fromEntries(parent
			? BoolStateKeys.map(k => [k, stateInParent[k] &&parent && parent.#states[k] || selfStates[k] === null ? scriptStates[k] : selfStates[k]])
			: BoolStateKeys.map(k => [k, selfStates[k] === null ? scriptStates[k] : selfStates[k]]));
		this.#states = states;
	}
	/** @type {Set<() => void>?} */
	#destroySet
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

	/** @type {number} */
	#length = 0;
	get length() {
		markRead(this, 'length');
		return this.#length;
	}
	set length(v) {
		const val = v;
		if (val === this.#length) { return }
		this.#length = val;
		markChange(this, 'length');
		this.emit('length', val);
	}
	/** @type {string | number | null} */
	#index = '';
	get index() {
		markRead(this, 'index');
		return this.#index;
	}
	set index(v) {
		const val = v;
		if (val === this.#index) { return }
		this.#index = val;
		markChange(this, 'index');
		this.emit('index', val);
	}
	get no() {
		if (this.#null) { return ''; }
		const index = this.index;
		return typeof index === 'number' ? index + 1 : index;
	}

	#creatable = true;
	#immutable = false;
	#editable = false;
	#selfNew = false;
	#new = false;
	get selfNew() { return this.#selfNew; }
	set selfNew(v) {
		const val = Boolean(v);
		if (val === this.#selfNew) { return }
		this.#selfNew = val;
		this.#updateNew();
	}
	#updateNew() {
		const val = this.#parent && this.#parent.#new || this.#selfNew;
		if (val === this.#new) { return }
		this.#new = val;
		for (const [, field] of this) {
			field.#updateNew();
		}
		const editable = val ? this.#creatable : !this.#immutable;
		if (this.#editable !== editable) {
			this.#editable = editable;
			markChange(this, 'editable');
		}
		markChange(this, 'new');
		this.emit('new', val);
	}
	get new() {
		markRead(this, 'new');
		return this.#new;
	}
	set new(v) { this.selfNew = v; }
	get editable() { return this.#editable; }

	
	/** @type {Record<string, boolean?>} */
	#selfStates = Object.fromEntries(BoolStateKeys.map(k => [k, null]));
	#scriptStates = Object.fromEntries(BoolStateKeys.map(k => [k, false]));
	#states = Object.fromEntries(BoolStateKeys.map(k => [k, false]));
	/**
	 * 
	 * @param {BoolStateKeys} name 
	 * @param {boolean} [v] 
	 * @returns 
	 */
	#updateStates(name, v) {
		if (typeof v === 'boolean') {
			if (this.#scriptStates[name] === v) { return; }
			this.#scriptStates[name] = v;
		}
		const val = stateInParent[name] && this.#parent && this.#parent[name] || (
			stateInScript[name] && this.#selfStates[name] === null
				? this.#scriptStates[name]
				: Boolean(this.#selfStates[name])
		);
		if (val === this.#states[name]) { return }
		this.#states[name] = val;
		for (const [, field] of this) {
			field.#updateStates(name);
		}
		markChange(this, name);
		this.emit(name, val);
	}
	/**
	 * 
	 * @param {BoolStateKeys} name 
	 * @returns {boolean?}
	 */
	#getSelfState(name) { return this.#selfStates[name]}
	/**
	 * 
	 * @param {BoolStateKeys} name 
	 * @param {boolean?} v 
	 * @returns 
	 */
	#setSelfState(name, v) {
		const val = v === null ? v : Boolean(v);
		if (val === this.#selfStates[name]) { return }
		this.#selfStates[name] = val;
		this.#updateStates(name);
	}
	/**
	 * 
	 * @param {BoolStateKeys} name 
	 * @returns {boolean}
	 */
	#getCurrentState(name) { markRead(this, name); return this.#states[name]; }

	get selfHidden() { return this.#getSelfState('hidden'); }
	set selfHidden(v) { this.#setSelfState('hidden', v); }
	get hidden() { return this.#getCurrentState('hidden'); }
	set hidden(v) { this.#setSelfState('hidden', v); }

	get selfClearable() { return this.#getSelfState('clearable'); }
	set selfClearable(v) { this.#setSelfState('clearable', v); }
	get clearable() { return this.#getCurrentState('clearable'); }
	set clearable(v) { this.#setSelfState('clearable', v); }

	get selfRequired() { return this.#getSelfState('required'); }
	set selfRequired(v) { this.#setSelfState('required', v); }
	get required() { return this.#getCurrentState('required'); }
	set required(v) { this.#setSelfState('required', v); }

	get selfDisabled() { return this.#getSelfState('disabled'); }
	set selfDisabled(v) { this.#setSelfState('disabled', v); }
	get disabled() { return this.#getCurrentState('disabled'); }
	set disabled(v) { this.#setSelfState('disabled', v); }

	get selfReadonly() { return this.#getSelfState('readonly'); }
	set selfReadonly(v) { this.#setSelfState('readonly', v); }
	get readonly() { return this.#getCurrentState('readonly'); }
	set readonly(v) { this.#setSelfState('readonly', v); }


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
	#value = this.#initValue;
	#lastValue = this.#value;

	/** @type {any} */
	#state = null;
	#lastState = this.#state;


	get changed() { return this.#value === this.#lastValue; }
	get saved() { return this.#value === this.#initValue; }

	get value() {
		markRead(this, 'value');
		return this.#value;
	}
	set value(v) {
		if (!this.#destroySet) { return; }
		const val = this.#setValue?.(v) || v;
		this.#value = val;
		if (!this.#set) {
			this.#set = true;
			this.#initValue = v;
		}
		this.#onUpdate?.(this.#value, this.#index);
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		if (this.#needUpdateState) { return; }
		this.#requestUpdate();
	}

	get state() {
		markRead(this, 'value');
		return this.#state;
	}
	set state(v) {
		if (!this.#destroySet) { return; }
		const val = this.#setState?.(v) || v;
		this.#state = val;
		this.#set = true;
		this.#onUpdateState?.(this.#index, this.#state);
		if (this.#needUpdateState) { return; }
		this.#needUpdateState = true;
		this.#requestUpdate();
	}
	#requestUpdate() {
		requestAnimationFrame(() => {
			const oldValue = this.#value;
			const oldState = this.#state;
			return this.#runUpdate(oldValue, oldState, true);
		});
	}


	#needUpdate = false;
	#needUpdateState = false;
	/**
	 * 
	 * @param {T} value 
	 * @param {*} state 
	 * @returns 
	 */
	#toUpdate(value, state) {
		if (!this.#destroySet) { return value; }
		const [val,sta] = this.#convert?.(value, state) || [value, state];
		if(this.#value === val && this.#state === sta) { return [val,sta] }
		const oldValue = this.#value;
		const oldState = this.#state;
		this.#value = val;
		this.#state = sta;
		if (!this.#set) {
			this.#set = true;
			this.#initValue = val;
		}
		try {
			return this.#runUpdate(val, sta, true);
		} finally {
			if (oldValue !== this.#value) {
				markChange(this, 'value');
			}
			if (oldState !== this.#state) {
				markChange(this, 'state');
			}
		}
	}
	/**
	 * 
	 * @param {*} val 
	 * @param {*} sta 
	 * @param {boolean} [force] 
	 * @returns 
	 */
	#runUpdate(val, sta, force = false) {
		if (!this.#destroySet) { return [val, sta]; }
		const needUpdate = this.#needUpdate;
		const needUpdateState = this.#needUpdateState;
		if (!force && !needUpdate && !needUpdateState) {
			return [val, sta];
		}
		this.#needUpdate = false;
		this.#needUpdateState = false;
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
				this.#value = val;
				this.#state = newStates;
			}
		}
		try {

			if (this.#lastValue === val && this.#lastState === sta) {
				return [val, sta];
			}
			this.#lastValue = val;
			this.#lastState = sta;
			this.emit('update', val, sta);
			return [val, sta];
		} finally {
			if (needUpdate) { markChange(this, 'value'); }
			if (needUpdateState) { markChange(this, 'state'); }

		}
	}



	get destroyed() { return !this.#destroySet; }
	destroy() {
		if (!this.#destroySet) { return; }
		const set = this.#destroySet;
		this.#destroySet = null;
		for (const f of set) {
			f();
		}
		for (const [, field] of this) {
			field.destroy();
		}
	}

	/**
	 * @param {T} v
	 */
	reset(v) {
		if (!this.#destroySet) { return; }
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
		if (!this.#destroySet || !this.#set) { return; }
		this.#value = this.#lastValue = this.#initValue = v;
		this.#set = true;
		this.#needUpdate = false;
		this.#lastValue = this.#value;
		this.#lastState = this.#state;
		const val = this.#value;
		if (val && typeof val === 'object') {
			for (const [key, field] of this) {
				// @ts-ignore
				field.#reset(val[key]);
			}
		}
		markChange(this, 'value');
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
		if (allFields.length) {
			const fields = [...allFields];
			const field = allFields.unshift();
			const child = this.child(field);
			if (!child) { return; }
			child.refresh(allFields);
			this.emit('refresh', fields);
			return;
		}
		for (const [, field] of this) {
			field.refresh();
		}
		this.emit('refresh');
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
	/** @type {Store[]} */
	#children = [];
	get children() {
		markRead(this, 'children');
		return [...this.#children];
	}
	*[Symbol.iterator]() { return yield*[...this.#children.entries()]; }
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Store?}
	 */
	child(key) {
		const children = this.#children;
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
			const children = this.#children;
			const oldLength = children.length;
			for (let i = children.length; i < length; i++) {
					children.push(this.#create(i));
			}
			for (const schema of children.splice(length)) {
				schema.destroy();
			}
			if (oldLength !== length) {
				this.length = children.length;
				markChange(this, 'children');
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
		const children = this.#children;
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
		markChange(this, 'children');
		return true;
	}
	/**
	 * 
	 * @param {T} value 
	 * @returns 
	 */
	add(value) {
		return this.insert(this.#children.length, value);
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
		const children = this.#children;
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
		markChange(this, 'children');
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
		const children = this.#children;
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
		markChange(this, 'children');
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
		const children = this.#children;
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
		markChange(this, 'children');
		return true;
	}
}
