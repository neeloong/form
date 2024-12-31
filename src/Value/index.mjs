import { markChange, markRead } from '../computed/index.mjs';
import EventEmitter from './EventEmitter.mjs';
import runBooleanScript from './runBooleanScript.mjs';
/** @import { Schema } from '../types.mjs' */

/**
 * @template [T=any]
 * @extends {EventEmitter<Record<string, any[]>>}
 */
export default class Value extends EventEmitter {
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 */
	static create(schema, options = {}) {
		return new ObjectValue({type: null, props: schema}, { ...options, parent: null });
	}
	/** @type {Value?} */
	#nullValue = null;
	get nullValue() {
		const v = this.#nullValue;
		if (v) { return v; }
		const val = new Value({type: null}, {parent: this});
		this.#nullValue = val;
		return val;
	}
	#null = false;
	get null() { return this.#null; }
	/**
	 * @param {any} schema
	 * @param {object} options 
	 * @param {*} [options.parent] 
	 * @param {number | string | null} [options.index] 
	 * @param {number} [options.length] 
	 * @param {boolean} [options.null] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 * @param {boolean} [options.readonly] 
	 * @param {boolean} [options.disabled] 
	 * @param {boolean} [options.scriptHidden] 
	 * @param {boolean} [options.scriptReadonly] 
	 * @param {boolean} [options.scriptDisabled] 
	 * @param {((value: any) => any)?} [options.setValue] 
	 * @param {((value: any, state: any) => [value: any, state: any])?} [options.convert] 
	 * @param {((value: T?) => void)?} [options.onUpdate] 
	 * @param {((value: T?) => void)?} [options.onUpdateState] 
	 */
	constructor(schema, {
		null: isNull,
		setValue, convert, onUpdate, onUpdateState,
		index, length, new: isNew, parent: parentNode,
		hidden, disabled, readonly,
		scriptHidden, scriptReadonly, scriptDisabled,
	}) {
		super();
		this.schema = schema;
		const parent = parentNode instanceof Value ? parentNode : null;
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
		this.#convert = typeof convert === 'function' ? convert : null;
		this.#length = length || 0;
		this.#index = index ?? null;
		this.#selfNew = Boolean(isNew);
		this.#new = parent && parent.#new || this.#selfNew;

		this.#selfHidden = typeof hidden === 'boolean' ? hidden : null;
		this.#scriptHidden = runBooleanScript(scriptHidden, destroySet, v => { this.#updateHidden(v); }, this);
		this.#hidden = parent && parent.#hidden || this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden;

		this.#selfDisabled = typeof disabled === 'boolean' ? disabled : null;
		this.#scriptDisabled = runBooleanScript(scriptDisabled, destroySet, v => { this.#updateDisabled(v); }, this);
		this.#disabled = parent && parent.#disabled || this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled;

		this.#selfReadonly = typeof readonly === 'boolean' ? readonly : null;
		this.#scriptReadonly = runBooleanScript(scriptReadonly, destroySet, v => { this.#updateReadonly(v); }, this);
		this.#readonly = parent && parent.#readonly || this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly;
	}
	/** @type {Set<() => void>?} */
	#destroySet
	/** @type {((value: any) => any)?} */
	#setValue = null
	/** @type {((value: any, state: any) => [value: any, state: any])?} */
	#convert = null
	/** @type {((value: any) => void)?} */
	#onUpdate = null
	/** @type {((value: any) => void)?} */
	#onUpdateState = null
	/** @readonly @type {Value?} */
	#parent = null;
	/** @readonly @type {Value} */
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

	#selfNew = false;
	get selfNew() { return this.#selfNew; }
	set selfNew(v) {
		const val = Boolean(v);
		if (val === this.#selfNew) { return }
		this.#selfNew = val;
		this.#updateNew();
	}
	#new = false;
	#updateNew() {
		const val = this.#parent && this.#parent.#new || this.#selfNew;
		if (val === this.#new) { return }
		this.#new = val;
		for (const [, field] of this) {
			field.#updateNew();
		}
		markChange(this, 'new');
		this.emit('new', val);
	}
	get new() {
		markRead(this, 'new');
		return this.#new;
	}
	set new(v) { this.selfNew = v; }


	#scriptHidden = false;
	/** @type {boolean?} */
	#selfHidden = null;
	#hidden = false;
	/**
	 * 
	 * @param {boolean} [v] 
	 * @returns 
	 */
	#updateHidden(v) {
		if (typeof v === 'boolean') {
			if (this.#scriptHidden === v) { return; }
			this.#scriptHidden = v;
		}
		const val = this.#parent && this.#parent.hidden || (this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden);
		if (val === this.#hidden) { return }
		this.#hidden = val;
		for (const [, field] of this) {
			field.#updateHidden();
		}
		markChange(this, 'hidden');
		this.emit('hidden', val);
	}
	get selfHidden() { return this.#selfHidden}
	set selfHidden(v) {
		const val = v === null ? v : Boolean(v);
		if (val === this.#selfHidden) { return }
		this.#selfHidden = val;
		this.#updateHidden();
	}
	get hidden() {
		markRead(this, 'hidden');
		return this.#hidden;
	}
	set hidden(v) { this.selfHidden = v; }



	#scriptDisabled = false;
	/** @type {boolean?} */
	#selfDisabled = null;
	#disabled = false;
	/**
	 * 
	 * @param {boolean} [v] 
	 * @returns 
	 */
	#updateDisabled(v) {
		if (typeof v === 'boolean') {
			if (this.#scriptDisabled === v) { return; }
			this.#scriptDisabled = v;
		}
		const val = this.#parent && this.#parent.disabled || (this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled);
		if (val === this.#disabled) { return }
		this.#disabled = val;
		for (const [, field] of this) {
			field.#updateDisabled();
		}
		markChange(this, 'disabled');
		this.emit('disabled', val);
	}
	get selfDisabled() { return this.#selfDisabled}
	set selfDisabled(v) {
		const val = v === null ? v : Boolean(v);
		if (val === this.#selfDisabled) { return }
		this.#selfDisabled = val;
		this.#updateDisabled();
	}
	get disabled() {
		markRead(this, 'disabled');
		return this.#disabled;
	}
	set disabled(v) { this.selfDisabled = v; }


	#scriptReadonly = false;
	/** @type {boolean?} */
	#selfReadonly = null;
	#readonly = false;
	/**
	 * 
	 * @param {boolean} [v] 
	 * @returns 
	 */
	#updateReadonly(v) {
		if (typeof v === 'boolean') {
			if (this.#scriptReadonly === v) { return; }
			this.#scriptReadonly = v;
		}
		const val = this.#parent && this.#parent.readonly || (this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly);
		if (val === this.#readonly) { return }
		this.#readonly = val;
		for (const [, field] of this) {
			field.#updateReadonly();
		}
		markChange(this, 'readonly');
		this.emit('readonly', val);
	}
	get selfReadonly() { return this.#selfReadonly; }
	set selfReadonly(v) {
		const val = v === null ? v : Boolean(v);
		if (this.#selfReadonly === val) { return; }
		this.#updateReadonly();
	}
	get readonly() {
		markRead(this, 'readonly');
		return this.#readonly;
	}
	set readonly(v) { this.selfReadonly = v; }




	/** @returns {IterableIterator<[key: string | number, value: Value]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Value}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	child(key, must) { return must && this.nullValue || null; }

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
		this.#set = true;
		this.#onUpdate?.(this.#value);
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		if (this.#needUpdateState) { return; }
		requestAnimationFrame(() => { this.#runUpdate(); });
	}

	get state() {
		markRead(this, 'value');
		return this.#state;
	}
	set state(v) {
		if (!this.#destroySet) { return; }
		const val = v;
		this.#state = val;
		this.#set = true;
		this.#onUpdateState?.(this.#state);
		if (this.#needUpdateState) { return; }
		this.#needUpdateState = true;
		if (this.#needUpdate) { return; }
		requestAnimationFrame(() => { this.#runUpdate(); });
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
		this.#value = val;
		this.#state = sta;
		if (!this.#set) {
			this.#set = true;
			this.#initValue = val;
		}
		try {
			return this.#runUpdate(true);
		} finally {
			markChange(this, 'value');
			markChange(this, 'state');
		}
	}
	#runUpdate(force = false) {
		let val = this.#value;
		let states = this.#state;
		if (!this.#destroySet) { return [val, states]; }
		const needUpdate = this.#needUpdate;
		const needUpdateState = this.#needUpdateState;
		if (!force && !needUpdate && !needUpdateState) {
			return [val, states];
		}
		this.#needUpdate = false;
		this.#needUpdateState = false;
		if (val && typeof val === 'object') {
			/** @type {T} */
			// @ts-ignore
			let values = Array.isArray(val) ? [...val] : {...val};
			let newStates = Array.isArray(val) ? Array.isArray(states) ? [...states] : [] : {...states};
			let updated = false;
			for (const [key, field] of this) {
				// @ts-ignore
				const data = val[key];
				const state = states?.[key];
				const [newData, newState] = field.#toUpdate(data, state);
				if (data !== newData) {
					// @ts-ignore
					values[key] = newData;
					updated = true;
				}
				if (state !== newState) {
					newStates[key] = newState;
					updated = true;
				}
			}
			if (updated) {
				val = values;
				states = newStates;
				this.#value = val;
				this.#state = newStates;
			}
		}
		try {

			if (this.#lastValue === val && this.#lastState === states) {
				return [val, states];
			}
			this.#lastValue = val;
			this.#lastState = states;
			this.emit('update', val, states);
			return [val, states];
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
	 * @param {boolean} [isNew] 
	 */
	reset(v, isNew = this.#new) {
		if (!this.#destroySet) { return; }
		if (this.#parent) {
			if (!this.#set) { return; }
			this.#new = Boolean(this.#parent.#new || isNew);
			this.#reset(this.#initValue);
		} else if (arguments.length) {
			this.#set = true;
			this.#new = Boolean(isNew);
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



export class ObjectValue extends Value {
	/** @type {Record<string, Value>} */
	#children
	*[Symbol.iterator]() {yield* Object.entries(this.#children);}
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Value}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	child(key, must) {
		return this.#children[key] || must && this.nullValue || null;
	}
	/**
	 * @param {Schema.Object} schema
	 * @param {object} [options] 
	 * @param {Value?} [options.parent] 
	 * @param {string | number} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any) => void} [options.onUpdate] 
	 */
	constructor(schema,{ ...options } = {}) {
		super(schema, {
			...options,
			setValue(v) {
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
		for (const [index, field] of Object.entries(schema.props)) {
			/** @param {*} value */
			const onUpdate = (value) => {
				this.value = {...this.value, [index]: value};
			}
			let child;
			if (typeof field.type === 'string') {
				if (field.array) {
					child = new ArrayValue(field, {parent: this, index, onUpdate});
				} else {
					child = new Value(field, {parent: this, index, onUpdate});
				}
			} else if (field.array) {
				child = new ArrayValue(field, {parent: this, index, onUpdate});
			} else {
				child = new ObjectValue(field, { parent: this, index, onUpdate});
			}
			children[index] = child;
		}
		this.#children = children;
	}
}

/**
 * @template [T=any]
 * @extends {Value<(T | null)[]>}
 */
export class ArrayValue extends Value {
	/** @type {(index: number) => Value} */
	#create = () => {throw new Error}
	/** @type {Value[]} */
	#children = [];
	get children() {
		markRead(this, 'children');
		return [...this.#children];
	}
	*[Symbol.iterator]() { return yield*[...this.#children.entries()]; }
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Value}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Value?}
	 */
	child(key, must) {
		const children = this.#children;
		if (typeof key === 'number' && key < 0) {
			return children[children.length + key] || must && this.nullValue || null;
		}
		return children[Number(key)] || must && this.nullValue || null;
	}
	/**
	 * @param {Schema.Field} schema
	 * @param {object} [options] 
	 * @param {Value?} [options.parent]
	 * @param {string | number | null} [options.index] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any) => void} [options.onUpdate] 
	 */
	constructor(schema,  { parent, onUpdate, ...options} = {}) {
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
			...options,
			parent,
			setValue(v) { return Array.isArray(v) ? v : v == null ? [] : [v] },
			convert(v, state) {
				const val = Array.isArray(v) ? v : v == null ? [] : [v];
				updateChildren(val);
				return [
					val,
					(Array.isArray(state) ? state : v == null ? [] : [state]),
				];
			},
			onUpdate:(value) => {
				updateChildren(value);
				onUpdate?.(value);
			},
		});
		/**
		 * 
		 * @param {any} value 
		 * @param {number} index 
		 */
		const childUpdated = (value, index) => {
			const val = [...this.value || []];
			if (val.length < index) {
				val.length = index;
			}
			val[index] = value;
			this.value = val;
		}
		if (typeof schema.type === 'string') {
			this.#create = index => {
				const child = new Value(schema, {parent: this, index, onUpdate: (value) => childUpdated(value, index) });;
				child.index = index;
				return child
			}
		} else if (!Array.isArray(schema.props)) {
			this.#create = index =>  {
				const child = new ObjectValue(schema, { parent: this, index, onUpdate: (value) => childUpdated(value, index)});
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
	 * @returns 
	 */
	insert(index, value) {
		if (this.destroyed) { return false; }
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = this.#children;
		const insertIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const item = this.#create(insertIndex);
		item.new = true;
		children.splice(insertIndex, 0, item);
		for (let i = index + 1; i < children.length; i++) {
			children[i].index = i;
		}
		let val = [...data];
		val.splice(insertIndex, 0, value);
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
		const insertIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const [item] = children.splice(insertIndex, 1);
		if (!item) { return; }
		for (let i = index; i < children.length; i++) {
			children[i].index = i;
		}
		item.value.destroy();
		const val = [...data];
		const [value] = val.splice(insertIndex, 1);
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
		this.value = val;
		markChange(this, 'children');
		return true;
	}
}
