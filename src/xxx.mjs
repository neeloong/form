import { Signal } from "signal-polyfill";
import { effect } from "./effect.mjs";

const counter = new Signal.State(0);
const isEven = new Signal.Computed(() => (counter.get() & 1) == 0);
const parity = new Signal.Computed(() => (isEven.get() ? "even" : "odd"));

effect(() => console.log(parity.get())); // Console logs "even" immediately.
setInterval(() => counter.set(counter.get() + 1), 1000); // Changes the counter every 1000ms.

// effect triggers console log "odd"
// effect triggers console log "even"
// effect triggers console log "odd"
// ...
