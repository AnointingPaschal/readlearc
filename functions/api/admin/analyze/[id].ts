import type { Env } from "../../../_lib/env";
import { err, json } from "../../../_lib/env";
import { getSettings } from "../../../_lib/store";
import { authenticate } from "../../../_lib/auth";

function buildPrompt(systemPrompt:string, title:string, content:string, wordCount:number): string {
  const base = systemPrompt || `You are an expert content quality analyst. Evaluate this article on quality, originality, AI-generation likelihood, and plagiarism.`;
  return `${base}

Article Title: "${title}"
Word Count: ${wordCount}
Content:
---
${content.slice(0,3500)}${wordCount>500?"\n...[truncated]":""}
---

Return ONLY valid JSON (no markdown):
{
  "plagiarism_score": <0-100, 0=original 100=copied>,
  "plagiarism_notes": "<reason, max 120 chars>",
  "ai_score": <0-100, 0=human 100=AI-generated>,
  "ai_notes": "<reason, max 120 chars>",
  "quality_score": <0-100, 0=poor 100=excellent>,
  "quality_notes": "<reason, max 120 chars>",
  "originality_score": <0-100, 0=generic 100=highly original>,
  "originality_notes": "<reason, max 120 chars>",
  "recommendation": "<approve|review|reject>",
  "summary": "<2-3 sentence overall assessment>"
}`;
}

/** POST body: { title, content, status } — the admin's browser reads the (possibly encrypted) article
 *  from the chain and sends the plain text here; the AI key never leaves KV.
 *  Results are cached in KV as analysis:<id>. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const text = await request.text();
  const who = await authenticate(request, env, text);
  if (!who?.admin) return err("Admin only", 401);
  const id = String(params.id);
  const { title, content } = JSON.parse(text || "{}") as { title?: string; content?: string };
  if (!title || !content) return err("title and content required");
  const s = await getSettings(env);
  const apiKey = s.ai_api_key || "", model = s.ai_model || "";
  if (!apiKey) return err("No OpenRouter API key. Go to Admin → AI → OpenRouter AI.");
  if (!model) return err("No active model. Go to Admin → AI → OpenRouter AI.");
  const plain = content.replace(/<[^>]+>/g, " ");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const prompt = buildPrompt(s.ai_prompt_quality || "", title, plain, words);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": new URL(request.url).origin, "X-Title": "Readlearc" },
      body: JSON.stringify({ model, max_tokens: 700, temperature: 0.1, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    });
    const d = (await res.json()) as any;
    if (!res.ok) throw new Error(d.error?.message || JSON.stringify(d.error) || "OpenRouter error");
    const data = JSON.parse((d.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim());
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n || 0)));
    const row = {
      article_id: Number(id),
      plagiarism_score: clamp(data.plagiarism_score), ai_score: clamp(data.ai_score),
      quality_score: clamp(data.quality_score), originality_score: clamp(data.originality_score),
      plagiarism_notes: String(data.plagiarism_notes || "").slice(0, 200), ai_notes: String(data.ai_notes || "").slice(0, 200),
      quality_notes: String(data.quality_notes || "").slice(0, 200), originality_notes: String(data.originality_notes || "").slice(0, 200),
      recommendation: ["approve", "review", "reject"].includes(data.recommendation) ? data.recommendation : "review",
      analyzed_at: new Date().toISOString(),
    };
    await env.RL_KV.put(`analysis:${id}`, JSON.stringify(row));
    return json({ ok: true, model, analysis: { ...row, summary: data.summary || "" }, autoApprove: s.ai_auto_approve === "true" && row.recommendation === "approve" });
  } catch (e) {
    return err((e as Error).message, 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const who = await authenticate(request, env, "");
  if (!who?.admin) return err("Admin only", 401);
  return json((await env.RL_KV.get(`analysis:${params.id}`, "json")) ?? null);
};
