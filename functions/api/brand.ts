import type { Env } from "../_lib/env";
import { err, json } from "../_lib/env";
import { getSettings, saveSettings } from "../_lib/store";
import { authenticate } from "../_lib/auth";

const BRAND_KEYS = ["brand_color", "bg_color", "text_color", "accent_color", "card_color", "border_color", "brand_name", "brand_tagline", "brand_logo", "site_name"];
const DEFAULTS: Record<string, string> = {
  brand_color: "#6d28d9", bg_color: "#f9f8f7", text_color: "#18181b", accent_color: "#059669",
  card_color: "#ffffff", border_color: "#e5e3e1", brand_logo: "",
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const s = await getSettings(env);
  const brand: Record<string, string> = { ...DEFAULTS };
  for (const k of BRAND_KEYS) if (s[k]) brand[k] = s[k];
  if (!brand.brand_name) brand.brand_name = brand.site_name || "Readlearc";
  return json(brand, 200, { "Cache-Control": "public, max-age=30" });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  const data = JSON.parse(body || "{}") as Record<string, unknown>;
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => BRAND_KEYS.includes(k)));
  if (!Object.keys(patch).length) return err("No valid keys");
  await saveSettings(env, patch);
  return json({ ok: true });
};
