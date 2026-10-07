/**
 * GET /api/video/stream/<id>
 * Streams the video from R2, with byte-range support for seeking.
 * The <id> is the on-chain content id (number).
 * Looks up the R2 key from KV metadata: kv key `video:r2key:<id>`.
 * If no KV entry exists it falls back to scanning R2 with prefix `video/<id>/`.
 */
import type { Env } from "../../../_lib/env";
import { err } from "../../../_lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, request, env }) => {
  if (!env.RL_R2) return err("Video storage not configured", 503);

  const id = String(params.id || "").replace(/[^0-9]/g, "");
  if (!id) return err("Not found", 404);

  // Look up the R2 key — stored in KV when the upload completes, or scan prefix
  let key: string | null = null;
  if (env.RL_KV) {
    key = await env.RL_KV.get(`video:r2key:${id}`);
  }
  if (!key) {
    // Fallback: list objects with prefix video/<id>/
    const list = await env.RL_R2.list({ prefix: `video/${id}/`, limit: 1 });
    if (list.objects.length) key = list.objects[0].key;
  }
  if (!key) return err("Video not found", 404);

  const range = request.headers.get("Range");
  let object: R2ObjectBody | null;

  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = parseInt(m[1]);
      const end = m[2] ? parseInt(m[2]) : undefined;
      object = await env.RL_R2.get(key, { range: { offset: start, length: end !== undefined ? end - start + 1 : undefined } });
      if (!object) return err("Not found", 404);
      const total = object.size;
      const chunkEnd = end !== undefined ? end : total - 1;
      return new Response(object.body, {
        status: 206,
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "video/mp4",
          "Content-Range": `bytes ${start}-${chunkEnd}/${total}`,
          "Content-Length": String(chunkEnd - start + 1),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  object = await env.RL_R2.get(key);
  if (!object) return err("Not found", 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "video/mp4",
      "Content-Length": String(object.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
