
import type { ModelScriptConfiguration, FieldScriptConfiguration} from './services/model.mjs'

export interface FromEvent {
	update: [data: any];
	refresh: [field?: string];
	[K: string]: any[];
}

export interface VerifyError {
	focus(): void
	stop: boolean;
	title: string;
}

export interface VerifyContext {
	waitUntil(promise: PromiseLike<void>): void;
	error(p: VerifyError): void;
	// TODO
}

export interface FieldComponentEvent {
	reset(value: any, data: any): void;
	required(required: boolean): void;
	hidden(hidden: boolean): void;
	readonly(readonly: boolean): void;
	update(value: any, data: any, modified: boolean): void;
	refresh(value: any, data: any, modified: boolean): void;
	move(): void;
	destroy(): void;
	verify(ctx: VerifyContext): void;
}


export interface FieldContext {
	readonly readonly: boolean;
	readonly required: boolean;
	readonly hidden: boolean;
	readonly data?: Record<string, any>;
	readonly updatable: boolean;
	value: any;
	update(key: string, value: any): void;
	listen<K extends keyof FieldComponentEvent>(event: K, listen: FieldComponentEvent[K]): () => void;
	onChange(): void;
	onClick(): void;
	onFocus(): void;
	onBlur(): void;
}

export interface FieldHandleEvent {
	update(value: any, key?: string): void;
	input(value: any, oldValue: any, field: string, ...fields: (string | number)[]): void
	change(field: string, ...fields: (string | number)[]): void
	click(field: string, ...fields: (string | number)[]): void
	focus(field: string, ...fields: (string | number)[]): void
	blur(field: string, ...fields: (string | number)[]): void
}

export interface FieldComponent {
	(ctx: FieldContext): HTMLElement;
}
export interface SubmodelsLayoutEvent {
	reset(list: object[]): void;
	update(list: object[]): void;
	hidden(hidden: boolean): void;
	readonly(readonly: boolean): void;
	destroy(): void;
}
export interface SubmodelsLayoutContext<T extends FormLike> {
	fields: FieldScriptConfiguration[]
	readonly readonly: boolean
	readonly hidden: boolean
	add(): object[]
	listen<K extends keyof SubmodelsLayoutEvent>(event: K, listen: SubmodelsLayoutEvent[K]): () => void;
	create(root: HTMLElement, hidden?: boolean): T
	setHidden(form: T, main: boolean, added: boolean): void
	destroy(form: T): void
	init(form: T, data: object, isNew?: boolean): void
	update(form: T, data: object, isNew?: boolean): void
	remove(form: Iterable<T>): object[]
	move(form: T[], to: number): object[]
}
export interface SubmodelsLayoutComponent<T extends FormLike> {
	(ctx: SubmodelsLayoutContext<T>): HTMLElement;
}

export interface FieldStyle {
	/** 行内渲染 */
	inline?: boolean;
	/** 显示标签 */
	showLabel?: boolean;
	/** 是否启用链接 */
	enableLink?: boolean;
	/** 是否可编辑 */
	editable?: boolean;
	/** 是否为设计模式 */
	design?: boolean;
}
export interface FieldHandle {
	readonly name: string;
	readonly value: any;
	readonly field: FieldScriptConfiguration;
	readonly root: HTMLElement;
	readonly shown: boolean;
	readonly readonly: boolean;
	/** 由自定义脚本控制 */
	required: boolean;
	/** 由自定义脚本控制 */
	hidden: boolean;
	/** 由父级控制，如果是通过表单的字段定义创建则 */
	parentHidden: boolean;
	/** 由自定义脚本控制 */
	disabled: boolean;
	/** 由表单控制 */
	commonReadonly: boolean;
	/** 由权限控制 */
	writeable: boolean;
	// TODO: 选项
	// TODO: 过滤条件
	update(data: any): void;
	reset(data: any): void;
	refresh(): void;
	destroy(): void;
	emit<K extends string>(name: K, ...args: K extends keyof FieldComponentEvent ? Parameters<FieldComponentEvent[K]> : []): void;
	listen<K extends keyof FieldHandleEvent>(event: K, listen: FieldHandleEvent[K]): () => void;
}
export type FieldComponents = {
	[field: string]: FieldComponent | FieldComponents;
}

export interface FormLike {
	update(key: string, value: any): Record<string, any>
	update(value: object): Record<string, any>
	refresh(field?: string): void;
	readonly define: ModelScriptConfiguration
	readonly field?: string | null;
	readonly no?: number | null;
	readonly new?: boolean;
	readonly parent: FormLike | null;
	readonly root: FormLike;
	readonly data: Record<string, any>;
	readonly fieldComponents?: FieldComponents | null;
	readonly fields?: readonly FieldHandle[]
}

export interface FieldDefine {
	input: FieldComponent
	inputs: Record<string, FieldComponent>;
}
