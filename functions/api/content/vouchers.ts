/** GET /api/content/vouchers — a creator's unsettled StreamPay vouchers (so they can close sessions
 *  and collect what viewers have streamed, even if the viewer never settles). */
import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { chainFor } from "../../_lib/chain";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const chain = await chainFor(env);
  const who = await authenticate(request, env, "", chain);
  if (!who) return err("Sign in with your wallet.", 401);
  const list = await env.RL_KV.list({ prefix: `vq:${who.address.toLowerCase()}:`, limit: 100 });
  const out: unknown[] = [];
  for (const k of list.keys) {
    const sid = k.name.split(":")[2];
    const v = (await env.RL_KV.get(`voucher:${sid}`, "json")) as { id: string } | null;
    if (!v) continue;
    // Only still-open sessions are interesting
    try { if (chain.stream && Number((await chain.stream.getSession(sid)).status) !== 0) { await env.RL_KV.delete(k.name); continue; } } catch { /* keep */ }
    out.push(v);
  }
  return json({ vouchers: out });
};
