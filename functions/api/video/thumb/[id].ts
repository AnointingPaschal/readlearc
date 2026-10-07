/**
 * GET /api/video/thumb/<id> — thumbnail from R2, immutably cached.
 */
import type { Env } from "../../../_lib/env";
import { err } from "../../../_lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.RL_R2) return err("Storage not configured", 503);
  const id = String(params.id || "").replace(/[^0-9]/g, "");
  if (!id) return err("Not found", 404);
  const obj = await env.RL_R2.get(`thumb/${id}`);
  if (!obj) return err("Not found", 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
