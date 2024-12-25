
const define = {
	types: {
		t: {},
	},
	props: {
		n: {
			type: 'number', // int, float, date, time, datetime, timestamp, regex, text, boolean
			nullable: true,
			default: 1,
			array: false,
			meta: {},
		},
		obj: {
			type: 'object',
			props: {

			},

		},
		tuple: {
			type: 'tuple',
			props: [

			],
		}
	}
}


function getValue(def, val) {
	const { meta, type, array } = def;
	/** @type {Signal.State<any>} */
	const value = new Signal.State(def.array ? [] : null);
	function setItem(val) {
		switch(type) {
			case 'number': {
				
			} break;
			case 'object': {
				const props = def.props;
				for (const [key, prop] of Object.entries(props)) {
	
				}
	
			} break;
			case 'tuple': {
				
			} break;
		}

	}
	if (array && type !== 'tuple') {
		return (Array.isArray(val) ? val : [val]).map(setItem);
	} else {
		return setItem(val);
	}

}

function create(def = define) {
	const { meta, type, array } = def;
	/** @type {Signal.State<any>} */
	const value = new Signal.State(def.array ? [] : null);
	function setItem(val) {
		switch(type) {
			case 'number': {
				
			} break;
			case 'object': {
				const props = def.props;
				for (const [key, prop] of Object.entries(props)) {
	
				}
	
			} break;
			case 'tuple': {
				
			} break;
		}

	}
	function set(val) {
		if (def.array && type !== 'tuple') {
			value.set((Array.isArray(val) ? val : [val]).map(setItem))
		} else {
			value.set(setItem(val))
		}
	}

	switch(def.type) {
		case 'number': {
			
		} break;
		case 'object': {
			const props = def.props;
			for (const [key, prop] of Object.entries(props)) {

			}

		} break;
		case 'tuple': {
			
		} break;
	}
	return {
		meta,
		get value() { return value.get(); },
		set value(val) {

		}
	}
}
