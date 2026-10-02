import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { ethers, errResp, isResp, requireUser } from "../../_lib/bank";
import { ciphertext, dcwCall, dcwCfg, dcwReady, getManaged, idemKey } from "../../_lib/dcw";
import { getConfig } from "../../_lib/store";

/** POST /api/dcw/send {to, amount, nonce} — move USDC out of the caller's managed wallet. Circle signs it; we authorise with the entity secret.
 *  `nonce` (client-generated, per attempt) makes a double-click / retry idempotent: the same nonce can never send twice.
 *  GET  /api/dcw/send?id=<txId> — status + txHash. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const c = await dcwCfg(env);
  if (!dcwReady(c)) return err("Managed wallets aren't enabled yet", 503);
  if (!ethers.isAddress(p?.to)) return err("Invalid recipient address");
  const amt = Number(p?.amount);
  if (!(amt > 0) || !/^\d+(\.\d{1,6})?$/.test(String(p.amount))) return err("Enter a valid amount (up to 6 decimals)");
  if (amt > c.maxSendUsd) return err(`Managed-wallet sends are limited to $${c.maxSendUsd} each`);
  if (!p?.nonce || String(p.nonce).length < 8) return err("Missing nonce");
  try {
    const w = await getManaged(env, who.address);
    if (!w) return err("Create your managed wallet first", 400);
    if (ethers.getAddress(p.to) === ethers.getAddress(w.address)) return err("That's the managed wallet's own address");
    const usdc = ((await getConfig(env)).usdc || "").toLowerCase();
    const bal = await dcwCall(c, `/v1/w3s/wallets/${w.walletId}/balances`);
    const tb = (bal?.data?.tokenBalances ?? []) as any[];
    const t = tb.find((x) => String(x.token?.tokenAddress || "").toLowerCase() === usdc) || tb.find((x) => x.token?.symbol === "USDC");
    if (!t?.token?.id) return err("No USDC in this wallet yet", 400);
    if (Number(t.amount) < amt) return err("Amount is more than the wallet balance", 400);
    const d = await dcwCall(c, "/v1/w3s/developer/transactions/transfer", { method: "POST", body: JSON.stringify({
      idempotencyKey: await idemKey(`send:${who.address.toLowerCase()}:${p.nonce}`), entitySecretCiphertext: await ciphertext(c),
      walletId: w.walletId, destinationAddress: ethers.getAddress(p.to), amounts: [String(p.amount)], tokenId: t.token.id, feeLevel: "MEDIUM",
      refId: ("rl:" + who.address.toLowerCase()).slice(0, 50),
    }) });
    return json({ id: d?.data?.id, state: d?.data?.state });
  } catch (e) { return errResp(e, who.admin); }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return err("Bad id");
  const c = await dcwCfg(env);
  try {
    const w = await getManaged(env, who.address);
    const d = await dcwCall(c, `/v1/w3s/transactions/${id}`);
    const t = d?.data?.transaction;
    // only the wallet's owner may look at it
    if (!w || String(t?.sourceAddress || "").toLowerCase() !== w.address.toLowerCase()) return err("Not your transaction", 403);
    return json({ id, state: t.state, txHash: t.txHash || null, errorReason: t.errorReason || null });
  } catch (e) { return errResp(e, who.admin); }
};
