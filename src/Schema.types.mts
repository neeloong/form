import type { Signal } from 'signal-polyfill';
import type Store from './Store/index.mjs';

export type MaybePromise<T> = PromiseLike<T> | T;

export namespace Schema {
	export type ValidatorResult = string | string[] | void | null;

	/** 同步验证器 */
	export interface SyncValidator {
		/**
		 * @param store 存储体
		 * @returns 错误信息
		 */
		(store: Store): ValidatorResult;
	}

	/** 异步验证器 */
	export interface AsyncValidator {
		/**
		 * 异步验证器
		 * @param store 存储体
		 * @param signal 终止信号
		 * @returns 错误信息
		 */
		(store: Store, signal: AbortSignal): MaybePromise<ValidatorResult>;
	}

	/** 事件验证器 */
	export interface EventValidator {
		event: string | string[];
		validator: AsyncValidator;
	}

	/** 即刻验证器 */
	export interface InstantValidator {
		event?: null;
		validator: SyncValidator;
	}

	export type Validator = InstantValidator | EventValidator | SyncValidator;

	/** 字段定义 */
	export type Field<
		M = any,
		S extends {[k in string & keyof S]: Schema.State} = object,
		L extends { [k in keyof L]: L[k] } =  object,
	> = (Object<M, S, L> | Type) & Attr<M, S, L>;

	export namespace Value {

		/** 可选值定义 */
		export type Define = Value | string | number | {
			/** 标签 */
			label: string;
			/** 值 */
			value?: string | number;
		};

		export namespace Group {
			/** 可选值分组定义 */
			export interface Define {
				/** 标签 */
				label: string;
				/** 值 */
				value?: string | number;
				/** 子数据 */
				children: (Schema.Value.Group | Schema.Value.Define)[];
			}
		}
		/** 可选值分组 */
		export interface Group {
			/** 标签 */
			label: string;
			/** 值 */
			value?: string | number;
			/** 子数据 */
			children: (Group | Value)[];
		}
	}

	/** 可选值 */
	export interface Value {
		/** 标签 */
		label: string;
		/** 值 */
		value: string | number;
	}


	/** 对象类型定义 */
	export interface Object<
		M = any,
		S extends {[k in string & keyof S]: Schema.State} = object,
		L extends { [k in keyof L]: L[k] } =  object,
	> {
		/** 字段定义 */
		type: Record<string, Field<M, S, L>>;
		/** 是否为数组 */
		array?: boolean;
	}

	/** 基本类型字段定义 */
	export interface Type {
		/** 类型 */
		type: string;
		/** 是否为数组 */
		array?: boolean;
	}

	/** 函数定义 */
	export interface Events {
		/** 输入 */
		input: InputEvent;
		/** 变化 */
		change: InputEvent;
		/** 点击 */
		click: Event;
		/** 聚焦 */
		focus: Event;
		/** 失焦 */
		blur: Event;
	}


	export interface Stater<T, S = any> {
		get(store: Store, state: Signal.State<S>): T;
		set(store: Store, state: Signal.State<S>, value: any): void;
		toState(value: any): S;
	}

	export interface Attr<
		M = any,
		S extends {[k in string & keyof S]: Schema.State} = object,
		L extends { [k in keyof L]: L[k] } =  object,
	> {
		/** 元信息 */
		meta?: M;
		states?: { [k in string & keyof S]: Stater<S[k]> };
		default?: ((store: Store) => any) | any;
		/** 自定义组件 */
		component?: any;
		/** 是否可修改 */
		immutable?: boolean;
		/** 是否可创建 */
		creatable?: boolean;
		/** 是否隐藏 */
		hidden?: boolean | ((store: Store) => boolean) | null;
		/** 是否可清除 */
		clearable?: boolean | ((store: Store) => boolean) | null;
		/** 是否必填 */
		required?: boolean | ((store: Store) => boolean) | null;
		/** 是否禁用 */
		disabled?: boolean | ((store: Store) => boolean) | null;
		/** 是否只读 */
		readonly?: boolean | ((store: Store) => boolean) | null;
		/** 字段标签 */
		label?: string | ((store: Store) => string | null) | null;
		/** 字段描述 */
		description?: string | ((store: Store) => string | null) | null;
		/** 占位符 */
		placeholder?: string | ((store: Store) => string | null) | null;
		/** 数组内是否可添加 */
		addable?: boolean | ((store: Store) => boolean) | null;
		/** 数组内是否可移除 */
		removable?: boolean | ((store: Store) => boolean) | null;
		/** 监听函数 */
		events?: {[k in keyof Schema.Events]?: ((this: Store, value: Schema.Events[k], store: Store) => void | boolean | null) | null};
		/** 验证器 */
		validator?: Validator | Validator[] | null;
		layout?: L | null;
	}


	export type State = String | Boolean | Number | globalThis.Object | null;
}
export type Schema<
		M = any,
		S extends {[k in string & keyof S]: Schema.State} = object,
		L extends { [k in keyof L]: L[k] } =  object,
> = Record<string, Schema.Field<M, S, L>>;
