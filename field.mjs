import { Hook } from '@___/common';
import SubmodelInput from './submodel.mjs';
import { hooks } from '../hooks.mjs';

/**
 * 
 * @param {string} type
 * @param {string} [renderer] 
 * @returns 
 */
function getSetKey(type, renderer) {
	if (!type || type === '.') {
		if (!renderer) { return; }
		return `:${renderer}`;
	}
	if (type[0] === '#') { return; }
	if (!renderer) { return type; }
	return `${type}:${renderer}`;
}

function getFields() {
	/** @type {Map<string, import('./types.mjs').FieldComponent>} */
	const allInputs = new Map();

	for (const fieldHooks of [...Hook.values(hooks.fields)]) {
		if (!fieldHooks || typeof fieldHooks !== 'object') { continue; }
		for (const [type, hook] of Object.entries(fieldHooks)) {
			if (!hook || typeof hook !== 'object') { continue; }
			const {input, inputs} = hook;
			if (typeof input === 'function') {
				const key = getSetKey(type);
				if (key) { allInputs.set(key, input); }
			}
			if (inputs && typeof inputs === 'object') {
				for (const [renderer, input] of Object.entries(inputs)) {
					if (typeof input !== 'function') { continue; }
					const key = getSetKey(type, renderer);
					if (key) { allInputs.set(key, input); }
				}
			}
		}
	}
	return { inputs: allInputs };
}
let { inputs } = getFields();


/**
 * 
 * @param {string | import('../services/model.mjs').FieldScriptConfiguration} field 
 * @returns 
 */
function* getKey(field) {
	const type = typeof field === 'string' ? field : field.type;
	const renderer = typeof field === 'string' ? '' : field.component;
	if (type[0] === '#') { return; }
	if (type === '.') {
		if (!renderer) { return; }
		yield `:${renderer}`;
		return;
	}
	if (renderer) {
		yield `${type}:${renderer}`;
	}
	yield type;
}

/**
 * 
 * @param {import('../services/model.mjs').FieldScriptConfiguration} field 
 * @returns {import('./types.mjs').FieldComponent}
 */
export function getField(field) {
	for (const k of getKey(field)) {
		const v = inputs.get(k);
		if (v) { return v; }
	}
	const type = typeof field === 'string' ? field : field.type;
	if (type === '.submodels' || type.startsWith('.submodels.')) {
		return SubmodelInput;
	}
	if (type === '.models' || type.startsWith('.models.')) {
		// return true;
	}
	return () => document.createElement('div');
}
