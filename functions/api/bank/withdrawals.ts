import type { Env } from "../../_lib/env";
import { json } from "../../_lib/env";
import { bankCfg, circle, errResp, isResp, kvList, qs, requireUser, wiresKey, type WireLink } from "../../_lib/bank";

/** GET /api/bank/withdrawals — Circle bank withdrawals (fiat off-ramp). Admins see all (?all=1); users see payouts to their own bank accounts. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const u = new URL(request.url).searchParams;
  try {
    const c = await bankCfg(env);
    const d = await circle(env, `/v1/accounts/withdrawals${qs({ accountId: c.circleAccount, status: u.get("status"), from: u.get("from"), to: u.get("to"), pageSize: u.get("pageSize") || 50, pageAfter: u.get("pageAfter"), pageBefore: u.get("pageBefore") })}`);
    const rows: any[] = d?.data ?? [];
    if (who.admin && u.get("all")) return json({ data: rows });
    const mine = new Set((await kvList<WireLink>(env, wiresKey(who.address))).map((w) => w.id));
    return json({ data: rows.filter((r) => mine.has(r.destination?.id)) });
  } catch (e) { return errResp(e, who.admin); }
};
