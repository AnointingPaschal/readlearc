import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";

/** Signed GET → { address, admin }. Lets the SPA know whether this wallet is an admin
 *  (on-chain Roles contract OR the ADMIN_ADDRESSES bootstrap list). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await authenticate(request, env, "");
  if (!who) return err("Not signed in", 401);
  return json({ address: who.address, admin: who.admin });
};
