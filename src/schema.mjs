import EventEmitter from './EventEmitter.mjs';

export class Schema extends EventEmitter {
	/**
	 * @param {object} options 
	 * @param {HTMLElement} options.root 
	 * @param {Schema} [options.parent] 
	 * @param {string} [options.field] 
	 * @param {number} [options.no] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 * @param {(value: any) => void} [onUpdate] 
	 */
	constructor({ parent, hidden, new: isNew }, onUpdate) {
		super();
		this.parent = parent || null;
		if (parent instanceof Schema) {
			// TODO: 事件向上冒泡
		}
		this.root = parent?.root || this;
		if (isNew || parent?.new) {
			this.#new = true;
		}
		if (parent) {
			// TODO: 
		}
		if (hidden) {
			this.#selfHidden = true;
			this.#hidden = true;
		}
		this.#onUpdate = onUpdate || null;
	}
	/** @type {((value: any) => void)?} */
	#onUpdate
	/** @readonly @type {Schema?} */
	parent = null;
	/** @readonly @type {Schema} */
	root = this;
	/** @type {boolean} */
	#new = false;
	get new() { return this.#new; }
	#parentHidden = false;
	/** @param {boolean} v */
	#setParentHidden(v) {
		const hidden = Boolean(v);
		if (hidden === this.#parentHidden) { return }
		this.#parentHidden = hidden;
		this.#updateHidden();
	}
	#selfHidden = false;
	get hidden() { return this.#selfHidden}
	set hidden(v) {
		const hidden = Boolean(v);
		if (hidden === this.#selfHidden) { return }
		this.#selfHidden = hidden;
		this.#updateHidden();
	}
	#hidden = false;
	#updateHidden() {
		const hidden = this.#parentHidden || this.#selfHidden;
		if (hidden === this.#hidden) { return }
		this.#hidden = hidden;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentHidden(hidden);
		}
		this.emit('hidden', hidden);
	}

	#parentReadonly = false;
	/** @param {boolean} v */
	#setParentReadonly(v) {
		const readonly = Boolean(v);
		if (readonly === this.#parentReadonly) { return }
		this.#parentReadonly = readonly;
		this.#updateReadonly();
	}
	#selfReadonly = false;
	get readonly() { return this.#selfReadonly; }
	set readonly(value) {
		const readonly = Boolean(value);
		if (this.#selfReadonly === readonly) { return; }
		this.#updateReadonly();
	}
	#readonly = false;
	#updateReadonly() {
		const readonly = this.#parentReadonly || this.#selfReadonly;
		if (readonly === this.#readonly) { return }
		this.#readonly = readonly;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentReadonly(readonly);
		}
		this.emit('readonly', readonly);
	}



	#parentWritable = false;
	/** @param {boolean} v */
	#setParentWritable(v) {
		const writable = Boolean(v);
		if (writable === this.#parentWritable) { return }
		this.#parentWritable = writable;
		this.#updateWritable();
	}
	#selfWritable = false;
	get writable() { return this.#selfWritable}
	set writable(v) {
		const writable = Boolean(v);
		if (writable === this.#selfWritable) { return }
		this.#selfWritable = writable;
		this.#updateWritable();
	}
	#writable = false;
	#updateWritable() {
		const writable = this.#parentWritable || this.#selfWritable;
		if (writable === this.#writable) { return }
		this.#writable = writable;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentWritable(writable);
		}
		this.emit('writable', writable);
	}




	#parentDisabled = false;
	/** @param {boolean} v */
	#setParentDisabled(v) {
		const disabled = Boolean(v);
		if (disabled === this.#parentDisabled) { return }
		this.#parentDisabled = disabled;
		this.#updateDisabled();
	}
	#selfDisabled = false;
	get disabled() { return this.#selfDisabled}
	set disabled(v) {
		const disabled = Boolean(v);
		if (disabled === this.#selfDisabled) { return }
		this.#selfDisabled = disabled;
		this.#updateDisabled();
	}
	#disabled = false;
	#updateDisabled() {
		const disabled = this.#parentDisabled || this.#selfDisabled;
		if (disabled === this.#disabled) { return }
		this.#disabled = disabled;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentDisabled(disabled);
		}
		this.emit('disabled', disabled);
	}
	/** @returns {Iterable<[key: string, value: Schema]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Schema?}
	 */
	child(key) { return null; }

	#set = false;
	/** @type {any} */
	#initValue = null;
	#value = this.#initValue;
	#lastValue = this.#value;
	get changed() { return this.#value === this.#lastValue; }
	get saved() { return this.#value === this.#initValue; }


	reset() { this.#_reset(this.#initValue); }
	#_reset(value) {
		if (this.#destroyed) { return; }
		if (!this.#set) { return; }
		this.#value = this.#lastValue = this.#initValue = value;
		this.#set = true;
		this.#reset();
	}
	/** @type {Record<string, any>} */
	get value() { return this.#value; }
	set value(v) {
		if (this.#destroyed) { return; }
		if (this.parent) {
			this.#value = v;
			this.#updated();
		} else {
			this.#lastValue = this.#value = this.#initValue = v;
			this.#set = true;
			this.#reset();
		}
	}
	/**
	 * @param {Record<string, any>} v
	 * @param {boolean} [isNew] 
	 */
	initData(v, isNew = this.#new) {
		if (this.#destroyed) { return; }
		this.#lastValue = this.#value = this.#initValue = v;
		this.#set = true;
		this.#new = Boolean(this.parent?.new || isNew);
		this.#reset();
	}
	/**
	 * @param {Record<string, any>} v
	 * @param {boolean} [isNew] 
	 */
	updateData(v, isNew = this.#new) {
		if (this.#destroyed) { return; }
		const newState = Boolean(this.parent?.new || isNew);
		if (newState !== this.#new) {
			this.#lastValue = this.#value = v;
			this.#set = true;
			this.#new = newState;
			this.#reset();
			return;
		}
		if (this.#set) {
			this.#value = v;
			this.#emitUpdate();
			return;
		}
		this.#lastValue = this.#value = v;
		this.#set = true;
		this.#reset();
	}

	#needUpdate = false;
	#destroyed = false;
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
	#needMove = false;
	move() {
		if (this.#destroyed) { return; }
		if (this.#needMove) { return; }
		this.#needMove = true;
		requestAnimationFrame(() => {
			if (this.#destroyed) { return; }
			if (!this.#needMove) { return; }
			this.#needMove = false;
			for (const [, field] of this[Symbol.iterator]()) {
				field.emit('move');
			}
		});
	}
	#updateState() {
		// TODO: 调整权限只读
		const fieldWriteable = new Set();
		// TODO: 只读
		const fieldDisabled = new Set();
		for (const [, field] of this[Symbol.iterator]()) {
			field.writeable = fieldWriteable.has(field.name);
			field.disabled = fieldDisabled.has(field.name);
			// TODO: 选项处理
			// TODO: 查询条件处理
		}

	}
	#reset() {
		this.#needUpdate = false;
		this.#lastValue = this.#value;
		const readonly = this.#readonly;
		const hidden = this.#hidden;
		const writable = this.#writable;
		const disabled = this.#disabled;
		const value = this.#value;
		for (const [key, field] of this[Symbol.iterator]()) {
			field.#_reset(value[key]);
			field.#setParentReadonly(readonly);
			field.#setParentHidden(hidden);
			field.#setParentWritable(writable);
			field.#setParentDisabled(disabled);
		}
	}
	#emitUpdate() {
		if (this.#destroyed) { return; }
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		requestAnimationFrame(() => {
			if (this.#destroyed) { return; }
			if (!this.#needUpdate) { return; }
			this.#needUpdate = false;
			for (const [key, field] of this[Symbol.iterator]()) {
				field.#update(this.#value[key]);
			}
			if (this.#lastValue === this.#value) { return; }
			this.#lastValue = this.#value;
			this.emit('update', this.#value);
		});
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
		for (const [, field] of this[Symbol.iterator]()) {
			field.refresh();
		}
		this.emit('refresh');
	}
	#updated() {
		this.#emitUpdate();
		this.#onUpdate?.(this.#value);
	}
	#update(value) {
		if(this.#value !== value) { return }
		this.#value = value;
		this.#updated();

	}
}
export class SchemaRoot extends Schema {
	/** @readonly @type {string?} */
	field = null;
	/** @type {number} */
	#no = 0;
	get no() { return this.#no; }
	set no(v) {
		if (this.#no === v) { return; }
		this.#no = v;
		this.move();
	}
	/** @type {Record<string, SchemaRoot>} */
	#children
	*[Symbol.iterator]() {yield* Object.entries(this.#children);}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Schema?}
	 */
	child(key) { return this.#children[key] || null; }
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {Record<string, any>} values
	 * @param {object} options 
	 * @param {HTMLElement} options.root 
	 * @param {SchemaRoot} [options.parent] 
	 * @param {string} [options.field] 
	 * @param {number} [options.no] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 */
	constructor(schema, values, { root, parent, hidden, new: isNew }) {
		super({ root, parent, hidden, new: isNew });
		const children = Object.create(null);
		for (const [key, field] of Object.entries(schema)) {
			let child;
			if (typeof field.type === 'string') {
				if (field.array) {
					child = new SchemaArray(field, key, this);
				} else {
					child = new SchemaValue(field, key, this);
				}
			} else if (Array.isArray(field.props)) {
				child = new SchemaTuple(field, key, this);
			} else if (field.array) {
				child = new SchemaArray(field, key, this);
			} else {
				child = new SchemaObject(field, key, this);
			}
			children[key] = child;
		}
		for (const [,el] of Object.entries(children)) {
			root.appendChild(el.root);
		}
		this.#children = Object.freeze(children);
	}

}

export class SchemaObject {
	/**
	 * @param {Schema.Object & Schema.Event & Schema.Attr} schema
	*/
	constructor(schema, key, values) {
	}
	value = null;
}



export class SchemaTuple extends SchemaObject {
	/**
	 * @param {Schema.Tuple & Schema.Event & Schema.Attr} schema
	*/
	constructor(schema, key, values) {
		super(schema, key, values);
	}
	value = null;
}

export class SchemaValue {
	/**
	 * @param {Schema.Type & Schema.Event & Schema.Attr} schema
	*/
	constructor(schema, key,  values) {
	}
	value = null;
}

export class SchemaArray {
	/**
	 * @param {Schema.Field} schema
	*/
	constructor(schema, key,  values) {
	}
	value = null;
}
/**
 * @typedef {(Schema.Object | Schema.Tuple | Schema.Type) & Schema.Event & Schema.Attr} Schema.Field
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
 * @typedef {object} Schema.Tuple
 * @property {null} [type]
 * @property {Schema.Field[]} props
 * @property {false} [array] 
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
 * @typedef {boolean | (() => boolean)} [immutable]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [readonly]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [hidden]
 * @property {boolean | ((document: any, form: import('../types.mjs').FormLike, field: string, ...fields: (string | number)[]) => boolean)?} [required]
 * @property {boolean | ((row: any, rowState: any, data: any, state: any) => boolean)} [clearable]
 * @property {boolean | ((row: any, rowState: any, data: any, state: any) => boolean)} [disabled]
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
 * @property {boolean} nullable 是否可为空
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
