/** @import { ValueDefine, ExecDefine, CalcDefine } from './index.mjs' */

import { ref } from '../../Store/ref.mjs';

/** @type {Record<string, ValueDefine | ExecDefine | CalcDefine>} */
const items = {
	value$: { calc(r) { return r?.[ref].value; } },
	state$: { calc(r) { return r?.[ref].state; } },
}

export default Object.getOwnPropertyDescriptors(items);
