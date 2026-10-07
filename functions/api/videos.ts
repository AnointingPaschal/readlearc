/**
 * GET /api/videos — public video listing.
 * Reads on-chain cards then merges KV status overrides (from admin moderation).
 * Videos with status "removed" or "rejected" are hidden from the public feed.
 */
import type { Env } from "../_lib/env";
import { json } from "../_lib/env";
import { chainFor } from "../_lib/chain";
import { getConfig } from "../_lib/store";
import { ethers } from "ethers";
import ContentStoreAbi from "../../src/abi/ContentStore.json";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit") || "40"));
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const category = url.searchParams.get("category") || "";

  try {
    const cfg = await getConfig(env);
    if (!cfg.contentStore) return json({ videos: [], total: 0 });

    const { provider } = await chainFor(env);
    const store = new ethers.Contract(cfg.contentStore, ContentStoreAbi as ethers.InterfaceAbi, provider);

    const total = Number(await store.count());
    if (!total) return json({ videos: [], total: 0 });

    // Build KV override map in one batch — list all video:status:* keys
    const kvOverrides = new Map<number, { status: string; featured?: boolean }>();
    if (env.RL_KV) {
      const keys = await env.RL_KV.list({ prefix: "video:status:" });
      await Promise.all(keys.keys.map(async (k) => {
        const id = Number(k.name.replace("video:status:", ""));
        if (id) {
          const val = await env.RL_KV.get(k.name);
          if (val) {
            try { kvOverrides.set(id, JSON.parse(val)); } catch { /* ignore */ }
          }
        }
      }));
    }

    const PAGE = 100;
    const videos: any[] = [];

    for (let s = 1; s <= total && videos.length < limit; s += PAGE) {
      const end = Math.min(s + PAGE - 1, total);
      const cards = await store.getCards(s, end);

      for (let i = 0; i < cards.length && videos.length < limit; i++) {
        const c = cards[i];
        if (Number(c.kind) !== 1) continue; // videos only

        const id = s + i;
        const onChainStatus = Number(c.status); // 0=pending,1=approved,2=rejected,3=removed
        const kv = kvOverrides.get(id);

        // Determine effective status: KV override wins over on-chain
        let effectiveStatus = ["pending", "approved", "rejected", "removed"][onChainStatus] || "pending";
        if (kv?.status) effectiveStatus = kv.status;

        // Hide removed and rejected from public feed
        if (effectiveStatus === "removed" || effectiveStatus === "rejected") continue;

        // Only show approved/featured videos publicly (pending = not yet approved)
        if (effectiveStatus === "pending") continue;

        const featured = kv?.featured ?? Boolean(c.featured);
        const slug = c.slug || "";
        const title = c.title || "";

        if (q && !title.toLowerCase().includes(q) && !slug.includes(q)) continue;
        if (category && (c.category || "General").toLowerCase() !== category.toLowerCase()) continue;

        // Determine thumbnail URL for R2 videos
        const isR2 = c.mime === "video/r2";
        const thumbnail_url = isR2
          ? `/api/video/thumb/${id}`
          : (c.thumb && c.thumb !== "0x" ? `data:image/jpeg;base64,${Buffer.from(c.thumb.slice(2), "hex").toString("base64")}` : undefined);

        videos.push({
          id,
          slug,
          title,
          blurb: c.blurb || "",
          creator_address: c.author || "",
          price_per_sec_usdc: (Number(c.price) / 1e6).toFixed(6),
          free_preview_secs: Number(c.freePreviewSecs),
          duration_seconds: Number(c.durationSecs),
          thumbnail_url,
          category: c.category || "General",
          featured,
          views: 0,
          r2: isR2,
          status: effectiveStatus,
        });
      }
    }

    // Sort: featured first, then newest first
    videos.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.id - a.id;
    });

    return json({ videos, total }, 200, { "Cache-Control": "s-maxage=30" });
  } catch (e: any) {
    return json({ videos: [], total: 0, error: e.message }, 200);
  }
};
