import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { errResp } from "../../_lib/bank";
import { ciphertext, dcwCall, dcwCfg } from "../../_lib/dcw";
import { saveSettings } from "../../_lib/store";

/** Admin only.
 *  GET  /api/dcw/admin — connection check: Circle entity app id, whether the entity secret & wallet set are present.
 *  POST /api/dcw/admin — create a wallet set (once) and save its id: {name?}. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await authenticate(request, env, ""); if (!who?.admin) return err("Admin only", 401);
  const c = await dcwCfg(env);
  const out: Record<string, unknown> = { entitySecret: Boolean(c.entitySecret), walletSetId: c.walletSetId, blockchain: c.blockchain, hasKey: Boolean(c.key) };
  if (c.key) {
    try { out.appId = (await dcwCall(c, "/v1/w3s/config/entity"))?.data?.appId; out.ok = true; }
    catch (e) { out.ok = false; out.error = (e as Error).message; }
    if (out.ok && c.entitySecret) { try { await ciphertext(c); out.cipherOk = true; } catch (e) { out.cipherOk = false; out.cipherError = (e as Error).message; } }
  }
  return json(out);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body); if (!who?.admin) return err("Admin only", 401);
  const c = await dcwCfg(env);
  if (c.walletSetId) return err("A wallet set is already configured — one is enough for all users.", 409);
  let p: any = {}; try { p = JSON.parse(body || "{}"); } catch { /* default */ }
  try {
    const d = await dcwCall(c, "/v1/w3s/developer/walletSets", { method: "POST", body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(), entitySecretCiphertext: await ciphertext(c), name: String(p.name || "Readlearc users").slice(0, 50),
    }) });
    const id = d?.data?.walletSet?.id;
    if (!id) return err("Circle returned no wallet set", 502);
    await saveSettings(env, { dcw_wallet_set_id: id });
    return json({ walletSetId: id });
  } catch (e) { return errResp(e, true); }
};
