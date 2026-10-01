import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { circle, errResp, isResp, kvList, requireUser, wiresKey, type WireLink } from "../../../_lib/bank";

/** GET /api/bank/deposits/<id> — one deposit (admin, or the owner of the source bank account). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  const id = String(params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return err("Bad id");
  try {
    const d = await circle(env, `/v1/accounts/deposits/${id}`);
    const dep = d?.data;
    const mine = (await kvList<WireLink>(env, wiresKey(who.address))).some((w) => w.id === dep?.source?.id);
    if (!who.admin && !mine) return err("Not your deposit", 403);
    return json({ data: dep });
  } catch (e) { return errResp(e); }
};
