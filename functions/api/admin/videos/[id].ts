/**
 * PATCH /api/admin/videos/:id  — update status / featured / price_per_sec_usdc
 * DELETE /api/admin/videos/:id — set status=removed and purge R2 file
 */
import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { authenticate } from "../../../_lib/auth";
import { chainFor } from "../../../_lib/chain";
import { getConfig } from "../../../_lib/store";
import { ethers } from "ethers";
import ContentStoreAbi from "../../../../src/abi/ContentStore.json";

const STATUS_CODE: Record<string, number> = { pending: 0, approved: 1, rejected: 2, removed: 3 };

export const onRequestPatch: PagesFunction<Env> = async ({ request, params, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);

  const id = Number(params.id);
  if (!id) return err("Bad id");

  let p: any;
  try { p = JSON.parse(body); } catch { return err("Bad JSON"); }

  try {
    const cfg_store = await getConfig(env);
    const chain = await chainFor(env);

    const pk = (env as any).DEPLOYER_PRIVATE_KEY as string | undefined;
    if (pk && cfg_store.contentStore) {
      const signer = new ethers.Wallet(pk, chain.provider);
      const store = new ethers.Contract(cfg_store.contentStore, ContentStoreAbi as ethers.InterfaceAbi, signer);

      if (p.status !== undefined) {
        const effectiveStatus = p.status === "featured" ? "approved" : p.status;
        const code = STATUS_CODE[effectiveStatus];
        if (code !== undefined) await store.setStatus(id, code);
      }
      if (p.featured !== undefined || p.status === "featured") {
        await store.setFeatured(id, p.featured ?? p.status === "featured");
      }
    } else if (env.RL_KV) {
      // No deployer key — persist override in KV so UI reflects the change
      const existing = JSON.parse((await env.RL_KV.get(`video:status:${id}`)) || "{}");
      await env.RL_KV.put(`video:status:${id}`, JSON.stringify({
        ...existing,
        ...(p.status !== undefined ? { status: p.status } : {}),
        ...(p.featured !== undefined ? { featured: p.featured } : {}),
        by: who.address, at: Date.now(),
      }));
    }

    // Price override in KV (changing price on-chain requires the author's signature)
    if (p.price_per_sec_usdc !== undefined && env.RL_KV) {
      await env.RL_KV.put(`video:price:${id}`, p.price_per_sec_usdc);
    }

    return json({ ok: true, id, ...p });
  } catch (e: any) {
    return err(e.message || "Failed to update", 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);

  const id = Number(params.id);
  if (!id) return err("Bad id");

  try {
    const cfg_store = await getConfig(env);
    const chain = await chainFor(env);
    const pk = (env as any).DEPLOYER_PRIVATE_KEY as string | undefined;

    if (pk && cfg_store.contentStore) {
      const signer = new ethers.Wallet(pk, chain.provider);
      const store = new ethers.Contract(cfg_store.contentStore, ContentStoreAbi as ethers.InterfaceAbi, signer);
      try { await store.remove(id); } catch { /* already removed or no gas — fall through */ }
    }

    // Purge R2 files
    if (env.RL_R2) {
      await env.RL_R2.delete(`video/${id}`).catch(() => {});
      await env.RL_R2.delete(`thumb/${id}`).catch(() => {});
    }

    // KV tombstone so listing reflects removal without on-chain tx
    if (env.RL_KV) {
      await env.RL_KV.put(`video:status:${id}`, JSON.stringify({ status: "removed", featured: false, by: who.address, at: Date.now() }));
    }

    return json({ ok: true, id });
  } catch (e: any) {
    return err(e.message || "Failed to delete", 500);
  }
};
