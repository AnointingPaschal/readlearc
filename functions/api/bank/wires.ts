import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { bankCfg, circle, errResp, isResp, kvList, kvPush, requireUser, wiresKey, type WireLink } from "../../_lib/bank";

/** GET  /api/bank/wires  — the caller's linked Circle wire bank accounts (admins: all via ?all=1 from Circle).
 *  POST /api/bank/wires  — create a wire bank account at Circle and link it to the caller. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await requireUser(request, env); if (isResp(who)) return who;
  try {
    if (who.admin && new URL(request.url).searchParams.get("all")) {
      const c = await bankCfg(env);
      const d = await circle(env, `/v1/banks/wires${c.clientEntityId ? `?clientEntityId=${c.clientEntityId}` : ""}`);
      return json({ data: d?.data ?? [] });
    }
    const mine = await kvList<WireLink>(env, wiresKey(who.address));
    // refresh statuses of anything still pending
    const out = await Promise.all(mine.map(async (w) => {
      if (w.status === "complete" || w.status === "failed") return w;
      try { const d = await circle(env, `/v1/banks/wires/${w.id}`); return { ...w, status: d?.data?.status ?? w.status }; } catch { return w; }
    }));
    return json({ data: out });
  } catch (e) { return errResp(e, who.admin); }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await requireUser(request, env, body); if (isResp(who)) return who;
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const { billingDetails, bankAddress, accountNumber, routingNumber, iban, sessionId, deviceId } = p || {};
  if (!billingDetails?.name || !billingDetails?.city || !billingDetails?.country || !billingDetails?.line1 || !billingDetails?.postalCode) return err("Account holder name and full address are required");
  if (!bankAddress?.country) return err("Bank country is required");
  if (!iban && !(accountNumber && routingNumber)) return err("Enter an IBAN, or an account number with routing/SWIFT code");
  if (!deviceId || !sessionId) return err("Device check missing — reload and try again");
  const c = await bankCfg(env);
  const req: Record<string, unknown> = {
    idempotencyKey: crypto.randomUUID(), billingDetails, bankAddress,
    riskSignals: { ipAddress: request.headers.get("CF-Connecting-IP") || "127.0.0.1", sessionId, deviceId },
    ...(iban ? { iban: String(iban).replace(/\s/g, "") } : { accountNumber: String(accountNumber), routingNumber: String(routingNumber) }),
  };
  if (c.clientEntityId) req.clientEntityId = c.clientEntityId;
  try {
    const d = await circle(env, "/v1/banks/wires", { method: "POST", body: JSON.stringify(req) });
    const w = d?.data;
    const link: WireLink = { id: w.id, description: w.description, trackingRef: w.trackingRef, status: w.status, holder: w.billingDetails?.name, createdAt: Date.now() };
    await kvPush(env, wiresKey(who.address), link, 20);
    return json({ data: link });
  } catch (e) { return errResp(e, who.admin); }
};
