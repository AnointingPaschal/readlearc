import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

// Read AI config — always from platform_settings (set via AI Providers page)
async function getAIConfig() {
  const { data } = await supabaseAdmin
    .from("platform_settings")
    .select("key,value")
    .in("key", ["ai_api_key","ai_model","ai_provider","ai_auto_approve"]);

  const cfg: Record<string,string> = {};
  for (const r of data||[]) cfg[r.key] = r.value;

  return {
    provider:    cfg.ai_provider    || "openrouter",
    model:       cfg.ai_model       || "anthropic/claude-haiku-4-5",
    apiKey:      cfg.ai_api_key     || "",
    autoApprove: cfg.ai_auto_approve === "true",
  };
}

// Call OpenRouter (or any OpenAI-compatible API)
async function callOpenRouter(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer":  "https://readlearc.vercel.app",
      "X-Title":       "Readlearc Content Analysis",
    },
    body: JSON.stringify({
      model,
      max_tokens:      600,
      temperature:     0.1,
      messages:        [{ role:"user", content:prompt }],
      response_format: { type:"json_object" },
    }),
  });

  const d = await res.json();
  if (!res.ok) {
    const errMsg = d.error?.message || d.error || JSON.stringify(d);
    throw new Error(`OpenRouter error: ${errMsg}`);
  }
  return d.choices?.[0]?.message?.content || "";
}

function buildPrompt(title: string, content: string, wordCount: number): string {
  return `You are an expert content quality analyst for a pay-per-read publishing platform. Analyze the following article and return ONLY a valid JSON object — no markdown, no extra text, no explanation.

Article Title: "${title}"
Word Count: ${wordCount}
Content Preview:
---
${content.slice(0, 3000)}${wordCount > 500 ? "\n...[content truncated]" : ""}
---

Return this exact JSON structure with integer scores 0-100:
{
  "plagiarism_score": <0-100, where 0=completely original, 100=definitely plagiarized>,
  "plagiarism_notes": "<one sentence explanation, max 120 chars>",
  "ai_score": <0-100, where 0=clearly human-written, 100=clearly AI-generated with no value>,
  "ai_notes": "<one sentence explanation, max 120 chars>",
  "quality_score": <0-100, where 0=very poor quality, 100=excellent quality>,
  "quality_notes": "<one sentence explanation, max 120 chars>",
  "originality_score": <0-100, where 0=completely generic, 100=highly original unique insights>,
  "originality_notes": "<one sentence explanation, max 120 chars>",
  "recommendation": "<approve|review|reject>",
  "summary": "<2-3 sentence overall assessment of this article>"
}

Scoring criteria:
- plagiarism_score > 70 → likely copied from elsewhere → recommend reject
- ai_score > 85 → likely pure AI output with no human insight → recommend review or reject
- quality_score < 25 → too short, incoherent, or gibberish → recommend reject
- All good (plagiarism<40, ai<60, quality>65, originality>55) → recommend approve
- Word count < 100 → quality_score should be below 30`;
}

// POST: analyze single article
export async function POST(_: NextRequest, { params }: C) {
  const { id } = await params;

  const { data: article, error: artErr } = await supabaseAdmin
    .from("articles")
    .select("title,content,status")
    .eq("id", id)
    .single();

  if (artErr || !article) {
    return NextResponse.json({ error:"Article not found" }, { status:404 });
  }

  const { provider, model, apiKey, autoApprove } = await getAIConfig();

  if (!apiKey) {
    return NextResponse.json({
      error: "No API key configured. Go to Admin → AI → OpenRouter AI, paste your key and save."
    }, { status:400 });
  }

  if (!model) {
    return NextResponse.json({
      error: "No active model selected. Go to Admin → AI → OpenRouter AI and select a model."
    }, { status:400 });
  }

  const wordCount = (article.content || "").split(/\s+/).filter(Boolean).length;
  const prompt    = buildPrompt(article.title, article.content || "", wordCount);

  try {
    const raw      = await callOpenRouter(apiKey, model, prompt);
    const clean    = raw.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

    const row = {
      article_id:        parseInt(id),
      plagiarism_score:  clamp(analysis.plagiarism_score  || 0),
      ai_score:          clamp(analysis.ai_score           || 0),
      quality_score:     clamp(analysis.quality_score      || 0),
      originality_score: clamp(analysis.originality_score  || 0),
      plagiarism_notes:  (analysis.plagiarism_notes   || "").slice(0, 200),
      ai_notes:          (analysis.ai_notes            || "").slice(0, 200),
      quality_notes:     (analysis.quality_notes       || "").slice(0, 200),
      originality_notes: (analysis.originality_notes   || "").slice(0, 200),
      recommendation:    ["approve","review","reject"].includes(analysis.recommendation)
                           ? analysis.recommendation : "review",
      analyzed_at:       new Date().toISOString(),
    };

    await supabaseAdmin
      .from("article_analysis")
      .upsert(row, { onConflict:"article_id" });

    // Auto-approve if enabled and recommendation is approve
    if (autoApprove && row.recommendation === "approve" && article.status === "pending") {
      await supabaseAdmin
        .from("articles")
        .update({ status:"approved" })
        .eq("id", id);
    }

    return NextResponse.json({
      ok:       true,
      provider: "openrouter",
      model,
      analysis: { ...row, summary: analysis.summary || "" },
      autoApproved: autoApprove && row.recommendation === "approve",
    });

  } catch (e: any) {
    console.error("Analysis error:", e);
    return NextResponse.json({ error: e.message || "Analysis failed" }, { status:500 });
  }
}

// GET: fetch existing analysis for an article
export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("article_analysis")
    .select("*")
    .eq("article_id", id)
    .maybeSingle();
  return NextResponse.json(data || null);
}
