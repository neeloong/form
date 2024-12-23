import createField from './createField.mjs';


/**
 * 
 * @param {readonly any[]} layouts 
 * @param {import('./types.mjs').FormLike} from
 */
export default function renderFormLayout(layouts, from) {
	const children = [];
	for (const field of layouts) {
		const fieldHandle = createField(field, { from });
		children.push(fieldHandle);
	}

		return children
}
