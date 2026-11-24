import type Store from '../Store/index.mjs';
import type { ArrayStore } from '../Store/index.mjs';

export interface Layout<T = unknown> {
	html?: string | ParentNode | null;
	fields?: Item<T>[] | null;
	renderer?: T;
}

export interface Relatedness {
	/** 聚焦函数 */
	focus?(): void;
	/** 展示函数 */
	scrollIntoView?(): void;
	/** 输入元素 */
	input?: Element;
	/** 根元素 */
	root?: Element;
}
export type Action =
	| 'add' | 'move' | 'trigger' | 'remove' | 'serial'
	| 'open' | 'collapse' | 'removeTree' | 'copy' | 'copyTree';


export interface Grid {
	colStart?: number;
	colSpan?: number;
	colEnd?: number;
	rowStart?: number;
	rowSpan?: number;
	rowEnd?: number;
	cell?: 'block' | 'inline' | 'collapse' | 'fieldset' | 'base' | '';
}


export interface Column<T = unknown> {
	/** 操作 */
	actions?: Action[];
	/** 操作 */
	action?: Action;
	render?: ((store: Store, options: { signal: AbortSignal; pattern?: string }) => Node) | null;
	/** 字段 */
	field?: string;
	/** 占位符 */
	placeholder?: number;
	/** 模式 */
	pattern?: string;
	/** 宽度 */
	width?: number;
	/** 标签 */
	label?: string;
	/** 对齐方式 */
	align?: 'start' | 'center' | 'end' | 'justify';
	html?: string | ParentNode | null;
	fields?: Item<T>[] | null;
	renderer?: T;
	editable?: boolean | null;
	readonly?: boolean | null;
}

export interface Field<T = unknown> extends Grid {
	type?: 'field';
	readonly?: boolean;
	renderer?: T;

	field?: string;
	html?: string | ParentNode | null;
	fields?: Item<T>[] | null;
	tableFoot?: 'header' | 'add' | 'none';
	columns?: (string | number | Action[] | Column<T>)[];
	arrayStyle?: 'tree' | 'table' | Explorer<T>;
	mainMethod?: 'collapse' | 'trigger' | 'open' | 'move';
	levelKey?: string;
}

export interface Button extends Grid {
	type: 'button';
	readonly?: boolean;

	required?: boolean;
	label?: string;
	description?: string;
	disabled?: (store: Store<any, any, any, Field<any>>, options?: Options | null) => boolean;
	text?: string | ((store: Store<any, any, any, Field<any>>, options?: Options | null) => string);
	click?: string | ((event: Event, store: Store<any, any, any, Field<any>>, options?: Options | null) => void);
}

export interface Html extends Grid {
	type: 'html';
	readonly?: boolean;

	required?: boolean;
	label?: string;
	description?: string;
	html?: string | ParentNode | null;
}


export type Item<T = unknown> = Field<T> | Button | Html;


export interface Operation {
	signal: AbortSignal;
	type: Action | 'footAdd' | 'headAdd';
	disabled: boolean;
	collapsed: boolean;
	shown: boolean | 'until-found';
	hasChildren: boolean;
	component: 'tree' | 'table';
}

export interface Options {
	relate?: (store: Store, el: Element | Relatedness) => () => void;
	editable?: boolean;
	pattern?: string | null;
	signal?: AbortSignal;
	sanitizeHtml?: (name: string) => string | ParentNode | null;
	call?: (name: string, event: Event, store: Store<any, any, any, Field<any>>, options?: Options | null) => void;
	render?: (el: Element, store: Store<any, any, any, Field<any>>, options?: Options | null) => Node | null;
	operation?: (btn: Operation) => HTMLElement | null;
}

export interface Renderer<T = unknown> {
	(store: Store<any, any, any, Field<any>>, renderer?: T | string, options?: Options | null): Element | null;
}

export interface InspectorStore<T = unknown> {
	get(): Store<any, any, any, Field<any>> | null;
	is(s: Store<any, any, any, Field<any>>): boolean;
	close(s?: Store<any, any, any, Field<any>> | null): boolean;
	set(s: Store<any, any, any, Field<any>>, layout?: Field<T> | null): () => void;
}

export interface Explorer<T> {
	(
		inspector: InspectorStore<T>,
		store: ArrayStore,
		fieldRenderer: Renderer<T>,
		layout: Field<T>,
		options?: Options | null
	): HTMLElement;
}
