import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function POST(_: NextRequest, { params }: C) {
  const { id } = await params;

  // Get article content
  const { data: article, error: aErr } = await supabaseAdmin
    .from("articles").select("title,blurb,content,author_address").eq("id", id).single();
  if (aErr || !article) return NextResponse.json({ error:"Article not found" }, { status:404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error:"ANTHROPIC_API_KEY not set in Vercel" }, { status:500 });

  const wordCount = (article.content||"").split(/\s+/).filter(Boolean).length;
  const excerpt   = (article.content||"").slice(0, 3000);

  const prompt = `You are an expert content quality analyst. Analyze the following article and return ONLY a JSON object (no markdown, no explanation).

Article Title: ${article.title}
Word Count: ${wordCount}
Content:
---
${excerpt}${wordCount > 500 ? "\n...[truncated]" : ""}
---

Return this exact JSON structure:
{
  "plagiarism_score": <0-100, where 0=definitely original, 100=definitely copied>,
  "plagiarism_notes": "<brief reason, max 100 chars>",
  "ai_score": <0-100, where 0=definitely human-written, 100=definitely AI-generated>,
  "ai_notes": "<brief reason, max 100 chars>",
  "quality_score": <0-100, where 0=poor quality, 100=excellent quality>,
  "quality_notes": "<brief reason, max 100 chars>",
  "originality_score": <0-100, where 0=generic/derivative, 100=highly original ideas>,
  "recommendation": "<approve|reject|review>",
  "summary": "<1-2 sentence overall assessment>"
}

Scoring guide:
- plagiarism_score > 70: likely copied content → recommend reject
- ai_score > 80: likely AI-generated with no original value → recommend review
- quality_score < 30: too short, incoherent, or low effort → recommend reject
- quality_score > 70 AND plagiarism < 40 AND originality > 60: recommend approve`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role:"user", content: prompt }],
      }),
    });

    const d = await res.json();
    if (!res.ok) return NextResponse.json({ error: d.error?.message || "AI API error" }, { status:500 });

    const text = d.content?.[0]?.text || "";
    let analysis: any;
    try {
      // Strip any markdown fences
      const clean = text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error:"Failed to parse AI response", raw: text.slice(0,200) }, { status:500 });
    }

    // Save to DB
    const { error: saveErr } = await supabaseAdmin.from("article_analysis").upsert({
      article_id:        parseInt(id),
      plagiarism_score:  Math.min(100, Math.max(0, analysis.plagiarism_score||0)),
      ai_score:          Math.min(100, Math.max(0, analysis.ai_score||0)),
      quality_score:     Math.min(100, Math.max(0, analysis.quality_score||0)),
      originality_score: Math.min(100, Math.max(0, analysis.originality_score||0)),
      plagiarism_notes:  analysis.plagiarism_notes||"",
      ai_notes:          analysis.ai_notes||"",
      quality_notes:     analysis.quality_notes||"",
      recommendation:    analysis.recommendation||"review",
      analyzed_at:       new Date().toISOString(),
    }, { onConflict:"article_id" });

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status:500 });

    return NextResponse.json({ ok:true, analysis: { ...analysis, summary: analysis.summary } });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("article_analysis").select("*").eq("article_id", id).maybeSingle();
  return NextResponse.json(data || null);
}
