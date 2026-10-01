import type { Env } from "../../_lib/env";
import { json } from "../../_lib/env";
import { bankCfg } from "../../_lib/bank";
import { getConfig } from "../../_lib/store";
import { dcwCfg, dcwReady } from "../../_lib/dcw";

/** GET /api/bank/config — public, no secrets: which rails are switched on and the NGN rate/limits. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const c = await bankCfg(env);
  const cfg = await getConfig(env);
  const d = await dcwCfg(env);
  return json({
    circle: Boolean(c.circleKey),
    ngn: Boolean(c.paystackKey && c.ngEnabled && c.rate > 0 && cfg.treasury),
    ngnConfigured: Boolean(c.paystackKey),
    rate: c.rate, feePct: c.feePct, minUsd: c.minUsd, maxUsd: c.maxUsd,
    treasury: cfg.treasury || "",
    managed: dcwReady(d), managedChain: d.blockchain, managedMax: d.maxSendUsd,
    sandbox: c.circleBase.includes("sandbox"),
  });
};
