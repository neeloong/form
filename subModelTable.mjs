/**
 * @template {import('./types.mjs').FormLike} T 
 * @param {import('./types.mjs').SubmodelsLayoutContext<T>} ctx
 */
const subModelTable = (ctx) => {
	const fieldsShow = [...ctx.fields];
	if (fieldsShow.length > 10) {
		fieldsShow.length = 10;
	}

	const root = document.createElement('div');
	const table = root.appendChild(document.createElement('table'));
	const thead = table.appendChild(document.createElement('thead'));
	const tbody = table.appendChild(document.createElement('tbody'));
	const headTr = thead.appendChild(document.createElement('tr'));
	headTr.appendChild(document.createElement('th')).appendChild(document.createTextNode('#'));
	for (const field of fieldsShow) {
		const th = headTr.appendChild(document.createElement('th'));
		const { label, name } = field;
		th.appendChild(document.createTextNode(label || name));
	}


	const actions = root.appendChild(document.createElement('div'));
	const addButton = actions.appendChild(document.createElement('button'));
	addButton.appendChild(document.createTextNode('添加'));

	/**
	 * @typedef {object} Row
	 * @property {HTMLTableRowElement} tr
	 * @property {T} form
	 * @property {HTMLElement[]} noElements
	 */
	/** @type {Row[]} */
	const lines = [];
	/**
	 * @returns {Row}
	 */
	function createLine() {
		const tr = document.createElement('tr');
		const mainTd = tr.appendChild(document.createElement('td'));
		mainTd.colSpan = fieldsShow.length + 1;
		const header = mainTd.appendChild(document.createElement('div'));
		const headerNo = header.appendChild(document.createElement('span'))
		const removeButton = header.appendChild(document.createElement('button'));
		removeButton.appendChild(document.createTextNode('移除'));


		

		const body = mainTd.appendChild(document.createElement('div'));
		const form = ctx.create(body, true);
		ctx.setHidden(form, false, true);
		const row = {tr, form, noElements: [headerNo], }
		const no = String(lines.push(row))
		headerNo.innerText = no;
		removeButton.addEventListener('click', () => {
			let index = lines.indexOf(row);
			if (index < 0) { return}
			lines.splice(index, 1);
			update(ctx.remove([form]));
			tr.remove();
			for (;index < lines.length; index++) {
				const no = String(index + 1);
				const line = lines[index];
				for (const el of line.noElements) {
					el.innerText = no;
				}
			}
		})
		return row
	}

	/**
	 * 
	 * @param {readonly *[]} data 
	 * @param {boolean} isInit
	 */
	function update(data, isInit = false) {
		const values = [data].flat().filter(v => v && typeof v === 'object');
		let i = 0;
		for (; i < values.length; i++) {
			const line = lines[i];
			if (!line) {
				const line = createLine();
				ctx.init(line.form, values[i], values[i]['!new']);
				tbody.appendChild(line.tr);
				continue;
			}
			if (isInit) {
				ctx.init(line.form, values[i], values[i]['!new']);
			} else {
				ctx.update(line.form, values[i], values[i]['!new']);
			}
		}
		for (; i < lines.length;) {
			const {tr, form} = lines[i];
			lines.splice(i, 1);
			tbody.removeChild(tr);
			ctx.destroy(form);
		}
	}
	addButton.addEventListener('click', () => {
		update(ctx.add());
	});
	ctx.listen('readonly', () => {

	})
	ctx.listen('reset', (v) => update(v, true))
	ctx.listen('update', (v) => update(v))
	ctx.listen('hidden', hidden => {
		if (hidden) {
			for (const {form} of lines) {
				ctx.setHidden(form, true, true);
			}
		} else {
			for (const {form} of lines) {
				ctx.setHidden(form, false, true);
			}
		}
	})
	return root
};
export default subModelTable;
