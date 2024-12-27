

export class SchemaAbs {
}


export class SchemaRoot extends SchemaAbs {
	/**
	 * @param {import('./schema.mjs').Schema & import('./schema.mjs').Schema.Event & import('./schema.mjs').Schema.Attr} schema
	*/
	constructor(schema) {
		super();

	}
}

export class SchemaObject extends SchemaAbs {
	/**
	 * @param {import('./schema.mjs').Schema.Object & import('./schema.mjs').Schema.Event & import('./schema.mjs').Schema.Attr} schema
	*/
	constructor(schema) {
		super();

	}
}



export class SchemaTuple extends SchemaAbs {
	/**
	 * @param {import('./schema.mjs').Schema.Tuple & import('./schema.mjs').Schema.Event & import('./schema.mjs').Schema.Attr} schema
	*/
	constructor(schema) {
		super();
	}
}

export class SchemaValue extends SchemaAbs {
	/**
	 * @param {import('./schema.mjs').Schema.Type & import('./schema.mjs').Schema.Event & import('./schema.mjs').Schema.Attr} schema
	*/
	constructor(schema) {
		super();
	}
}

export class SchemaArray extends SchemaAbs {
	/**
	 * @param {import('./schema.mjs').Schema.Field} schema
	*/
	constructor(schema) {
		super();
	}
}
