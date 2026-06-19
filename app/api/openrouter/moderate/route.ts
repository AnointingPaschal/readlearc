import { NextRequest, NextResponse } from "next/server";
import { getAIState, setModerationStatus } from "../../../../lib/store";

export async function POST(req: NextRequest) {
  const { articleId, title, blurb, content } = await req.json();
  const ai = getAIState();
  if (!ai.key || !ai.activeModel) return NextResponse.json({ error: "AI not configured" }, { status: 400 });

  const prompt = [
    "You are a strict content moderation AI for Readlearc, a pay-per-read publishing platform.",
    "Analyze this article and determine if it should be APPROVED, FLAGGED FOR REVIEW, or REJECTED.",
    "",
    "Title: " + title,
    "Blurb: " + blurb,
    "Content (first 2000 chars): " + (content || "").slice(0, 2000),
    "",
    "Criteria:",
    "1. ORIGINALITY: Genuinely original? Not plagiarized?",
    "2. AI-GENERATED: Does it read as AI-generated? Formulaic, generic, no personal voice?",
    "3. QUALITY: Well-written, substantive, real value?",
    "4. POLICY: No spam, misleading financial claims, hate speech?",
    "5. GENUINENESS: Authentic human expertise and experience?",
    "",
    "Red flags for REJECTION: AI patterns, plagiarism, spam, get-rich-quick, low-effort padding.",
    "",
    'Respond ONLY with valid JSON: {"decision":"APPROVE"|"REVIEW"|"REJECT","confidence":0,"reasons":[],"aiGenerated":false,"plagiarism":false,"qualityScore":0,"summary":"verdict"}',
  ].join("\n");

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + ai.key,
        "HTTP-Referer": "https://readlearc.io",
        "X-Title": "Readlearc Moderation",
      },
      body: JSON.stringify({
        model: ai.activeModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 600,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || "OpenRouter error" }, { status: 500 });

    const raw    = (data.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);

    if (ai.autoApprove && articleId) {
      const status = result.decision === "APPROVE" ? "live" : result.decision === "REJECT" ? "removed" : "review";
      setModerationStatus(articleId, status, result.summary);
    }

    return NextResponse.json({ ...result, articleId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
