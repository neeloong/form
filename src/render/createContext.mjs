export default function createContext({
	attrs, events
}) {
	let removed = false;
	const removedListeners = new Set();
	const props = Object.fromEntries(Object.entries(attrs).map(([e, {default: def}]) => [e, def]));
	const watchProps = Object.fromEntries(Object.keys(props).map(e => [e, new Set]))
	/** @type {Record<string, ((e: any) => void)[]>} */
	const listeners = Object.fromEntries(Object.keys(events).map(e => [e, []]))
	const cContext = {
		// TODO: 触发事件
		// TODO: 属性及监听属性
		event: Object.fromEntries(Object.entries(listeners).map(([e, list]) => {
			return [e, $event => {
				for (const fn of list) {
					fn($event);
				}
			}]
		})),
		props: Object.defineProperties({}, Object.fromEntries(Object.keys(attrs).map(e => [e, {
			configurable: true,
			enumerable: true,
			get() { return props[e]},
		}]))),
		watchProp(name, fn) {
			const list = watchProps[name];
			if (!(list instanceof Set)) { return () => {}}
			list.add(fn);
			return () => {list.delete(fn)};
		},
		get removed() { return removed},
		listenRemove(fn) {
			removedListeners.add(fn);
			return () => {removedListeners.delete(fn)};

		}
	};
	const rContext = {
		set(name, value) {
			const old = props[name];
			if (old === value) { return; }
			props[name] = value;
			const list = watchProps[name];
			if (!(list instanceof Set)) { return; }
			for (const f of list) {
				f(value, old, name);
			}
		},
		addEvent(name, fn) {
			const [e, ...fs] = name.split('.').filter(Boolean);
			const event = events[e];
			if (!event) { return; }
			const filters = event.filters;
			const list = listeners[e];
			if (!Array.isArray(list)) { return; }
			let l = fn;
			if (filters) for (let f = fs.pop();f;f = fs.pop()) {
				const filter = filters[f];
				if (typeof filter !== 'function') { continue; }
				const fn = l;
				l = (...args) => {
					if (filter(...args) === false) { return}
					fn(...args);
				}
			}
			list.push(l);
		},
		remove() {
			if (removed) { return }
			removed = true;
			for (const f of removedListeners) {
				f();
			}

		},

	};
	return {cContext, rContext};
}
