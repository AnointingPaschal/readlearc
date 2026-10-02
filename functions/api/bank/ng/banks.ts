import type { Env } from "../../../_lib/env";
import { json } from "../../../_lib/env";
import { listBanks } from "../../../_lib/ngpay";

/** GET /api/bank/ng/banks — Nigerian banks {name, code} from the active payout provider (cached 24h in KV), static fallback otherwise. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const list = await listBanks(env);
  return json({ data: list }, 200, { "Cache-Control": "public, max-age=60" });
};
