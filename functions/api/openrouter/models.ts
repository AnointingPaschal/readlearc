import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { getSettings, saveSettings } from "../../_lib/store";
import { authenticate } from "../../_lib/auth";

/** AI model list / active model. The API key itself is only revealed to an admin. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const s = await getSettings(env);
  let models: unknown[] = [];
  try { models = JSON.parse(s.ai_models_list || "[]"); } catch { /* keep [] */ }
  const who = await authenticate(request, env, "");
  return json({
    key: who?.admin ? s.ai_api_key || "" : "",
    keySet: !!s.ai_api_key,
    models, activeModel: s.ai_model || "", autoApprove: s.ai_auto_approve === "true",
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  const { key, models, activeModel, autoApprove } = JSON.parse(body || "{}");
  await saveSettings(env, {
    ai_api_key: key || "", ai_model: activeModel || "", ai_models_list: JSON.stringify(models || []),
    ai_auto_approve: String(!!autoApprove), ai_provider: "openrouter",
  });
  return json({ ok: true });
};
