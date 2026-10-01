import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { bankCfg, cashKey, CASH_ALL, kvPatch, type Cashout } from "../../../_lib/bank";

/** POST /api/bank/ng/webhook — set this URL as the webhook in Flutterwave → Settings → Webhooks; updates cash-out status (transfer.completed).
 *  Authenticated by the secret hash you choose in the dashboard: sent as the `verif-hash` header (v3) or used to sign the body (`flutterwave-signature`, HMAC-SHA256 base64). */
const safeEq = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const raw = await request.text();
  const c = await bankCfg(env);
  if (!c.flwHash) return err("not configured", 503);
  let ok = safeEq(request.headers.get("verif-hash") || "", c.flwHash);
  const sig = request.headers.get("flutterwave-signature");
  if (!ok && sig) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(c.flwHash), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))));
    ok = safeEq(mac, sig);
  }
  if (!ok) return err("bad signature", 401);
  let ev: any; try { ev = JSON.parse(raw); } catch { return err("Bad JSON"); }
  const d = ev?.data ?? ev?.["event.data"] ?? {};
  const st = String(d.status || "").toUpperCase();
  const status: Cashout["status"] | null = st === "SUCCESSFUL" ? "success" : st === "FAILED" ? "failed" : null;
  const ref = d.reference as string | undefined;
  if (/transfer/i.test(String(ev?.event || ev?.type || "")) && status && ref?.startsWith("rl_")) {
    const all = ((await env.RL_KV.get(CASH_ALL, "json")) as Cashout[] | null) ?? [];
    const rec = all.find((x) => x.id === ref);
    if (rec) {
      const patch = { status, updatedAt: Date.now(), ...(status !== "success" ? { error: d.complete_message || d.status } : {}) };
      await kvPatch<Cashout>(env, CASH_ALL, ref, patch);
      await kvPatch<Cashout>(env, cashKey(rec.address), ref, patch);
    }
  }
  return json({ ok: true });
};
