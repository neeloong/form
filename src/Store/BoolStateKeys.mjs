
/** @typedef {'hidden' | 'clearable' | 'required' | 'disabled' | 'readonly'} BoolStateKeys */
/** @type {BoolStateKeys[]} */
export const BoolStateKeys = ['hidden', 'clearable', 'required', 'disabled', 'readonly'];

/** @type {Record<string, boolean>} */
export const stateInParent = {
	hidden: true,
	clearable: false,
	required: false,
	disabled: true,
	readonly: true,
}
/** @type {Record<string, boolean>} */
export const stateInScript = {
	hidden: true,
	clearable: true,
	required: true,
	disabled: true,
	readonly: true,
}
