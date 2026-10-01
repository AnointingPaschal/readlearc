/** After any on-chain write, cached reads (edge log cache, device caches) must be bypassed once. */
let stamp = 0;
const subs = new Set<() => void>();
export const writeStamp = () => stamp;
export function markWrite() { stamp = Date.now(); subs.forEach((f) => { try { f(); } catch { /* ignore */ } }); }
export function onWrite(f: () => void) { subs.add(f); }
