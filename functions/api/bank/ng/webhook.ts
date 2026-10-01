import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { bankCfg, cashKey, CASH_ALL, kvPatch, type Cashout } from "../../../_lib/bank";

/** POST /api/bank/ng/webhook — set this URL as the webhook in the Paystack dashboard; updates cash-out status (transfer.success / failed / reversed).
 *  Authenticated by Paystack's x-paystack-signature = HMAC-SHA512(body, secret key). */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const raw = await request.text();
  const c = await bankCfg(env);
  if (!c.paystackKey) return err("not configured", 503);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(c.paystackKey), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (mac !== request.headers.get("x-paystack-signature")) return err("bad signature", 401);
  let ev: any; try { ev = JSON.parse(raw); } catch { return err("Bad JSON"); }
  const m: Record<string, Cashout["status"]> = { "transfer.success": "success", "transfer.failed": "failed", "transfer.reversed": "reversed" };
  const status = m[ev?.event as string];
  const ref = ev?.data?.reference as string | undefined;
  if (status && ref?.startsWith("rl_")) {
    const all = ((await env.RL_KV.get(CASH_ALL, "json")) as Cashout[] | null) ?? [];
    const rec = all.find((x) => x.id === ref);
    if (rec) {
      const patch = { status, updatedAt: Date.now(), ...(status !== "success" ? { error: ev?.data?.reason || ev?.data?.status } : {}) };
      await kvPatch<Cashout>(env, CASH_ALL, ref, patch);
      await kvPatch<Cashout>(env, cashKey(rec.address), ref, patch);
    }
  }
  return json({ ok: true });
};
