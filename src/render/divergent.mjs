import watch from '../watch.mjs';
import Environment from './Environment/index.mjs';
/** @import * as Layout from '../Layout/index.mjs' */

/**
 * @param {Layout.Divergent} layout
 * @param {Element} parent
 * @param {Node?} next
 * @param {Environment} env
 * @param {(layout: Layout.Child[], vars?: Layout.Variable[]?, templates?: Record<string, any>) => () => void} renderItem
 * @returns {() => void}
 */
export default function divergent(layout, parent, next, env, renderItem) {
	const children = layout.children;
	if (!children.length) { return () => { }; }
	const end = parent.insertBefore(document.createComment(''), next);
	/** @type {typeof children[0]?} */
	let last = null;
	let destroy = () => { };
	const stop = () => {
		destroy();
		destroy = () => { };
		end.remove();
	};
	const unwatch = watch(
		() => children.find(([, ifv]) => !ifv || env.exec(ifv)) || null,
		item => {
			if (item === last) { return; }
			last = item;
			destroy();
			destroy = () => { };
			const layout = item?.[0];
			if (!layout) { return; }
			destroy = renderItem(layout.children, layout.vars, layout.templates);
		}, true,
	);

	let destroyed = false;
	return () => {
		if (destroyed) { return; }
		destroyed = true;
		unwatch();
		stop();
	};
}
