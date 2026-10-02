import type { Env } from "../../_lib/env";
import { json } from "../../_lib/env";
import { bankCfg, circle, errResp, isResp, requireUser } from "../../_lib/bank";

/** POST /api/bank/device-token — short-lived token the browser passes to @circle-fin/device-checks (its deviceId is required for risk signals). */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  try {
    const c = await bankCfg(env);
    if (!c.clientEntityId) return json({ error: "Circle client entity isn't set (Admin → Finance → Banking)." }, 503);
    const d = await circle(env, `/v1/partner/clients/${c.clientEntityId}/device-checks`, { method: "POST", body: "{}" });
    return json({ token: d?.data?.deviceCheckToken, expiresAt: d?.data?.expiresAt, sandbox: c.circleBase.includes("sandbox") });
  } catch (e) { return errResp(e, who.admin); }
};
