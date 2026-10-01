import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { getSettings } from "../../_lib/store";
import { authenticate } from "../../_lib/auth";

/**
 * POST /api/admin/ai-image — admin only. { prompt, model? } → { ok, image: "data:image/…;base64,…", model }
 * Uses an OpenRouter image-output model (default google/gemini-2.5-flash-image) with the key saved under Admin → AI.
 */
const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  const b = JSON.parse(body || "{}") as Record<string, any>;
  const s = await getSettings(env);
  const apiKey = s.ai_api_key || "";
  if (!apiKey) return err("OpenRouter key not set. Add it under Admin → AI → OpenRouter AI.", 400);
  const prompt = String(b.prompt || "").trim().slice(0, 900);
  if (!prompt) return err("prompt is required", 400);
  const model = String(b.model || s.ai_image_model || DEFAULT_IMAGE_MODEL);
  try {
    const res = await fetch(`${(env as any).OPENROUTER_BASE || "https://openrouter.ai/api/v1"}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": new URL(request.url).origin, "X-Title": "Readlearc Admin Writer" },
      body: JSON.stringify({
        model, modalities: ["image", "text"],
        messages: [{ role: "user", content: `Create a clean, high-quality editorial illustration, wide 16:9 composition, no text, no letters, no watermarks. Subject: ${prompt}` }],
      }),
    });
    const d = (await res.json()) as any;
    if (!res.ok) throw new Error(d.error?.message || `OpenRouter ${res.status}`);
    const m = d.choices?.[0]?.message;
    let url: string = m?.images?.[0]?.image_url?.url || m?.images?.[0]?.url || "";
    if (!url && Array.isArray(m?.content)) url = m.content.find((c: any) => c?.type === "image_url")?.image_url?.url || "";
    if (!url) throw new Error("This model returned no image. Pick an image-capable model.");
    return json({ ok: true, image: url, model });
  } catch (e) { return err(`${model}: ${(e as Error).message}`, 502); }
};
