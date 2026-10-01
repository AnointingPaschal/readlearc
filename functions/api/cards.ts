import type { Env } from "../_lib/env";
import { err } from "../_lib/env";
import { chainFor } from "../_lib/chain";

/**
 * GET /api/cards — the whole public content list (article/video cards) read from the chain once and
 * cached at the edge for a short time, so visitors don't each walk the RPC. `?fresh=1` skips the cache read.
 */
const PAGE = 100;
const TTL = 30;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  const key = new Request(`${url.origin}/api/cards`);
  if (cache && !url.searchParams.has("fresh")) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  try {
    const ch = await chainFor(env);
    if (!ch.store || !ch.pay) return new Response("[]", { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    const total = Number(await ch.store.count());
    const ranges: [number, number][] = [];
    for (let s = 1; s <= total; s += PAGE) ranges.push([s, Math.min(s + PAGE - 1, total)]);
    const out: unknown[] = [];
    for (let i = 0; i < ranges.length; i += 3) {
      const parts = await Promise.all(ranges.slice(i, i + 3).map(async ([a, b]) => {
        const [rows, reads] = await Promise.all([ch.store!.getCards(a, b), ch.pay!.readsBatch(Array.from({ length: b - a + 1 }, (_, k) => a + k))]);
        return (rows as any[]).map((r, k) => ({
          id: a + k, author: r.author, kind: Number(r.kind), status: Number(r.status), featured: r.featured, finalized: r.finalized,
          isResearch: r.isResearch, encrypted: r.encrypted, hasThumb: r.hasThumb, version: Number(r.version), readTime: Number(r.readTime),
          durationSecs: Number(r.durationSecs), freePreviewSecs: Number(r.freePreviewSecs), createdAt: Number(r.createdAt),
          thumbBlock: Number(r.thumbBlock), price: String(r.price), title: r.title, blurb: r.blurb, category: r.category, slug: r.slug, reads: Number(reads[k]),
        }));
      }));
      out.push(...parts.flat());
    }
    const res = new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${TTL}` } });
    if (cache) waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) { return err((e as Error).message, 502); }
};
