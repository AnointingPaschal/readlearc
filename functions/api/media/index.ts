import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { sha } from "../../_lib/bank";

/** POST /api/media {data: "data:image/jpeg;base64,…"} → {url, id}
 *  Post photos are stored off-chain (KV) and only the short /api/media/<id> link goes on-chain — big photos in calldata exceed
 *  what a transaction can carry. The id is the SHA-256 of the image, so the same photo is stored once and a link can't be swapped quietly. */
const MAX_CHARS = 700_000;            // ≈ 520 KB of image
const DAILY_CAP = 80;                 // uploads per wallet per day
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who) return err("Sign in with your wallet first", 401);
  if (!env.RL_KV) return err("Storage isn't configured", 503);
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const data = String(p?.data || "");
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!m) return err("Only JPEG, PNG or WebP photos are supported");
  if (data.length > MAX_CHARS) return err("That photo is too large — try a smaller one", 413);

  const day = new Date().toISOString().slice(0, 10), ck = `media:cnt:${who.address.toLowerCase()}:${day}`;
  const used = Number((await env.RL_KV.get(ck)) || 0);
  if (used >= DAILY_CAP) return err("Daily photo upload limit reached", 429);

  const id = (await sha(data)).slice(0, 32);
  const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  await env.RL_KV.put(`media:${id}`, bin, { metadata: { type: m[1], by: who.address.toLowerCase(), at: Date.now() } });
  await env.RL_KV.put(ck, String(used + 1), { expirationTtl: 60 * 60 * 36 });
  return json({ id, url: `/api/media/${id}` });
};
