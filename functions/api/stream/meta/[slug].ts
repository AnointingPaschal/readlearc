/**
 * GET /api/stream/meta/:slug — return video metadata for the watch page.
 * Checks KV admin overrides first: removed/rejected videos return 404.
 */
import type { Env } from "../../../_lib/env";
import { json, err } from "../../../_lib/env";
import { chainFor } from "../../../_lib/chain";
import { getConfig } from "../../../_lib/store";
import { ethers } from "ethers";
import ContentStoreAbi from "../../../../src/abi/ContentStore.json";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = String(params.slug || "").toLowerCase();
  if (!slug) return err("Missing slug", 400);

  try {
    const cfg = await getConfig(env);
    if (!cfg.contentStore) return err("Not configured", 503);

    const { provider } = await chainFor(env);
    const store = new ethers.Contract(cfg.contentStore, ContentStoreAbi as ethers.InterfaceAbi, provider);

    const id = Number(await store.idBySlug(slug));
    if (!id) return err("Video not found", 404);

    // Check KV tombstone — admin removal wins over on-chain status
    if (env.RL_KV) {
      const kv = await env.RL_KV.get(`video:status:${id}`);
      if (kv) {
        const { status } = JSON.parse(kv) as { status: string };
        if (status === "removed" || status === "rejected") {
          return err("This video has been removed", 404);
        }
      }
    }

    const c = await store.getCard(id);

    // Also check on-chain status (2=rejected, 3=removed)
    const onChainStatus = Number(c.status);
    if (onChainStatus === 2 || onChainStatus === 3) {
      return err("This video has been removed", 404);
    }

    const isR2 = c.mime === "video/r2";

    const video = {
      id,
      slug: c.slug,
      title: c.title,
      blurb: c.blurb || "",
      creator_address: c.author,
      price_per_sec_usdc: (Number(c.price) / 1e6).toFixed(6),
      free_preview_secs: Number(c.freePreviewSecs),
      duration_seconds: Number(c.durationSecs),
      category: c.category || "General",
      encrypted: c.encrypted,
      finalized: c.finalized,
      chunk_count: Number(c.chunkCount),
      mime: c.mime,
      r2: isR2,
      hls_master_url: isR2 ? `/api/video/stream/${id}` : null,
      thumbnail_url: isR2
        ? `/api/video/thumb/${id}`
        : (c.thumb && c.thumb !== "0x"
          ? `data:image/jpeg;base64,${Buffer.from(c.thumb.slice(2), "hex").toString("base64")}`
          : undefined),
      views: 0,
    };

    return json({ video }, 200, { "Cache-Control": "s-maxage=60" });
  } catch (e: any) {
    return err(e.message || "Failed to load video", 500);
  }
};
