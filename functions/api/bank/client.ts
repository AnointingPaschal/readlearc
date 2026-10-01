import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { circle, errResp } from "../../_lib/bank";
import { saveSettings } from "../../_lib/store";

/** POST /api/bank/client — admin only. Creates the Circle partner client (POST /v1/partner/clients) and saves the returned
 *  clientEntityId into the banking settings. Body: {clientName, country, natureOfBusiness, institutionType}. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  let p: any; try { p = JSON.parse(body); } catch { return err("Bad JSON"); }
  const { clientName, country, natureOfBusiness, institutionType } = p || {};
  if (!clientName || !/^[A-Za-z]{2}$/.test(country || "") || !natureOfBusiness || !institutionType) return err("Business name, 2-letter country, nature of business and institution type are required");
  try {
    const d = await circle(env, "/v1/partner/clients", {
      method: "POST",
      body: JSON.stringify({ clientName, country: String(country).toUpperCase(), clientType: "business", businessDetails: { natureOfBusiness, institutionType } }),
    });
    const id = d?.data?.clientEntityId;
    if (!id) return err("Circle returned no clientEntityId", 502);
    await saveSettings(env, { circle_client_entity_id: id });
    return json({ clientEntityId: id, applicationId: d?.data?.applicationId });
  } catch (e) {
    const r = errResp(e);
    if (r.status === 409) return err("Circle already has a client with this name and country — use a different name, or paste the existing ID.", 409);
    if (r.status === 403 || r.status === 401) return err("Circle refused the request — partner/end-user onboarding may not be enabled for this API key yet. Ask Circle to enable it.", r.status);
    return r;
  }
};
