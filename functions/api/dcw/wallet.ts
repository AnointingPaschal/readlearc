import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { errResp, isResp, requireUser } from "../../_lib/bank";
import { ciphertext, dcwCall, dcwCfg, dcwKey, dcwReady, getManaged, idemKey, type Managed } from "../../_lib/dcw";
import { getConfig } from "../../_lib/store";

/** GET  /api/dcw/wallet — {enabled, wallet, balance} for the signed-in user's managed wallet.
 *  POST /api/dcw/wallet — create it (one per user; safe to retry). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const c = await dcwCfg(env);
  const enabled = dcwReady(c);
  const wallet = await getManaged(env, who.address);
  let balance: string | null = null;
  if (enabled && wallet) {
    try {
      const usdc = ((await getConfig(env)).usdc || "").toLowerCase();
      const d = await dcwCall(c, `/v1/w3s/wallets/${wallet.walletId}/balances`);
      const tb = (d?.data?.tokenBalances ?? []) as any[];
      const t = tb.find((x) => String(x.token?.tokenAddress || "").toLowerCase() === usdc) || tb.find((x) => x.token?.symbol === "USDC") || tb.find((x) => x.token?.isNative);
      balance = t?.amount ?? "0";
    } catch (e) { return json({ enabled, wallet, balance: null, error: (e as Error).message }); }
  }
  return json({ enabled, wallet, balance });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  const c = await dcwCfg(env);
  if (!dcwReady(c)) return err("Managed wallets aren't enabled yet", 503);
  try {
    const have = await getManaged(env, who.address);
    if (have) return json({ wallet: have });
    const d = await dcwCall(c, "/v1/w3s/developer/wallets", { method: "POST", body: JSON.stringify({
      idempotencyKey: await idemKey("wallet:" + who.address.toLowerCase()), entitySecretCiphertext: await ciphertext(c),
      walletSetId: c.walletSetId, blockchains: [c.blockchain], count: 1, accountType: "EOA", metadata: [{ refId: who.address.toLowerCase().slice(0, 50) }],
    }) });
    const w = d?.data?.wallets?.[0];
    if (!w?.id) return err("Circle returned no wallet", 502);
    const rec: Managed = { walletId: w.id, address: w.address, blockchain: w.blockchain || c.blockchain, createdAt: Date.now() };
    await env.RL_KV.put(dcwKey(who.address), JSON.stringify(rec));
    return json({ wallet: rec });
  } catch (e) { return errResp(e, who.admin); }
};
