/** Tiny event bus for long-running on-chain operations (uploads, multi-tx flows). Rendered by <ChainActivity/>. */
export interface ActivityItem { id: number; label: string; detail?: string; pct?: number; state: "run" | "done" | "fail" }

let seq = 0;
let items: ActivityItem[] = [];
const subs = new Set<(i: ActivityItem[]) => void>();
const emit = () => subs.forEach((s) => s(items));

export const activity = {
  subscribe(fn: (i: ActivityItem[]) => void) { subs.add(fn); fn(items); return () => { subs.delete(fn); }; },
  start(label: string): number {
    const id = ++seq;
    items = [...items, { id, label, state: "run" }];
    emit();
    return id;
  },
  update(id: number, detail?: string, pct?: number) {
    items = items.map((i) => (i.id === id ? { ...i, detail, pct } : i));
    emit();
  },
  done(id: number, detail?: string) {
    items = items.map((i) => (i.id === id ? { ...i, state: "done", detail, pct: 100 } : i));
    emit();
    setTimeout(() => activity.dismiss(id), 4000);
  },
  fail(id: number, detail: string) {
    items = items.map((i) => (i.id === id ? { ...i, state: "fail", detail } : i));
    emit();
    setTimeout(() => activity.dismiss(id), 9000);
  },
  dismiss(id: number) { items = items.filter((i) => i.id !== id); emit(); },
};

/** Run `fn` while showing a progress toast. */
export async function withActivity<T>(label: string, fn: (update: (detail?: string, pct?: number) => void) => Promise<T>): Promise<T> {
  const id = activity.start(label);
  try {
    const r = await fn((d, p) => activity.update(id, d, p));
    activity.done(id);
    return r;
  } catch (e) {
    activity.fail(id, (e as Error).message || "Failed");
    throw e;
  }
}
