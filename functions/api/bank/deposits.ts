import type { Env } from "../../_lib/env";
import { json } from "../../_lib/env";
import { bankCfg, circle, errResp, isResp, kvList, qs, requireUser, wiresKey, type WireLink } from "../../_lib/bank";

/** GET /api/bank/deposits — Circle bank deposits. Admins see every deposit; a user sees only deposits that came from their own linked wire accounts. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const u = new URL(request.url).searchParams;
  try {
    const c = await bankCfg(env);
    const d = await circle(env, `/v1/accounts/deposits${qs({ accountId: c.circleAccount, type: u.get("type"), from: u.get("from"), to: u.get("to"), pageSize: u.get("pageSize") || 50, pageAfter: u.get("pageAfter"), pageBefore: u.get("pageBefore") })}`);
    const rows: any[] = d?.data ?? [];
    if (who.admin && u.get("all")) return json({ data: rows });
    // Summaries don't carry the source bank account, so resolve the most recent ones (bounded) and match against the user's wires.
    const mine = new Set((await kvList<WireLink>(env, wiresKey(who.address))).map((w) => w.id));
    if (!mine.size) return json({ data: [] });
    const detail = await Promise.all(rows.slice(0, 25).map((r) => circle(env, `/v1/accounts/deposits/${r.id}`).then((x) => x?.data).catch(() => null)));
    return json({ data: detail.filter((x) => x && mine.has(x.source?.id)) });
  } catch (e) { return errResp(e); }
};
