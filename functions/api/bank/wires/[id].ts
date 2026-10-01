import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { bankCfg, circle, errResp, isResp, kvList, qs, requireUser, wiresKey, type WireLink } from "../../../_lib/bank";

/** GET /api/bank/wires/<id>[?currency=USD|EUR] — bank account detail + Circle's wire instructions (where to send money to fund it). Owner or admin only. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const id = String(params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return err("Bad id");
  const owned = (await kvList<WireLink>(env, wiresKey(who.address))).some((w) => w.id === id);
  if (!owned && !who.admin) return err("Not your bank account", 403);
  try {
    const currency = new URL(request.url).searchParams.get("currency") || undefined;
    const c = await bankCfg(env);
    const [acct, instr] = await Promise.all([
      circle(env, `/v1/banks/wires/${id}`),
      circle(env, `/v1/banks/wires/${id}/instructions${qs({ accountId: c.circleAccount, currency })}`).catch(() => null),
    ]);
    return json({ account: acct?.data, instructions: instr?.data ?? null });
  } catch (e) { return errResp(e); }
};
