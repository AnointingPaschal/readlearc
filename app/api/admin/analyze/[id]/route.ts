import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

// ── Unified AI caller ─────────────────────────────────────────────
async function callAI(provider: string, model: string, apiKey: string, prompt: string): Promise<string> {
  switch (provider) {
    case "openai": {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` },
        body: JSON.stringify({
          model, max_tokens:600,
          messages:[{ role:"user", content:prompt }],
          response_format:{ type:"json_object" },
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "OpenAI error");
      return d.choices?.[0]?.message?.content || "";
    }

    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model, max_tokens:600, messages:[{ role:"user", content:prompt }] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Anthropic error");
      return d.content?.[0]?.text || "";
    }

    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }], generationConfig:{ maxOutputTokens:600, responseMimeType:"application/json" } }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Gemini error");
      return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    case "groq": {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{ "Content-Type":"application/json","Authorization":`Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens:600, messages:[{ role:"user", content:prompt }], response_format:{type:"json_object"} }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "Groq error");
      return d.choices?.[0]?.message?.content || "";
    }

    case "deepseek": {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method:"POST",
        headers:{ "Content-Type":"application/json","Authorization":`Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens:600, messages:[{ role:"user", content:prompt }], response_format:{type:"json_object"} }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || "DeepSeek error");
      return d.choices?.[0]?.message?.content || "";
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// ── Analysis prompt ───────────────────────────────────────────────
function buildPrompt(title: string, content: string, wordCount: number): string {
  return `You are an expert content quality analyst. Analyze the following article.
Return ONLY a valid JSON object — no markdown, no extra text.

Article Title: ${title}
Word Count: ${wordCount}
Content:
---
${content.slice(0, 3000)}${wordCount > 500 ? "\n...[truncated]" : ""}
---

Return this exact JSON:
{
  "plagiarism_score": <0-100>,
  "plagiarism_notes": "<max 100 chars>",
  "ai_score": <0-100>,
  "ai_notes": "<max 100 chars>",
  "quality_score": <0-100>,
  "quality_notes": "<max 100 chars>",
  "originality_score": <0-100>,
  "originality_notes": "<max 100 chars>",
  "recommendation": "<approve|reject|review>",
  "summary": "<1-2 sentence overall assessment>"
}

Scoring guide:
- plagiarism_score >70 → reject | ai_score >80 → review
- quality_score <30 → reject | quality_score >70 + plagiarism<40 + originality>60 → approve`;
}

export async function POST(_: NextRequest, { params }: C) {
  const { id } = await params;

  // Get article
  const { data: article } = await supabaseAdmin
    .from("articles").select("title,content").eq("id", id).single();
  if (!article) return NextResponse.json({ error:"Article not found" }, { status:404 });

  // Get AI config from platform_settings
  const { data: settings } = await supabaseAdmin
    .from("platform_settings")
    .select("key,value")
    .in("key", ["ai_provider","ai_model","ai_api_key"]);

  const cfg: Record<string,string> = {};
  for (const s of settings||[]) cfg[s.key] = s.value;

  const provider = cfg.ai_provider || "anthropic";
  const model    = cfg.ai_model    || "claude-haiku-4-5-20251001";
  const apiKey   = cfg.ai_api_key  || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) return NextResponse.json({
    error: `No API key set for ${provider}. Go to Admin → Settings → AI Model.`
  }, { status:400 });

  const wordCount = (article.content||"").split(/\s+/).filter(Boolean).length;
  const prompt    = buildPrompt(article.title, article.content||"", wordCount);

  try {
    const raw  = await callAI(provider, model, apiKey, prompt);
    const clean = raw.replace(/```json|```/g,"").trim();
    const analysis = JSON.parse(clean);

    await supabaseAdmin.from("article_analysis").upsert({
      article_id:        parseInt(id),
      plagiarism_score:  Math.min(100,Math.max(0, analysis.plagiarism_score||0)),
      ai_score:          Math.min(100,Math.max(0, analysis.ai_score||0)),
      quality_score:     Math.min(100,Math.max(0, analysis.quality_score||0)),
      originality_score: Math.min(100,Math.max(0, analysis.originality_score||0)),
      plagiarism_notes:  analysis.plagiarism_notes||"",
      ai_notes:          analysis.ai_notes||"",
      quality_notes:     analysis.quality_notes||"",
      recommendation:    analysis.recommendation||"review",
      analyzed_at:       new Date().toISOString(),
    }, { onConflict:"article_id" });

    return NextResponse.json({ ok:true, provider, model, analysis });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("article_analysis").select("*").eq("article_id", id).maybeSingle();
  return NextResponse.json(data || null);
}
