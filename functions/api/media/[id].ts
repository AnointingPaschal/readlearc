import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";

/** GET /api/media/<id> — the stored photo (immutable, cached for a year). DELETE — admins only (moderation). */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id || "");
  if (!/^[a-f0-9]{32}$/.test(id)) return err("Not found", 404);
  const r = await env.RL_KV.getWithMetadata<{ type?: string }>(`media:${id}`, "arrayBuffer");
  if (!r.value) return err("Not found", 404);
  return new Response(r.value, { headers: { "Content-Type": r.metadata?.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);
  const id = String(params.id || "");
  if (!/^[a-f0-9]{32}$/.test(id)) return err("Not found", 404);
  await env.RL_KV.delete(`media:${id}`);
  return json({ ok: true });
};
