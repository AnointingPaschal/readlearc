import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { bankCfg, cashKey, CASH_ALL, kvPatch, type Cashout } from "../../../_lib/bank";

/** POST /api/bank/ng/webhook — one URL for both providers; payout statuses update from whichever one calls it.
 *  Flutterwave: the secret hash you set in its dashboard, sent as `verif-hash` (or `flutterwave-signature` = HMAC-SHA256 base64 of the body).
 *  Paystack: `x-paystack-signature` = HMAC-SHA512(body, secret key). */
const safeEq = (a: string, b: string) => { if (!a || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const hmac = async (algo: "SHA-256" | "SHA-512", key: string, data: string) =>
  new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: algo }, false, ["sign"]), new TextEncoder().encode(data)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const raw = await request.text();
  const c = await bankCfg(env);
  let from: "paystack" | "flutterwave" | null = null;
  const psSig = request.headers.get("x-paystack-signature");
  if (psSig && c.paystackKey) {
    const mac = Array.from(await hmac("SHA-512", c.paystackKey, raw)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (safeEq(mac, psSig)) from = "paystack";
  } else if (c.flwHash) {
    if (safeEq(request.headers.get("verif-hash") || "", c.flwHash)) from = "flutterwave";
    const sig = request.headers.get("flutterwave-signature");
    if (!from && sig && safeEq(btoa(String.fromCharCode(...(await hmac("SHA-256", c.flwHash, raw)))), sig)) from = "flutterwave";
  }
  if (!from) return err(psSig || c.flwHash || c.paystackKey ? "bad signature" : "not configured", psSig || c.flwHash || c.paystackKey ? 401 : 503);
  let ev: any; try { ev = JSON.parse(raw); } catch { return err("Bad JSON"); }

  let status: Cashout["status"] | null = null, ref: string | undefined, reason: string | undefined;
  if (from === "paystack") {
    status = ({ "transfer.success": "success", "transfer.failed": "failed", "transfer.reversed": "reversed" } as Record<string, Cashout["status"]>)[ev?.event as string] ?? null;
    ref = ev?.data?.reference; reason = ev?.data?.reason || ev?.data?.status;
  } else {
    const d = ev?.data ?? ev?.["event.data"] ?? {}, st = String(d.status || "").toUpperCase();
    if (/transfer/i.test(String(ev?.event || ev?.type || ""))) status = st === "SUCCESSFUL" ? "success" : st === "FAILED" ? "failed" : null;
    ref = d.reference; reason = d.complete_message || d.status;
  }
  if (status && ref?.startsWith("rl_")) {
    const all = ((await env.RL_KV.get(CASH_ALL, "json")) as Cashout[] | null) ?? [];
    const rec = all.find((x) => x.id === ref);
    if (rec) {
      const patch = { status, updatedAt: Date.now(), ...(status !== "success" ? { error: reason } : {}) };
      await kvPatch<Cashout>(env, CASH_ALL, ref, patch);
      await kvPatch<Cashout>(env, cashKey(rec.address), ref, patch);
    }
  }
  return json({ ok: true });
};
