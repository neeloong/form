import effect from '../effect.mjs';

/**
 * 
 * @param {import('../StoreLayout.types.mjs').StoreLayout.Operation} options 
 */
export default function createButton(options) {
	const button = document.createElement('button');
	effect(() => button.disabled = options.disabled, options.signal);
	const component = options.component;
	const type = options.type;
	button.classList.add(`NeeloongForm-${options.component}-${type.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
	if (component === 'tree' && type === 'collapse') {
		effect(() => {
			if (!options.hasChildren) {
				button.classList.remove('NeeloongForm-tree-collapse-close');
				button.classList.remove('NeeloongForm-tree-collapse-open');
			} else if (options.collapsed) {
				button.classList.remove('NeeloongForm-tree-collapse-close');
				button.classList.add('NeeloongForm-tree-collapse-open');
			} else {
				button.classList.remove('NeeloongForm-tree-collapse-open');
				button.classList.add('NeeloongForm-tree-collapse-close');
			}
		}, options.signal);

	}
	if (component === 'table' && type === 'trigger') {
		effect(() => {
			if (options.shown) {
				button.classList.remove('NeeloongForm-table-line-open');
				button.classList.add('NeeloongForm-table-line-close');
			} else {
				button.classList.remove('NeeloongForm-table-line-close');
				button.classList.add('NeeloongForm-table-line-open');
			}
		}, options.signal);
	}
	if (component === 'table' && (type === 'headAdd' || type === 'footAdd')) {
		button.classList.add('NeeloongForm-table-add');
	}
	return button;
}
