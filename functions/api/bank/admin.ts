import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { bankCfg, CASH_ALL, circle, kvList, flutterwave, type Cashout } from "../../_lib/bank";

/** GET /api/bank/admin — admin only: connection tests for Circle & Flutterwave, Flutterwave balance, all NGN cash-outs. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);
  const c = await bankCfg(env);
  const test = async (fn: () => Promise<unknown>) => { try { return { ok: true, data: await fn() }; } catch (e) { return { ok: false, error: (e as Error).message }; } };
  const [ci, fw] = await Promise.all([
    c.circleKey ? test(() => circle(env, `/v1/accounts/withdrawals?pageSize=1${c.circleAccount ? `&accountId=${c.circleAccount}` : ""}`)) : { ok: false, error: "No API key" },
    c.flwKey ? test(async () => { const b = (await flutterwave(env, "/balances/NGN"))?.data; return b ? [{ currency: "NGN", balance: Math.round(Number(b.available_balance) * 100) }] : []; }) : { ok: false, error: "No secret key" },
  ]);
  return json({ circle: { ...ci, env: c.circleBase.includes("sandbox") ? "sandbox" : "production" }, flutterwave: fw, webhookSecret: Boolean(c.flwHash), cashouts: await kvList<Cashout>(env, CASH_ALL) });
};
