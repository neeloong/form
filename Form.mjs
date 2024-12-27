import EventEmitter from './src/EventEmitter.mjs';
import createField from './createField.mjs';


/**
 * 
 * @param {readonly any[]} layouts 
 * @param {import('./types.mjs').FormLike} from
 */
function renderFormLayout(layouts, from) {
	const children = [];
	for (const field of layouts) {
		const fieldHandle = createField(field, { from });
		children.push(fieldHandle);
	}

		return children
}

const s = Symbol();
const modelSymbol = Symbol();
/**
 * @typedef {{[s]: 1}} ModelScriptConfiguration
 */
/**
 * @typedef {{[modelSymbol]: 1}} ModelConfiguration
 */

/**
 * @extends {EventEmitter<import('./types.mjs').FromEvent>}
 */
export default class Form extends EventEmitter {
	/** @readonly @type {import('./types.mjs').FormLike?} */
	parent = null;
	/** @readonly @type {import('./types.mjs').FormLike} */
	root = this;
	/** @readonly @type {ModelScriptConfiguration} */
	define;
	/** @type {boolean} */
	#new = false;
	get new() { return this.#new; }
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
	#parentHidden = false;
	get parentHidden() { return this.#parentHidden}
	set parentHidden(v) {
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
		for (const field of this.fields) {
			field.parentHidden = hidden;
		}
	}

	#readonly = false;
	get readonly() { return this.#readonly; }
	set readonly(value) {
		const readonly = Boolean(value);
		if (this.#readonly === readonly) { return; }
		for (const field of this.allFields) {
			field.commonReadonly = readonly;
		}
	}
	/** @type {ModelConfiguration?} */
	model = null
	/**
	 * 
	 * @param {object} options 
	 * @param {HTMLElement} options.root 
	 * @param {import('./types.mjs').FormLike?} [options.parent] 
	 * @param {ModelScriptConfiguration} options.define 
	 * @param {string} [options.field] 
	 * @param {number} [options.no] 
	 * @param {boolean} [options.new] 
	 * @param {boolean} [options.hidden] 
	 */
	constructor({ root, parent, field, no, hidden, new: isNew, define }) {
		super();
		this.parent = parent || null;
		if (parent instanceof Form) {
			// TODO: 事件向上冒泡
		}
		this.root = parent?.root || this;
		this.define = define;
		if (hidden) {
			this.#selfHidden = true;
			this.#hidden = true;
		}
		if (isNew || parent?.new) {
			this.#new = true;
		}
		if (parent) {
			// TODO: 
		}
		this.field = field || null;
		this.#no = no || 0;
		const layout = define.fields.filter(v => !(v.primary && v.hidden));
		const fieldHandles = renderFormLayout(layout, this)
		this.fields = fieldHandles;
		for (const el of fieldHandles) {
			root.appendChild(el.root);
		}
		if (this.#set) {
			this.#reset();
		}
	}
	#set = false;
	/** @type {Record<string, any>} */
	#initData = {};
	#data = this.#initData;
	#lastData = this.#data;
	get changed() { return this.#data === this.#lastData; }
	get saved() { return this.#data === this.#initData; }
	reset() {
		if (this.#destroyed) { return; }
		if (!this.#set) { return; }
		this.#data = this.#lastData = this.#initData;
		this.#set = true;
		this.#reset();
	}
	/** @type {Record<string, any>} */
	get data() { return this.#data; }
	set data(v) {
		if (this.#destroyed) { return; }
		this.#lastData = this.#data = this.#initData = v;
		this.#set = true;
		this.#reset();
	}
	/**
	 * @param {Record<string, any>} v
	 * @param {boolean} [isNew] 
	 */
	initData(v, isNew = this.#new) {
		if (this.#destroyed) { return; }
		this.#lastData = this.#data = this.#initData = v;
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
			this.#lastData = this.#data = v;
			this.#set = true;
			this.#new = newState;
			this.#reset();
			return;
		}
		if (this.#set) {
			this.#data = v;
			this.#emitUpdate();
			return;
		}
		this.#lastData = this.#data = v;
		this.#set = true;
		this.#reset();
	}

	/** @type {Set<import('./types.mjs').FieldHandle>} */
	addedField = new Set();
	/**
	 * @param {import('../services/model.mjs').FieldScriptConfiguration} field 
	 */
	add(field) {
		if (this.#destroyed) { return; }
		const a = createField(field, {from: this});
		if (this.#set) { a.reset(this.#data); }
		const destroy = a.destroy;
		const added = this.addedField;
		// TODO: 事件
		a.destroy = () => {
			destroy.call(a);
			added.delete(a);
		};
		added.add(a);
		return a;
	}
	/** @type {readonly import('./types.mjs').FieldHandle[]} */
	fields = [];
	#needUpdate = false;
	#destroyed = false;
	destroy() {
		if (this.#destroyed) { return; }
		this.#destroyed = true;
		for (const field of this.allFields) {
			field.destroy();
		}
	}
	get allFields() { return [...this.fields, ...this.addedField]; }
	async verify() {
		// TODO:
		/** @type {import('./types.mjs').VerifyError[]} */
		const error = [];
		for (const field of this.allFields) {
			/** @type {*} */
			let promise
			let done = false;
			field.emit('verify', {
				waitUntil(p) {
					if (promise) { return }
					promise = Promise.reject().then(() => p).catch(() => {});
				},
				error(e) {
					if (done) { return }
					error.push(e)
				}
			});
			if (!promise) {
				promise = Promise.resolve();
			}
			await Promise.resolve().then(() => promise).catch(() => {});
			done = true;
		}
		return error;
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
			for (const field of this.allFields) {
				field.emit('move');
			}
		});
	}
	#updateState() {
		// TODO: 调整权限只读
		const fieldWriteable = new Set();
		// TODO: 只读
		const fieldDisabled = new Set();
		for (const field of this.allFields) {
			field.writeable = fieldWriteable.has(field.name);
			field.disabled = fieldDisabled.has(field.name);
			// TODO: 选项处理
			// TODO: 查询条件处理
		}

	}
	#reset() {
		this.#needUpdate = false;
		this.#lastData = this.#data;
		const readonly = this.#readonly;
		for (const field of this.allFields) {
			field.reset(this.#data);
			field.commonReadonly = readonly;
		}
		this.#updateState();
	}
	#emitUpdate() {
		if (this.#destroyed) { return; }
		if (this.#needUpdate) { return; }
		this.#needUpdate = true;
		requestAnimationFrame(() => {
			if (this.#destroyed) { return; }
			if (!this.#needUpdate) { return; }
			this.#needUpdate = false;
			for (const field of this.allFields) {
				field.update(this.#data);
			}
			this.#updateState();
			if (this.#lastData === this.#data) { return; }
			this.#lastData = this.#data;
			this.emit('update', this.#data);
		});
	}
	/**
	 * 
	 * @param {string} [field] 
	 */
	refresh(field) {
		if (field) {
			for (const component of this.allFields) {
				if (component.name !== field) { continue; }
				component.refresh();
			}
			this.#updateState();
			this.emit('refresh', field);
			return;
		}
		for (const field of this.allFields) {
			field.refresh();
		}
		this.#updateState();
		this.emit('refresh');
	}
	/**
	 * @overload
	 * @param {string} key 
	 * @param {*} value 
	 * @returns {object}
	 */
	/**
	 * 
	 * @overload
	 * @param {object} value 
	 * @returns {object}
	 */
	/**
	 * 
	 * @param {*} key 
	 * @param {*} [value] 
	 * @returns {object}
	 */
	update(key, value) {
		if (this.#destroyed) { return this.#data; }
		const data = !Array.isArray(key) && key && typeof key === 'object'
			? { ...this.#data, ...key }
			: { ...this.#data, [key]: value };
		this.#data = data;
		this.#emitUpdate();
		const { parent, field } = this;
		if (parent && field) {
			const list = parent.data[field] || [];
			if (Array.isArray(list) && list.length) {
				const index = Math.min(this.#no || 1, list.length) - 1;
				const value = [
					...list.slice(0, index),
					data,
					...list.slice(index + 1),
				];
				parent.update(field, value);
				return data;
			}
		}
		return data;
	}
}
