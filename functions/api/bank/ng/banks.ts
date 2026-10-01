import type { Env } from "../../../_lib/env";
import { json } from "../../../_lib/env";
import { NG_BANKS_FALLBACK, flutterwave } from "../../../_lib/bank";

/** GET /api/bank/ng/banks — Nigerian banks {name, code}. Live list from Flutterwave (cached 24h in KV), static fallback otherwise. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const hit = env.RL_KV ? ((await env.RL_KV.get("bank:ng:list", "json")) as { name: string; code: string }[] | null) : null;
    if (hit?.length) return json({ data: hit }, 200, { "Cache-Control": "public, max-age=3600" });
    const d = await flutterwave(env, "/banks/NG");
    const list = ((d?.data ?? []) as any[]).filter((b) => b.code && b.name).map((b) => ({ name: String(b.name), code: String(b.code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (list.length) { await env.RL_KV?.put("bank:ng:list", JSON.stringify(list), { expirationTtl: 86400 }); return json({ data: list }, 200, { "Cache-Control": "public, max-age=3600" }); }
  } catch { /* fall through */ }
  return json({ data: NG_BANKS_FALLBACK, fallback: true }, 200, { "Cache-Control": "public, max-age=300" });
};
