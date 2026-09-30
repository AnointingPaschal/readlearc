import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { getSettings } from "../../_lib/store";
import { authenticate } from "../../_lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);
  const s = await getSettings(env);
  const provider = s.ai_provider || "openrouter";
  const model = s.ai_model || "anthropic/claude-haiku-4-5";
  const apiKey = s.ai_api_key || "";
  if (!apiKey) return json({ ok: false, error: "No API key configured" });
  const prompt = 'Return exactly this JSON: {"test":"ok","status":"connected"}';
  try {
    let text = "";
    const oa = async (url: string, extra: Record<string, string> = {}) => {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extra }, body: JSON.stringify({ model, max_tokens: 50, messages: [{ role: "user", content: prompt }] }) });
      const d = (await r.json()) as any; if (!r.ok) throw new Error(d.error?.message || "Error");
      return d.choices?.[0]?.message?.content || "";
    };
    if (provider === "openrouter") text = await oa("https://openrouter.ai/api/v1/chat/completions", { "X-Title": "Readlearc" });
    else if (provider === "openai") text = await oa("https://api.openai.com/v1/chat/completions");
    else if (provider === "groq") text = await oa("https://api.groq.com/openai/v1/chat/completions");
    else if (provider === "deepseek") text = await oa("https://api.deepseek.com/chat/completions");
    else if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 50, messages: [{ role: "user", content: prompt }] }) });
      const d = (await r.json()) as any; if (!r.ok) throw new Error(d.error?.message || "Error");
      text = d.content?.[0]?.text || "";
    } else if (provider === "gemini") {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 50 } }) });
      const d = (await r.json()) as any; if (!r.ok) throw new Error(d.error?.message || "Error");
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    return json({ ok: true, provider, model, response: text.slice(0, 100) });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message });
  }
};
