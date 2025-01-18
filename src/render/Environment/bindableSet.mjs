const bindable = {
	type: true,
	meta: true,
	component: true,
	kind: true,

	value: true,
	state: true,

	store: true,
	parent: true,
	root: true,

	schema: true,

	new: true,
	readonly: true,
	creatable: true,
	immutable: true,
	changed: true,

	required: true,
	clearable: true,
	hidden: true,
	disabled: true,

	label: true,
	description: true,
	placeholder: true,
	min: true,
	max: true,
	step: true,
	values: true,

	null: true,
	index: true,
	no: true,
	length: true,
}
/** @type {Set<keyof typeof bindable>} */
// @ts-ignore
const bindableSet = new Set(Object.keys(bindable));

export default bindableSet;
