/**
 * POST /api/video/upload
 * Accepts a multipart/form-data upload with fields:
 *   file      — the video file (mp4 / webm / etc.)
 *   meta      — JSON string: { id, slug, title, thumb? (base64 jpeg) }
 *
 * Stores the video in R2 at key `video/<id>/<slug>` and the thumb at `thumb/<id>`.
 * Returns { ok: true, videoUrl: "/api/video/stream/<id>", thumbUrl?: "/api/video/thumb/<id>" }
 *
 * Requires wallet authentication (same as /api/media).
 * Falls back gracefully when RL_R2 is not yet bound.
 */
import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB hard cap

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RL_R2) return err("Video storage (R2) is not configured yet. Add the RL_R2 binding in Cloudflare Pages settings.", 503);

  // Authenticate from the Authorization header (wallet sig), body is multipart so we pass empty string
  const who = await authenticate(request.clone() as unknown as Request, env, "");
  if (!who) return err("Sign in with your wallet first", 401);

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return err("Expected multipart/form-data", 400); }

  const file = formData.get("file") as File | null;
  const metaStr = formData.get("meta") as string | null;
  if (!file) return err("Missing video file");
  if (!metaStr) return err("Missing meta field");

  let meta: { id: number; slug: string; title: string; thumb?: string };
  try { meta = JSON.parse(metaStr); }
  catch { return err("Invalid meta JSON"); }

  if (!meta.id || !meta.slug) return err("meta must have id and slug");
  if (file.size > MAX_VIDEO_BYTES) return err(`Video is too large (max ${MAX_VIDEO_BYTES / 1e6} MB)`, 413);

  const videoKey = `video/${meta.id}/${meta.slug}`;
  const contentType = file.type || "video/mp4";

  // Stream directly to R2 — no buffering in memory
  await env.RL_R2.put(videoKey, file.stream(), {
    httpMetadata: { contentType },
    customMetadata: {
      uploader: who.address.toLowerCase(),
      title: meta.title.slice(0, 200),
      uploadedAt: String(Date.now()),
    },
  });

  // Store thumbnail if provided
  let thumbUrl: string | undefined;
  if (meta.thumb) {
    try {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(meta.thumb);
      if (m) {
        const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        await env.RL_R2.put(`thumb/${meta.id}`, bin, {
          httpMetadata: { contentType: m[1] },
        });
        thumbUrl = `/api/video/thumb/${meta.id}`;
      }
    } catch { /* thumb is optional */ }
  }

  return json({ ok: true, videoUrl: `/api/video/stream/${meta.id}`, thumbUrl });
};
