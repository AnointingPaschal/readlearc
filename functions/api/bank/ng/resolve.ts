import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { errResp, isResp, paystack, qs, requireUser } from "../../../_lib/bank";

/** POST /api/bank/ng/resolve {accountNumber, bankCode} → {accountName}. Confirms the account (NUBAN) before anything is saved. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  if (!/^\d{10}$/.test(String(p?.accountNumber || ""))) return err("Account number must be 10 digits");
  if (!p?.bankCode) return err("Choose a bank");
  try {
    const d = await paystack(env, `/bank/resolve${qs({ account_number: p.accountNumber, bank_code: p.bankCode })}`);
    return json({ accountName: d?.data?.account_name });
  } catch (e) { return errResp(e); }
};
