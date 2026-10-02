import type { Env } from "./env";
import { BankError, bankCfg, flutterwave, paystack, qs, NG_BANKS_FALLBACK, type NgAccount, type Cashout } from "./bank";

/** One interface over the two Naira payout providers; the admin picks which is active (Admin → Finance → Banking). */
export type Provider = "flutterwave" | "paystack";
export type Status = Cashout["status"];

/** Wallet-style banks are listed under different codes by different providers — try the known alternates if a code is rejected. */
const ALT: Record<string, string[]> = { opay: ["999992", "305", "100004"], paycom: ["305", "999992", "100004"], palmpay: ["999991", "100033"] };
const norm = (n: string) => n.toLowerCase().replace(/\b(plc|limited|ltd|bank|microfinance|mfb|digital services|nigeria)\b/g, "").replace(/[^a-z0-9]/g, "");

export async function listBanks(env: Env, p?: Provider): Promise<{ name: string; code: string }[]> {
  const prov = p ?? (await bankCfg(env)).provider;
  const kv = `bank:ng:list:${prov === "paystack" ? "ps" : "flw"}`;
  const hit = (await env.RL_KV?.get(kv, "json")) as { name: string; code: string }[] | null;
  if (hit?.length) return hit;
  try {
    const list = prov === "paystack"
      ? (((await paystack(env, "/bank?country=nigeria&perPage=200&use_cursor=false"))?.data ?? []) as any[]).filter((b) => b.active !== false && !b.is_deleted).map((b) => ({ name: String(b.name), code: String(b.code) }))
      : (((await flutterwave(env, "/banks/NG"))?.data ?? []) as any[]).filter((b) => b.code && b.name).map((b) => ({ name: String(b.name), code: String(b.code) }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    if (list.length) { await env.RL_KV?.put(kv, JSON.stringify(list), { expirationTtl: 86400 }); return list; }
  } catch { /* fall through */ }
  return NG_BANKS_FALLBACK;
}

/** Confirm a NUBAN account and return the holder's name (and the bank code that worked). */
export async function resolveAccount(env: Env, accountNumber: string, bankCode: string, bankName = ""): Promise<{ name: string; code: string }> {
  try { return await resolveRaw(env, accountNumber, bankCode, bankName); }
  catch (e) {
    const be = e as BankError;
    // a 4xx from the provider means "that account/bank isn't valid" — say so plainly; the technical text is for admins only
    if (be instanceof BankError && be.upstream && be.status >= 400 && be.status < 500 && be.status !== 401 && be.status !== 403) throw new BankError("We couldn't verify that account — check the number and bank", 400, undefined, false, be.message);
    throw e;
  }
}
async function resolveRaw(env: Env, accountNumber: string, bankCode: string, bankName: string): Promise<{ name: string; code: string }> {
  const { provider } = await bankCfg(env);
  if (provider === "paystack") {
    const d = await paystack(env, `/bank/resolve${qs({ account_number: accountNumber, bank_code: bankCode })}`);
    if (!d?.data?.account_name) throw new BankError("We couldn't verify that account — check the number and bank", 400);
    return { name: String(d.data.account_name), code: bankCode };
  }
  const key = Object.keys(ALT).find((k) => bankName.toLowerCase().includes(k));
  let last: unknown;
  for (const code of [bankCode, ...(key ? ALT[key].filter((c) => c !== bankCode) : [])]) {
    try {
      const r = await flutterwave(env, "/accounts/resolve", { method: "POST", body: JSON.stringify({ account_number: accountNumber, account_bank: code }) });
      if (r?.data?.account_name) return { name: String(r.data.account_name), code };
    } catch (e) { last = e; if (!/bank code|unknown bank/i.test((e as Error).message)) throw e; }
  }
  throw new BankError(((last as Error)?.message || "We couldn't verify that account") + ` (bank code ${bankCode})`, 400);
}

/** The bank code to use with the ACTIVE provider for a saved account (re-mapped by bank name if it was saved under the other provider). */
async function codeFor(env: Env, acct: NgAccount, prov: Provider): Promise<string> {
  if (!acct.provider || acct.provider === prov) return acct.bankCode;
  const list = await listBanks(env, prov), n = norm(acct.bankName);
  const m = list.find((b) => norm(b.name) === n) || list.find((b) => n && (norm(b.name).includes(n) || n.includes(norm(b.name))));
  if (!m) throw new BankError("Please remove this bank account and add it again — the payout provider changed", 400);
  return m.code;
}

/** Start a payout. `reference` is derived from the on-chain tx hash, so repeating it can never pay twice. */
export async function sendPayout(env: Env, acct: NgAccount, ngn: number, reference: string): Promise<{ code?: string; status: Status; provider: Provider }> {
  const { provider } = await bankCfg(env);
  if (provider === "paystack") {
    let recipient = acct.recipientCode;
    if (!recipient) {
      if (!acct.accountNumber) throw new BankError("Please remove this bank account and add it again — the payout provider changed", 400);
      const r = await paystack(env, "/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: acct.accountName || "Readlearc user", account_number: acct.accountNumber, bank_code: await codeFor(env, acct, "paystack"), currency: "NGN" }) });
      recipient = r?.data?.recipient_code;
    }
    const t = await paystack(env, "/transfer", { method: "POST", body: JSON.stringify({ source: "balance", amount: Math.round(ngn * 100), recipient, reason: "Readlearc cash-out", reference, currency: "NGN" }) });
    const st = t?.data?.status;
    return { provider, code: t?.data?.transfer_code, status: st === "success" ? "success" : st === "failed" ? "failed" : "processing" };
  }
  if (!acct.accountNumber) throw new BankError("Please remove this bank account and add it again — the payout provider changed", 400);
  const t = await flutterwave(env, "/transfers", { method: "POST", body: JSON.stringify({ account_bank: await codeFor(env, acct, "flutterwave"), account_number: acct.accountNumber, amount: ngn, currency: "NGN", debit_currency: "NGN", narration: "Readlearc cash-out", reference }) });
  const st = String(t?.data?.status || "").toUpperCase();
  return { provider, code: t?.data?.id != null ? String(t.data.id) : undefined, status: st === "SUCCESSFUL" ? "success" : st === "FAILED" ? "failed" : "processing" };
}

/** Current status of a payout that was `processing`, from the provider that made it. */
export async function payoutStatus(env: Env, c: Cashout): Promise<Status | null> {
  const prov: Provider = c.provider ?? "paystack";            // records from before the switch were Paystack's
  if (prov === "paystack") {
    const st = (await paystack(env, `/transfer/verify/${c.id}`))?.data?.status;
    return st === "success" ? "success" : st === "failed" ? "failed" : st === "reversed" ? "reversed" : null;
  }
  if (!c.transferCode) return null;
  const st = String((await flutterwave(env, `/transfers/${encodeURIComponent(c.transferCode)}`))?.data?.status || "").toUpperCase();
  return st === "SUCCESSFUL" ? "success" : st === "FAILED" ? "failed" : null;
}

/** NGN balance of the active provider's payout account, in kobo. */
export async function balances(env: Env, prov: Provider): Promise<{ currency: string; balance: number }[]> {
  if (prov === "paystack") return ((await paystack(env, "/balance"))?.data ?? []) as { currency: string; balance: number }[];
  const b = (await flutterwave(env, "/balances/NGN"))?.data;
  return b ? [{ currency: "NGN", balance: Math.round(Number(b.available_balance) * 100) }] : [];
}
