import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { getSettings, publicSettings, saveSettings } from "../../_lib/store";
import { authenticate } from "../../_lib/auth";

/** Platform settings live in Cloudflare KV. Anyone may read the non-secret ones (the homepage needs
 *  them); secrets (AI keys …) are only returned to a verified admin wallet. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const s = await getSettings(env);
  const who = await authenticate(request, env, "");
  return json(who?.admin ? s : publicSettings(s));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  try { await saveSettings(env, JSON.parse(body || "{}")); } catch (e) { return err((e as Error).message, 500); }
  return json({ ok: true });
};
export const onRequestPut = onRequestPost;
