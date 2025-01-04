/**
 * @template {Record<string, any[]>} T
 */
export default class EventEmitter {
	/** @type {Map<keyof T, Set<(...p: any[]) => void>>} */
	#events = new Map()
	/**
	 * 
	 * @template {keyof T} K
	 * @param {K} event 
	 * @param  {T[K]} p 
	 */
	emit(event, ...p) {
		const key = typeof event === 'number' ? String(event) : event;
		const events = this.#events;
		for (const d of [...events.get(key) || []]) {
			d(...p);
		}
	}
	/**
	 * 
	 * @template {keyof T} K
	 * @param {K} event 
	 * @param  {(...p: T[K]) => void} listener
	 * @returns {() => void}
	 */
	listen(event, listener) {
		/** @type {any} */
		const fn = listener.bind(this);
		const events = this.#events;
		const key = typeof event === 'number' ? String(event) : event;
		let set = events.get(key);
		if (!set) {
			set = new Set();
			events.set(key, set);
		}
		set.add(fn);
		return () => { set?.delete(fn); }

	}
}
