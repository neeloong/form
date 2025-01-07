const bindable = {
	new: true,
	readonly: true,

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
}
/** @type {Set<keyof typeof bindable>} */
// @ts-ignore
const bindableSet = new Set(Object.keys(bindable));

export default bindableSet;
