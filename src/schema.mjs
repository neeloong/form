import markChange from './computed/markChange.mjs';
import markRead from './computed/markRead.mjs';
import EventEmitter from './EventEmitter.mjs';
import render from './render/index.mjs';

/**
 * @template [T=any]
 */
export class Schema extends EventEmitter {
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 */
	static create(schema, { new: isNew } = {}) {
		return new SchemaObject({props: schema}, null, { new: isNew });
	}
	/** @type {Schema?} */
	#null = null;
	get null() {
		const v = this.#null;
		if (v) { return v; }
		const val = new Schema({type: null}, {parent: this});
		this.#null = val;
		return val;
	}
	/**
	 * @param {any} schema
	 * @param {object} options 
	 * @param {*} [options.parent] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 * @param {boolean} [options.readonly] 
	 * @param {boolean} [options.disabled] 
	 * @param {boolean} [options.scriptHidden] 
	 * @param {boolean} [options.scriptReadonly] 
	 * @param {boolean} [options.scriptDisabled] 
	 * @param {((value: any) => any)?} [options.setValue] 
	 * @param {((value: any) => any)?} [options.convert] 
	 * @param {((value: T?) => void)?} [options.onUpdate] 
	 */
	constructor(schema, {
		setValue, convert, onUpdate,
		new: isNew, parent: parentNode,
		hidden, disabled, readonly,
		scriptHidden, scriptReadonly, scriptDisabled,
	}) {
		super();
		this.schema = schema;
		this.#onUpdate = onUpdate || null;
		this.#setValue = typeof setValue === 'function' ? setValue : null;
		this.#convert = typeof convert === 'function' ? convert : null;
		const parent = parentNode instanceof Schema ? parentNode : null;
		if (parent) {
			this.#parent = parent;
			this.#root = parent.#root;
			// TODO: 事件向上冒泡
		}
		this.#selfNew = Boolean(isNew);
		this.#new = parent && parent.#new || this.#selfNew

		this.#selfHidden = typeof hidden === 'boolean' ? hidden : null;
		this.#scriptHidden = Boolean(scriptHidden);
		this.#hidden = parent && parent.#hidden || this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden;

		this.#selfDisabled = typeof disabled === 'boolean' ? disabled : null;
		this.#scriptDisabled = Boolean(scriptDisabled);
		this.#disabled = parent && parent.#disabled || this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled;

		this.#selfReadonly = typeof readonly === 'boolean' ? readonly : null;
		this.#scriptReadonly = Boolean(scriptReadonly);
		this.#readonly = parent && parent.#readonly || this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly;
	}
	/** @type {((value: any) => any)?} */
	#setValue
	/** @type {((value: any) => any)?} */
	#convert
	/** @type {((value: any) => void)?} */
	#onUpdate
	/** @readonly @type {Schema?} */
	#parent = null;
	/** @readonly @type {Schema} */
	#root = this;
	get parent() { return this.#parent; }
	get root() { return this.#root; }


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
		for (const [, field] of this[Symbol.iterator]()) {
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
	#updateHidden() {
		const val = this.#parent && this.#parent.hidden || (this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden);
		if (val === this.#hidden) { return }
		this.#hidden = val;
		for (const [, field] of this[Symbol.iterator]()) {
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
	#updateDisabled() {
		const val = this.#parent && this.#parent.disabled || (this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled);
		if (val === this.#disabled) { return }
		this.#disabled = val;
		for (const [, field] of this[Symbol.iterator]()) {
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
	#updateReadonly() {
		const val = this.#parent && this.#parent.readonly || (this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly);
		if (val === this.#readonly) { return }
		this.#readonly = val;
		for (const [, field] of this[Symbol.iterator]()) {
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




	/** @returns {Iterable<[key: string | number, value: Schema]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Schema}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	child(key, must) { return must && this.null || null; }

	#set = false;
	/** @type {T?} */
	#initValue = null;
	#value = this.#initValue;
	#lastValue = this.#value;


	get changed() { return this.#value === this.#lastValue; }
	get saved() { return this.#value === this.#initValue; }

	get value() {
		markRead(this, 'value');
		return this.#value;
	}
	set value(v) {
		if (this.#destroyed) { return; }
		const val = this.#setValue?.(v) || v;
		this.#value = val;
		this.#set = true;
		this.#onUpdate?.(this.#value);
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		requestAnimationFrame(() => {
			this.#runUpdate();
			markChange(this, 'value');
		});
	}

	/**
	 * @param {T} v
	 * @param {boolean} [isNew] 
	 */
	reset(v, isNew = this.#new) {
		if (this.#destroyed) { return; }
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
		if (this.#destroyed || !this.#set) { return; }
		this.#value = this.#lastValue = this.#initValue = v;
		this.#set = true;
		this.#needUpdate = false;
		this.#lastValue = this.#value;
		const val = this.#value;
		if (val && typeof val === 'object') {
			for (const [key, field] of this[Symbol.iterator]()) {
				field.#reset(val[key]);
				field.#updateHidden();
				field.#updateDisabled();
				field.#updateReadonly();
			}
		}
		markChange(this, 'value');
	}

	#destroyed = false;
	get destroyed() { return this.#destroyed; }
	destroy() {
		if (this.#destroyed) { return; }
		this.#destroyed = true;
		for (const [, field] of this[Symbol.iterator]()) {
			field.destroy();
		}
	}
	async verify() {
		return Promise.all([...this[Symbol.iterator]()].map(([,field]) => {
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
	#needUpdate = false;
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
		for (const [, field] of this[Symbol.iterator]()) {
			field.refresh();
		}
		this.emit('refresh');
	}
	#toUpdate(value) {
		if (this.#destroyed) { return value; }
		const val = this.#convert?.(value) || value;
		if(this.#value === val) { return val }
		this.#value = val;
		if (!this.#set) {
			this.#set = true;
			this.#initValue = val;
		}
		try {
			return this.#runUpdate(true);
		} finally {
			markChange(this, 'value');
		}
	}
	#runUpdate(force = false) {
		let val = this.#value;
		if (this.#destroyed) { return val; }
		if (!force && !this.#needUpdate) { return val; }
		this.#needUpdate = false;
		if (val && typeof val === 'object') {
			/** @type {T} */
			// @ts-ignore
			let values = Array.isArray(val) ? [...val] : {...val};
			let updated = false;
			for (const [key, field] of this[Symbol.iterator]()) {
				const data = val[key];
				const newData = field.#toUpdate(data);
				if (data !== newData) {
					values[key] = newData;
					updated = true;
				}
			}
			if (updated) {
				val = values;
				this.#value = val;
			}
		}
		if (this.#lastValue === val) { return val; }
		this.#lastValue = val;
		this.emit('update', val);
		return val;
	}
	/**
	 * 
	 * @param {(string | import('./types.mjs').Layout)[]} layouts 
	 * @param {Element} parent 
	 */
	render(layouts, parent, ...args) {
		const next = args.find(v => v instanceof Node) || null;
		const components = args.find(v => typeof v === 'function');
		return render(this, layouts, parent, next, components);
	}
}



export class SchemaObject extends Schema {
	/** @type {Record<string, Schema>} */
	#children
	*[Symbol.iterator]() {yield* Object.entries(this.#children);}
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Schema}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	child(key, must) {
		return this.#children[key] || must && this.null || null;
	}
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {Schema?} [parent] 
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 * @param {(value: any) => void} [options.onUpdate] 
	 */
	constructor(schema, parent, { new: isNew, onUpdate } = {}) {
		super(schema, {
			parent,
			new: isNew,
			onUpdate,
			setValue(v) {
				if (typeof v !== 'object') { return {}; }
				return v;
			},
			convert(v) {
				if (typeof v !== 'object') { return {}; }
				return v;
			},

		});
		const children = Object.create(null);
		for (const [key, field] of Object.entries(schema.props)) {
			let child;
			if (typeof field.type === 'string') {
				if (field.array) {
					child = new SchemaArray(field, this, {new: isNew});
				} else {
					child = new Schema(field, {parent: this, onUpdate: (value) => {
						this.value = {...this.value, [key]: value};
					}});
				}
			} else if (field.array) {
				child = new SchemaArray(field, this, {new: isNew, onUpdate: (value) => {
					this.value = {...this.value, [key]: value};
				}});
			} else {
				child = new SchemaObject(field, this, {new: isNew, onUpdate: (value) => {
					this.value = {...this.value, [key]: value};
				}});
			}
			children[key] = child;
		}
		this.#children = children;
	}
}

/**
 * @template [T=any]
 * @extends {Schema<(T | null)[]>}
 */
export class SchemaArray extends Schema {
	/** @type {(index: number) => {index: number, value: Schema}} */
	#create = () => {throw new Error}
	/** @type {{index: number, value: Schema}[]} */
	#children = [];
	get children() {
		markRead(this, 'children');
		return this.#children.map(v => v.value);
	}
	*[Symbol.iterator]() {
		for (const [k, {value}] of this.#children.entries()) {
			yield /** @type {[number, Schema]} */([k, value]);
		}
	}
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {true} must
	 * @returns {Schema}
	 */
	/**
	 * 
	 * @overload
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	/**
	 * 
	 * @param {string | number} key 
	 * @param {boolean?} [must]
	 * @returns {Schema?}
	 */
	child(key, must) {
		const children = this.#children;
		if (typeof key === 'number' && key < 0) {
			return children[children.length + key]?.value || must && this.null || null;
		}
		return children[Number(key)]?.value || must && this.null || null;
	}
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {Schema} parent
	 * @param {object} options 
	 * @param {boolean} [options.new] 
	 * @param {(value: any) => void} [options.onUpdate] 
	 */
	constructor(schema, parent, { new: isNew, onUpdate}) {
		const updateChildren = (list) => {
			if (this.destroyed) { return; }
			const length = Array.isArray(list) && list.length || 0;
			const children = this.#children;
			const oldLength = children.length;
			for (let i = children.length; i < length; i++) {
					children.push(this.#create(i));
			}
			for (const {value} of children.splice(length)) {
				value.destroy();
			}
			if (oldLength !== length) {
				markChange(this, 'children');
			}

		}
		super(schema, {
			parent,
			new: isNew,
			setValue(v) { return Array.isArray(v) ? v : v == null ? [] : [v] },
			convert(v) {
				const val = Array.isArray(v) ? v : v == null ? [] : [v];
				updateChildren(val);
				return val;
			},
			onUpdate:(value) => {
				onUpdate?.(value);
				updateChildren(value);
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
			this.#create = index => ({
				get index() { return index},
				set index(i) { index = i},
				value: new Schema(schema, {parent: this, onUpdate: (value) => childUpdated(value, index) }),
			});
		} else if (!Array.isArray(schema.props)) {
			this.#create = index => ({
				get index() { return index},
				set index(i) { index = i},
				value: new SchemaObject(schema, this, {onUpdate: (value) => childUpdated(value, index)}),
			})
		} else {
			throw new Error();
		}
		
	}
	insert(index, value) {
		if (this.destroyed) { return false; }
		const data = this.value;
		if (!Array.isArray(data)) { return false; }
		const children = this.#children;
		const insertIndex = Math.max(0, Math.min(Math.floor(index), children.length));
		const item = this.#create(insertIndex);
		item.value.new = true;
		children.splice(insertIndex, 0, item);
		for (let i = index + 1; i < children.length; i++) {
			children[i].index = i;
		}
		let val = [...data];
		val.splice(insertIndex, 0, value);
		this.value = val;
		markChange(this, 'children');
		return true;
	}
	add(value) {
		return this.insert(this.#children.length, value);
	}
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
		markChange(this, 'children');
		return value;

	}
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
/**
 * @typedef {(Schema.Object | Schema.Type) & Schema.Event & Schema.Attr} Schema.Field
 */
/**
 * @typedef {object} Schema.Value
 * @property {string} label
 * @property {string | number} value
 */
/**
 * @typedef {object} Schema.Value.Group
 * @property {string} label
 * @property {string | number} [value]
 * @property {(Schema.Value.Group | Schema.Value | string | number)[]} children
 */
/**
 * @typedef {object} Schema.Object
 * @property {null} [type]
 * @property {Record<string, Schema.Field>} props
 * @property {boolean} [array] 
 * @property {any} [meta]
 */
/**
 * @typedef {object} Schema.Type
 * @property {string} type
 * @property {null} [props]
 * @property {boolean} [array] 
 * @property {any} [meta]
 */

/**
 * @typedef {object} Schema.Event
 * @property {any} change
 * @property {any} input
 * @property {any} click
 * @property {any} focus
 * @property {any} blur
 * @property {((document: any, form: import('../types.mjs').FormLike, ...fields: (string | number)[]) => void)?} [input]
 * @property {((document: any, form: import('../types.mjs').FormLike, ...fields: (string | number)[]) => void)?} [change]
 * @property {((document: any, form: import('../types.mjs').FormLike) => void)?} [beforeCreate]
 * @property {((document: any, form: import('../types.mjs').FormLike) => void)?} [beforeUpdate]
 * @property {((document: any, form: import('../types.mjs').FormLike) => void)?} [beforeSave]
 * @property {((document: any, form: import('../types.mjs').FormLike) => void)?} [beforeDestroy]
 * @property {((document: any, form: import('../types.mjs').FormLike) => void)?} [beforeUpsert]
 * 
 * @property {((value: any, oldValue: any, document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [input]
 * @property {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [change]
 * @property {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [click]
 * @property {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [focus]
 * @property {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [blur]
 * 
 * @property {((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void | object)?} [add]
 * @property {((value: any[], document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [remove]
 * @property {((from: number[], to: number, document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => void)?} [move]
 */
/**
 * @typedef {object} Schema.Attr
 * @typedef {boolean} [immutable]
 * @typedef {boolean} [creatable]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [readonly]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [hidden]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [required]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [disabled]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [clearable]
 * @property {any} [default] 默认值
 * @property {(Schema.Value.Group | Schema.Value | string | number)[]} values 可选值
 * @property {string} [label] 字段标签
 * @property {string} [description] 字段描述
 * @property {number} [min] 日期、时间、数字的最小值
 * @property {number} [max] 日期、时间、数字的最大值
 * @property {number} [step] 日期、时间、数字的步长
 * @property {number} [decimalDigits]
 * @property {RegExp} [regex] 字符串验证正则
 * @property {Filter[] | ((row: any, rowState: any, data: any, state: any) => Filter[])} [queryOptions]
 * @property {object | ((row: any, rowState: any, data: any, state: any) => object)} [findOptions]
 * 
 * @property {(data: any, state: any) => boolean} [addable] 对于数组，是否支持增加
 * @property {(data: any, state: any) => boolean} [deletable] 对于数组，是否支持删除
 * // TODO: 数组最小数量
 * // TODO: 数组最大数量
 * // TODO: 最小值、最大值、步长增加函数支持
 * 
 * 
 * @property {boolean} [nullable] 是否可为空
 * 
 * 
 * @property {Record<string, string>} [fieldMap]
 * @property {Record<string, any>} [fieldValues]
 * @property {string} [noField]
 * 
 * @property {string[]} [models]
 * @property {string} [model]
 * 
 * @property {string} [field]
 * @property {string[]} [fields]
 * 
 * @property {(number | bigint)[]} [workspaces]
 * 
 * @property {(number | bigint)[]} [roles]
 * @property {(number | bigint)[]} [users]
 * @property {(number | bigint)[]} [userGroups]
 * 
 * @property {(number | bigint)[]} [workgroups]
 * @property {(number | bigint)[]} [workgroupAncestors]
 * @property {(number | string)[]} [workgroupAncestorFields]
 * @property {(number | bigint)[]} [workgroupDescendants]
 * @property {(number | string)[]} [workgroupDescendantFields]
 * 
 * @property {string} [optionConstraintScript]
 * 
 * 
 * @property {string} [label]
 * @property {string} [description]
 * @property {string} [options]
 * 
 * @property {boolean} [translatable]
 * 
 * @property {boolean} [ignorePermissions]
 */
