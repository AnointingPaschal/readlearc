import type { Env } from "../_lib/env";
import { err, json } from "../_lib/env";
import { getConfig, saveConfig } from "../_lib/store";
import { authenticate } from "../_lib/auth";

/** GET  → public runtime config (chain + contract addresses) read by the SPA at boot.
 *  PUT  → admin only: save edited config to KV (Admin → Finance → Contracts). */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const cfg = await getConfig(env);
  return json(cfg, 200, { "Cache-Control": "public, max-age=15" });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin wallet signature required. (First time? set the ADMIN_ADDRESSES env var in Cloudflare Pages.)", 401);
  let patch: Record<string, unknown>;
  try { patch = JSON.parse(body); } catch { return err("Invalid JSON"); }
  try { await saveConfig(env, patch); } catch (e) { return err((e as Error).message, 500); }
  return json({ ok: true, config: await getConfig(env) });
};
export const onRequestPost = onRequestPut;
