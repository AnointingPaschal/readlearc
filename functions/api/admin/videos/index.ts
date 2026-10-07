/**
 * GET  /api/admin/videos          — list all videos (admin only)
 * Query: status=pending|approved|featured|rejected|removed, q=search
 */
import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { authenticate } from "../../../_lib/auth";
import { chainFor } from "../../../_lib/chain";
import { getConfig } from "../../../_lib/store";
import { ethers } from "ethers";
import ContentStoreAbi from "../../../../src/abi/ContentStore.json";

const STATUS = ["pending", "approved", "rejected", "removed"] as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "";
  const q = (url.searchParams.get("q") || "").toLowerCase();

  try {
    const cfg = await getConfig(env);
    if (!cfg.contentStore) return json([]);

    const { provider } = await chainFor(env);
    const store = new ethers.Contract(cfg.contentStore, ContentStoreAbi as ethers.InterfaceAbi, provider);

    const total = Number(await store.count());
    if (!total) return json([]);

    const PAGE = 100;
    const rows: any[] = [];
    for (let s = 1; s <= total; s += PAGE) {
      const cards = await store.getCards(s, Math.min(s + PAGE - 1, total));
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (Number(c.kind) !== 1) continue; // videos only
        const id = s + i;
        const statusName = STATUS[Number(c.status)] || "pending";
        const isFeatured = c.featured && Number(c.status) === 1;
        const effectiveStatus = isFeatured ? "featured" : statusName;

        if (statusFilter && effectiveStatus !== statusFilter) continue;

        const title = c.title || "";
        const blurb = c.blurb || "";
        const slug = c.slug || "";
        if (q && !title.toLowerCase().includes(q) && !c.author?.toLowerCase().includes(q) && !slug.includes(q)) continue;

        rows.push({
          id,
          slug,
          title,
          blurb,
          creator_address: c.author,
          price_per_sec_usdc: (Number(c.price) / 1e6).toString(),
          free_preview_secs: Number(c.freePreviewSecs),
          duration_seconds: Number(c.durationSecs),
          category: c.category || "General",
          status: effectiveStatus,
          featured: c.featured,
          views: 0, // reads not fetched in batch for speed
          created_at: new Date(Number(c.createdAt) * 1000).toISOString(),
          encrypted: c.encrypted,
          finalized: c.finalized,
          // Detect R2 vs on-chain by mime type stored in content
          r2: c.mime === "video/r2",
        });
      }
    }

    // Sort newest first
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return json(rows);
  } catch (e: any) {
    return err(e.message || "Failed to load videos", 500);
  }
};
