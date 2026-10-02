import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { bankCfg, cashKey, CASH_ALL, errResp, ethers, isResp, kvList, kvPush, kvPatch, ngKey, requireUser, type Cashout, type NgAccount } from "../../../_lib/bank";
import { payoutStatus, sendPayout } from "../../../_lib/ngpay";
import { chainFor } from "../../../_lib/chain";
import { getManaged } from "../../../_lib/dcw";

/** Plain-language reason for a failed payout (the raw the payout provider text is kept in the record for admins). */
const friendly = (m?: string) => /balance|insufficient|funds/i.test(m || "") ? "Payouts are temporarily unavailable. Your USDC is safe — press Retry in a little while." : /administrator|cannot be processed|third.?party|not enabled|disabled|permission|otp|ip |whitelist|not allowed|unauthori/i.test(m || "") ? "Bank transfers aren't enabled on the payout account yet. Your USDC is safe — contact support." : (m || "The bank payout failed") + " — your USDC is safe; press Retry.";
const TRANSFER = ethers.id("Transfer(address,address,uint256)");
const ERC20 = ["function decimals() view returns (uint8)"];

/** GET  /api/bank/ng/cashout — the caller's cash-out history (statuses refreshed from the payout provider while processing).
 *  POST /api/bank/ng/cashout {txHash, accountId} — the user has already sent USDC to the treasury; verify that transfer on-chain,
 *       convert at the admin-set rate (minus fee) and pay the NGN into their saved bank account via the payout provider.
 *  Safety: the on-chain transfer must come FROM the signed-in wallet TO the treasury, each tx hash is honoured once, and the
 *  the payout provider reference is derived from the tx hash so a retry can never pay twice. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const list = await kvList<Cashout>(env, cashKey(who.address));
  await Promise.all(list.filter((c) => c.status === "processing").map(async (c) => {
    try {
      const next = await payoutStatus(env, c);
      if (next) { c.status = next; await kvPatch<Cashout>(env, cashKey(who.address), c.id, { status: next, updatedAt: Date.now() }); await kvPatch<Cashout>(env, CASH_ALL, c.id, { status: next, updatedAt: Date.now() }); }
    } catch { /* leave as is */ }
  }));
  return json({ data: list });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const txHash = String(p?.txHash || "");
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) return err("Bad transaction hash");
  try {
    const c = await bankCfg(env);
    const chain = await chainFor(env);
    const treasury = chain.cfg.treasury, usdc = chain.cfg.usdc;
    if (!c.providerReady || c.rate <= 0 || !treasury || !usdc) return err("NGN cash-out isn't enabled yet", 503);
    const acct = (await kvList<NgAccount>(env, ngKey(who.address))).find((a) => a.id === p.accountId);
    if (!acct) return err("Choose one of your saved bank accounts");
    const id = "rl_" + txHash.slice(2, 42).toLowerCase();                      // the payout provider reference (unique per transfer)
    // A tx hash is honoured once. If an earlier attempt ended before the payout provider accepted a transfer (crash, or the payout provider refused), it may be retried:
    // the the payout provider reference is derived from the tx hash, so a retry can never pay twice.
    const prior = (await kvList<Cashout>(env, cashKey(who.address))).find((x) => x.id === id);
    if (prior && (prior.status !== "failed" || prior.transferCode)) return json({ data: prior });          // already handled → idempotent answer
    if (!prior && (await env.RL_KV.get(`bank:cash-tx:${txHash.toLowerCase()}`)) && (await env.RL_KV.get(`bank:cash-tx:${txHash.toLowerCase()}`)) !== who.address) return err("That transaction was already cashed out", 409);

    // verify the USDC transfer on-chain
    let receipt = null as ethers.TransactionReceipt | null;
    for (let i = 0; i < 6 && !receipt; i++) { receipt = await chain.provider.getTransactionReceipt(txHash); if (!receipt) await new Promise((r) => setTimeout(r, 1500)); }
    if (!receipt || receipt.status !== 1) return err("Transaction not confirmed yet — wait a moment and try again", 409);
    // Prefer the ERC-20 Transfer event; fall back to decoding the call itself (some USDC deployments, e.g. Arc's native-USDC interface, may not emit one).
    const dec = Number(await new ethers.Contract(usdc, ERC20, chain.provider).decimals());
    let raw: bigint | null = null;
    // the sender may be the signed-in wallet or that user's own managed (Circle developer-controlled) wallet
    const senders = new Set([who.address]);
    const mw = await getManaged(env, who.address); if (mw) senders.add(ethers.getAddress(mw.address));
    const log = receipt.logs.find((l) => l.address.toLowerCase() === usdc.toLowerCase() && l.topics[0] === TRANSFER && l.topics.length >= 3
      && senders.has(ethers.getAddress("0x" + l.topics[1].slice(26))) && ethers.getAddress("0x" + l.topics[2].slice(26)) === ethers.getAddress(treasury));
    if (log) raw = BigInt(log.data);
    else {
      const tx = await chain.provider.getTransaction(txHash);
      if (tx && tx.to?.toLowerCase() === usdc.toLowerCase() && senders.has(ethers.getAddress(tx.from))) {
        try {
          const parsed = new ethers.Interface(["function transfer(address to, uint256 amount)"]).parseTransaction({ data: tx.data });
          if (parsed && ethers.getAddress(parsed.args[0]) === ethers.getAddress(treasury)) raw = BigInt(parsed.args[1]);
        } catch { /* not a plain transfer */ }
      }
    }
    if (raw === null) return err("No USDC transfer from your wallet to the treasury in that transaction", 400);
    const amountUsd = Number(ethers.formatUnits(raw, dec));
    if (amountUsd < c.minUsd || amountUsd > c.maxUsd) return err(`Cash-out must be between $${c.minUsd} and $${c.maxUsd}. Contact support to recover this transfer.`, 400);

    const feeUsd = +(amountUsd * c.feePct / 100).toFixed(6);
    const ngn = Math.floor((amountUsd - feeUsd) * c.rate * 100) / 100;
    await env.RL_KV.put(`bank:cash-tx:${txHash.toLowerCase()}`, who.address, { expirationTtl: 60 * 60 * 24 * 365 });

    const rec: Cashout = { id, txHash, address: who.address, amountUsd, feeUsd, rate: c.rate, ngn, bankName: acct.bankName, accountName: acct.accountName, last4: acct.last4, status: "processing", createdAt: Date.now() };
    try {
      const t = await sendPayout(env, acct, ngn, id);
      rec.provider = t.provider; rec.transferCode = t.code; rec.status = t.status;
    } catch (e) {
      rec.status = "failed"; rec.error = (e as Error).message;
    }
    if (prior) { await kvPatch<Cashout>(env, cashKey(who.address), id, rec); await kvPatch<Cashout>(env, CASH_ALL, id, rec); }
    else { await kvPush(env, cashKey(who.address), rec, 100); await kvPush(env, CASH_ALL, rec, 300); }
    if (rec.status === "failed") return json({ error: friendly(rec.error), data: rec }, 502);
    return json({ data: rec });
  } catch (e) { return errResp(e); }
};
