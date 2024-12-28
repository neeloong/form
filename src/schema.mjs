import EventEmitter from './EventEmitter.mjs';

/**
 * @template T
 */
export class Schema extends EventEmitter {
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {object} options 
	 * @param {boolean} [options.new] 
	 */
	static create(schema, { new: isNew }) {
		return new SchemaObject({attrs: schema}, null, { new: isNew });
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
	 * @param {(value: any) => void} [onUpdate] 
	 */
	constructor(schema, options, onUpdate) {
		super();
		this.schema = schema;
		this.#onUpdate = onUpdate || null;
		const { parent } = options;
		if (parent instanceof Schema) {
			this.#parent = parent;
			this.#root = parent.#root;
			this.#parentNew = Boolean(parent.#new);
			this.#parentHidden = Boolean(parent.#hidden);
			this.#parentDisabled = Boolean(parent.#disabled);
			this.#parentReadonly = Boolean(parent.#readonly);
			// TODO: 事件向上冒泡
		}
		this.#selfNew = Boolean(options.new);
		this.#new = this.#selfNew || this.#parentNew;
		
		this.#selfHidden = typeof options.hidden === 'boolean' ? options.hidden : null;
		this.#scriptHidden = Boolean(options.scriptHidden);
		this.#hidden = this.#parentHidden || this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden;
		
		this.#selfDisabled = typeof options.disabled === 'boolean' ? options.disabled : null;
		this.#scriptDisabled = Boolean(options.scriptDisabled);
		this.#disabled = this.#parentDisabled || this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled;
		
		this.#selfReadonly = typeof options.readonly === 'boolean' ? options.readonly : null;
		this.#scriptReadonly = Boolean(options.scriptReadonly);
		this.#readonly = this.#parentReadonly || this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly;
	}
	/** @type {((value: any) => void)?} */
	#onUpdate
	/** @readonly @type {Schema?} */
	#parent = null;
	/** @readonly @type {Schema} */
	#root = this;
	get parent() { return this.#parent; }
	get root() { return this.#root; }


	#parentNew = false;
	/** @param {boolean} v */
	#setParentNew(v) {
		const val = Boolean(v);
		if (val === this.#parentNew) { return }
		this.#parentNew = val;
		this.#updateNew();
	}
	#selfNew = false;
	get selfNew() { return this.#selfNew}
	set selfNew(v) {
		const val = Boolean(v);
		if (val === this.#selfNew) { return }
		this.#selfNew = val;
		this.#updateNew();
	}
	#new = false;
	#updateNew() {
		const val = this.#parentNew || this.#selfNew;
		if (val === this.#new) { return }
		this.#new = val;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentNew(val);
		}
		this.emit('new', val);
	}
	get new() {return this.#new; }
	set new(v) { this.selfNew = v; }


	#parentHidden = false;
	/** @param {boolean} v */
	#setParentHidden(v) {
		const hidden = Boolean(v);
		if (hidden === this.#parentHidden) { return }
		this.#parentHidden = hidden;
		this.#updateHidden();
	}
	#scriptHidden = false;
	/** @type {boolean?} */
	#selfHidden = null;
	get selfHidden() { return this.#selfHidden}
	set selfHidden(v) {
		const val = v === null ? v : Boolean(v);
		if (val === this.#selfHidden) { return }
		this.#selfHidden = val;
		this.#updateHidden();
	}
	#hidden = false;
	#updateHidden() {
		const hidden = this.#parentHidden || (this.#selfHidden === null ? this.#scriptHidden : this.#selfHidden);
		if (hidden === this.#hidden) { return }
		this.#hidden = hidden;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentHidden(hidden);
		}
		this.emit('hidden', hidden);
	}
	get hidden() {return this.#hidden; }
	set hidden(v) { this.selfHidden = v; }



	#parentDisabled = false;
	/** @param {boolean} v */
	#setParentDisabled(v) {
		const disabled = Boolean(v);
		if (disabled === this.#parentDisabled) { return }
		this.#parentDisabled = disabled;
		this.#updateDisabled();
	}
	#scriptDisabled = false;
	/** @type {boolean?} */
	#selfDisabled = null;
	get selfDisabled() { return this.#selfDisabled}
	set selfDisabled(v) {
		const val = v === null ? v : Boolean(v);
		if (val === this.#selfDisabled) { return }
		this.#selfDisabled = val;
		this.#updateDisabled();
	}
	#disabled = false;
	#updateDisabled() {
		const disabled = this.#parentDisabled || (this.#selfDisabled === null ? this.#scriptDisabled : this.#selfDisabled);
		if (disabled === this.#disabled) { return }
		this.#disabled = disabled;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentDisabled(disabled);
		}
		this.emit('disabled', disabled);
	}
	get disabled() {return this.#disabled; }
	set disabled(v) { this.selfDisabled = v; }

	#parentReadonly = false;
	/** @param {boolean} v */
	#setParentReadonly(v) {
		const readonly = Boolean(v);
		if (readonly === this.#parentReadonly) { return }
		this.#parentReadonly = readonly;
		this.#updateReadonly();
	}
	#scriptReadonly = false;
	/** @type {boolean?} */
	#selfReadonly = null;
	get selfReadonly() { return this.#selfReadonly; }
	set selfReadonly(v) {
		const val = v === null ? v : Boolean(v);
		if (this.#selfReadonly === val) { return; }
		this.#updateReadonly();
	}
	#readonly = false;
	#updateReadonly() {
		const readonly = this.#parentReadonly || (this.#selfReadonly === null ? this.#scriptReadonly : this.#selfReadonly);
		if (readonly === this.#readonly) { return }
		this.#readonly = readonly;
		for (const [, field] of this[Symbol.iterator]()) {
			field.#setParentReadonly(readonly);
		}
		this.emit('readonly', readonly);
	}
	get readonly() {return this.#readonly; }
	set readonly(v) { this.selfReadonly = v; }




	/** @returns {Iterable<[key: string | number, value: Schema]>} */
	*[Symbol.iterator]() {}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Schema?}
	 */
	child(key) { return null; }

	#set = false;
	/** @type {T?} */
	#initValue = null;
	#value = this.#initValue;
	#lastValue = this.#value;


	get changed() { return this.#value === this.#lastValue; }
	get saved() { return this.#value === this.#initValue; }

	get value() { return this.#value; }
	set value(v) {
		if (this.#destroyed) { return; }
		this.#value = v;
		this.#set = true;
		this.#onUpdate?.(this.#value);
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		requestAnimationFrame(() => { this.#runUpdate() });
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
		const readonly = this.#readonly;
		const hidden = this.#hidden;
		const disabled = this.#disabled;
		const val = this.#value;
		if (val && typeof val === 'object') {
			for (const [key, field] of this[Symbol.iterator]()) {
				field.#reset(val[key]);
				field.#setParentReadonly(readonly);
				field.#setParentHidden(hidden);
				field.#setParentDisabled(disabled);
			}
		}
	}

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
		if(this.#value !== value) { return }
		this.#value = value;
		this.#runUpdate();
	}
	#runUpdate() {
		if (this.#destroyed) { return; }
		if (!this.#needUpdate) { return; }
		this.#needUpdate = false;
		const val = this.#value;
		if (val && typeof val === 'object') {
			for (const [key, field] of this[Symbol.iterator]()) {
				field.#toUpdate(val[key]);
			}
		}
		if (this.#lastValue === val) { return; }
		this.#lastValue = val;
		this.emit('update', val);

	}
}



export class SchemaObject extends Schema {
	/** @type {Record<string, Schema>} */
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
	 * @param {Schema?} [parent] 
	 * @param {object} [options] 
	 * @param {boolean} [options.new] 
	 * @param {any} [onUpdate] 
	 */
	constructor(schema, parent, { new: isNew } = {}, onUpdate) {
		super({parent, new: isNew, schema}, onUpdate);
		const children = Object.create(null);
		for (const [key, field] of Object.entries(schema.props)) {
			let child;
			if (typeof field.type === 'string') {
				if (field.array) {
					child = new SchemaArray(field, this, key);
				} else {
					child = new Schema(field, {parent: this}, (value) => {
						this.value = {...this.value, [key]: value};
					});
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
		this.#children = children;
	}
}

export class SchemaTuple extends SchemaObject {
	/**
	 * @param {Schema.Tuple & Schema.Event & Schema.Attr} schema
	*/
	constructor(schema, key, values) {
		super(schema, key, {}, values);
	}
	value = null;
}

export class SchemaArray extends Schema {
	/** @type {Schema[]} */
	#children = [];
	*[Symbol.iterator]() {yield* this.#children.entries();}
	/**
	 * 
	 * @param {string | number} key 
	 * @returns {Schema?}
	 */
	child(key) { return this.#children[key] || null; }
	/**
	 * @param {Record<string, Schema.Field>} schema
	 * @param {object} options 
	 * @param {Schema} [options.parent] 
	 * @param {string} [options.field] 
	 * @param {number} [options.no] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 */
	constructor(schema, parent, onUpdate) {
		super({ parent, schema }, onUpdate);
		this.schema = schema;
	}
	#create() {
		const schema = this.schema;
		if (typeof schema.type === 'string') {
			return new Schema(schema, {parent: this}, (value) => {
				// this.value = {...this.value, [key]: value};
			});
		} else if (Array.isArray(schema.props)) {
			return null;
		}
		return new SchemaObject(schema, this, (value) => {
			// this.value = {...this.value, [key]: value};
		});
	}
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
