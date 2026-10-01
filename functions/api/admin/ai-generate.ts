import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { getSettings } from "../../_lib/store";
import { authenticate } from "../../_lib/auth";

/**
 * POST /api/admin/ai-generate — admin only. Uses the OpenRouter key + models saved under Admin → AI.
 *   kind "ideas":    { theme, count }                         → { ideas: string[] }
 *   kind "article" | "research" | "post": { topic, words, tone, audience, category, instructions } → { text }
 * Articles/research come back as markdown: "# Title / Category: / Blurb: / body" (same shape the bulk importer reads).
 */
const BASE = "Never invent statistics, quotes, URLs or citations. If you are not sure a source exists, leave it out. Write original, accurate, well-structured content.";

function system(kind: string, o: { words: number; tone: string; audience: string; category: string }): string {
  if (kind === "post")
    return `You write short, engaging community posts for an online learning community (like a Facebook post). Plain text only: no markdown, no hashtags spam, no links. Keep it under 700 characters. Tone: ${o.tone}. ${BASE}`;
  if (kind === "research")
    return `You are a research writer. Write a complete, rigorous research article of about ${o.words} words in Markdown for ${o.audience}. Tone: ${o.tone}.
Output EXACTLY this layout and nothing before it:
# <Title>
Category: ${o.category || "Research"}
Blurb: <one sentence summary, max 160 characters>

## Abstract
## Introduction
## Literature Review
## Methodology
## Findings and Discussion
## Conclusion
## References
Use "##" headings and "###" for sub-sections, short paragraphs, no first-person. In References list only works you are confident are real (APA 7th); otherwise write "References to be added by the author". ${BASE}`;
  return `You are an expert article writer for Readlearc, a learning and publishing platform. Write a complete, engaging article of about ${o.words} words in Markdown for ${o.audience}. Tone: ${o.tone}.
Output EXACTLY this layout and nothing before it:
# <Title>
Category: ${o.category || "General"}
Blurb: <one sentence summary, max 160 characters>

<article body: an intro, "##" section headings, short paragraphs, lists where useful, and a conclusion>
${BASE}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  const who = await authenticate(request, env, body);
  if (!who?.admin) return err("Admin only", 401);
  const b = JSON.parse(body || "{}") as Record<string, any>;
  const s = await getSettings(env);
  const apiKey = s.ai_api_key || "";
  if (!apiKey) return err("OpenRouter key not set. Add it under Admin → AI → OpenRouter AI.", 400);

  let list: string[] = [];
  try { list = (JSON.parse(s.ai_models_list || "[]") as { id: string }[]).map((m) => m.id); } catch { /* none */ }
  const first = String(b.model || s.ai_model || list[0] || "");
  if (!first) return err("No AI model selected. Pick one under Admin → AI → OpenRouter AI.", 400);
  const tryModels = [first, ...list.filter((m) => m !== first)].slice(0, 4);

  const kind = String(b.kind || "article");
  const words = Math.min(3000, Math.max(150, Number(b.words) || 800));
  const o = { words, tone: String(b.tone || "clear and engaging"), audience: String(b.audience || "a general educated audience"), category: String(b.category || "") };
  let sys: string, user: string, maxTokens: number;
  if (kind === "ideas") {
    const n = Math.min(30, Math.max(1, Number(b.count) || 8));
    sys = `You propose specific, non-overlapping content ideas. Reply with ONLY a JSON array of ${n} strings, no commentary.`;
    user = `Give ${n} ${b.idea === "post" ? "community post" : b.idea === "research" ? "research article" : "article"} ideas about: ${String(b.theme || "").slice(0, 500)}.`;
    maxTokens = 900;
  } else {
    if (!b.topic) return err("topic is required", 400);
    sys = system(kind, o);
    user = `Topic: ${String(b.topic).slice(0, 600)}${b.instructions ? `\nExtra instructions: ${String(b.instructions).slice(0, 800)}` : ""}`;
    maxTokens = kind === "post" ? 400 : Math.min(7000, Math.round(words * 2.2) + 300);
  }

  let lastErr = "AI request failed";
  for (const model of tryModels) {
    try {
      const res = await fetch(`${(env as any).OPENROUTER_BASE || "https://openrouter.ai/api/v1"}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": new URL(request.url).origin, "X-Title": "Readlearc Admin Writer" },
        body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.7, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
      });
      const d = (await res.json()) as any;
      if (!res.ok) throw new Error(d.error?.message || `OpenRouter ${res.status}`);
      const text = String(d.choices?.[0]?.message?.content || "").trim();
      if (!text) throw new Error("Empty response");
      if (kind === "ideas") {
        const m = text.match(/\[[\s\S]*\]/);
        let ideas: string[] = [];
        try { ideas = (JSON.parse(m ? m[0] : text) as unknown[]).map((x) => String(x).trim()).filter(Boolean); } catch { ideas = text.split("\n").map((l) => l.replace(/^[\s\-*\d.)]+/, "").trim()).filter((l) => l.length > 6); }
        if (!ideas.length) throw new Error("No ideas returned");
        return json({ ok: true, ideas, model });
      }
      return json({ ok: true, text, model });
    } catch (e) { lastErr = `${model}: ${(e as Error).message}`; }
  }
  return err(lastErr, 502);
};
