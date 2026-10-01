import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { errResp, isResp, kvList, ngKey, paystack, requireUser, type NgAccount } from "../../../_lib/bank";

/** GET    /api/bank/ng/accounts           — the caller's saved Nigerian bank accounts
 *  POST   /api/bank/ng/accounts           — {accountNumber, bankCode, bankName}: verify at Paystack, create a transfer recipient, save
 *  DELETE /api/bank/ng/accounts?id=<id>   — remove one */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  return json({ data: await kvList<NgAccount>(env, ngKey(who.address)) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const accountNumber = String(p?.accountNumber || "");
  if (!/^\d{10}$/.test(accountNumber)) return err("Account number must be 10 digits");
  if (!p?.bankCode || !p?.bankName) return err("Choose a bank");
  try {
    const cur = await kvList<NgAccount>(env, ngKey(who.address));
    if (cur.length >= 5) return err("You can save up to 5 bank accounts — remove one first");
    if (cur.some((a) => a.bankCode === p.bankCode && a.last4 === accountNumber.slice(-4) && a.id.endsWith(accountNumber.slice(-4)))) return err("That account is already saved");
    const r = await paystack(env, "/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: p.accountName || "Readlearc user", account_number: accountNumber, bank_code: p.bankCode, currency: "NGN" }) });
    const d = r?.data;
    const acct: NgAccount = {
      id: `${d.recipient_code}-${accountNumber.slice(-4)}`, bankCode: p.bankCode, bankName: p.bankName,
      accountName: d.details?.account_name || p.accountName || "", last4: accountNumber.slice(-4), recipientCode: d.recipient_code, createdAt: Date.now(),
    };
    await env.RL_KV.put(ngKey(who.address), JSON.stringify([acct, ...cur]));
    return json({ data: acct });
  } catch (e) { return errResp(e); }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const id = new URL(request.url).searchParams.get("id");
  const cur = await kvList<NgAccount>(env, ngKey(who.address));
  await env.RL_KV.put(ngKey(who.address), JSON.stringify(cur.filter((a) => a.id !== id)));
  return json({ ok: true });
};
