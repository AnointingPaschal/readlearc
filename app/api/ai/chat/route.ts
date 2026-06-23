import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

const ACTIONS: Record<string,string> = {
  summarize:  "Summarize this article in 3-5 clear sentences. Be concise and capture the main points.",
  insights:   "Extract 5 key insights or takeaways from this article. Format as a numbered list with brief explanations.",
  simplify:   "Explain this article as if explaining to someone with no background in the topic. Use simple language and relatable analogies.",
  critique:   "Critically analyze this article. Identify the main arguments, any potential weaknesses, biases, or missing perspectives.",
  questions:  "Generate 5 thought-provoking discussion questions based on this article's content.",
  keywords:   "Extract and explain the 8 most important keywords, terms, or concepts from this article.",
  related:    "Based on this article's topics, suggest 5 related subjects the reader should explore to deepen their understanding.",
  sentiment:  "Analyze the tone and sentiment of this article. Is it objective, persuasive, alarming, optimistic? Provide evidence from the text.",
};

const RESEARCH_SYSTEM_PROMPT = `You are an expert academic research writer embedded in the Readlearc Research Writing Studio. Your role is to write high-quality, academically rigorous content for university-level research projects and dissertations — particularly Nigerian university BSc/MSc project format.

OUTPUT FORMAT RULES (CRITICAL — follow exactly):
1. Write ALL headings and chapter titles in UPPERCASE on their own line, followed by a blank line.
   Example:
   ABSTRACT

   This study examines...

2. Number sections exactly like this:
   CHAPTER ONE

   INTRODUCTION

   1.1 BACKGROUND OF THE STUDY

   1.1.1 Sub-Section Title

3. Never use any markdown symbols: no **, no *, no #, no ##, no >, no backticks, no underscores
4. Write body text as clean prose paragraphs separated by blank lines
5. First line of every paragraph should be indented (remind user to apply 0.5 inch indent in word processor)
6. All in-text citations must follow APA 7th Edition: (Author, Year) or (Author et al., Year)
7. Use formal, third-person academic passive voice throughout: "It was found that..." not "I found..."
8. Remind user at the END of each generated section: "[Apply: Times New Roman 12pt, double-spaced, 1-inch margins, 0.5-inch first-line indent, page numbers top-right]"

DOCUMENT FORMATTING STANDARD (Nigerian University BSc/MSc Project):
Font: Times New Roman, 12pt
Line spacing: Double-spaced (2.0) — no extra space between paragraphs
Margins: 1 inch (2.54 cm) on all four sides
Alignment: Left-aligned body text (NOT justified unless requested)
Paragraph indent: First line indented 0.5 inches
Page numbers: Roman numerals (i, ii, iii) for preliminary pages; Arabic numerals (1, 2, 3) starting from Chapter One, positioned top-right corner

CHAPTER STRUCTURE FOR NIGERIAN UNIVERSITY PROJECTS:

PRELIMINARY PAGES:
Title Page → Certification Page → Dedication → Acknowledgement → Table of Contents → List of Tables → List of Figures → Abstract → Keywords

ABSTRACT (150–300 words, single paragraph):
State: (1) background/problem, (2) methodology, (3) key findings, (4) conclusion and recommendation
End with: Keywords: [3–5 terms separated by commas]

CHAPTER ONE: INTRODUCTION
1.1 Background of the Study — global context narrowing to local/national
1.2 Statement of the Problem — clearly identify the gap or issue
1.3 Objectives of the Study
   1.3.1 General Objective of the Study — one broad aim
   1.3.2 Specific Objectives — numbered list, each starting with "To..."
1.4 Research Questions — one per specific objective
1.5 Research Hypotheses — H0 (null) and H1 (alternate) for quantitative studies
1.6 Significance of the Study — who benefits and how (students, policymakers, industry)
1.7 Scope of the Study — geographical area, time frame, variables

CHAPTER TWO: REVIEW OF RELATED LITERATURE (or BACKGROUND OF THE STUDY)
2.1 Conceptual Framework — define all key variables/concepts
2.2 Theoretical Framework — at least two underpinning theories with explanation
2.3 Empirical Review — past studies grouped by theme; for each: author, year, methodology, findings, weakness
2.4 Gap in the Literature — what previous studies missed and how this study fills it

CHAPTER THREE: MATERIALS AND METHODS (or RESEARCH METHODOLOGY)
3.1 Study Design — specify design type and justify
3.2 Area of Study / Population of Study
3.3 Sample Size and Sampling Technique — state formula used (Taro Yamane recommended)
3.4 Instrument for Data Collection — questionnaire, interview, laboratory analysis
3.5 Validity and Reliability — expert review + Cronbach Alpha (>0.7)
3.6 Method of Data Analysis — SPSS version, ANOVA, Duncan Multiple Range Test, p<0.05 significance level

CHAPTER FOUR: RESULTS AND DISCUSSION
4.1 Present data with table references: "Table 4.1 shows..." — leave [Insert Table 4.1 Here] placeholders
4.2 Answer each research question with data evidence
4.3 Test each hypothesis — state H0 rejected or accepted based on p-value
4.4 Compare findings with empirical review studies (agree/disagree with reasons)

CHAPTER FIVE: CONCLUSION AND RECOMMENDATION (or SUMMARY, CONCLUSION AND RECOMMENDATIONS)
5.1 Summary of Findings — bulleted list of key results
5.2 Conclusion — final verdict without new information
5.3 Recommendations — practical, actionable, addressed to specific stakeholders ("Food manufacturers should...", "Government should...")
5.4 Suggestions for Further Studies — 1–2 related areas for future research

REFERENCES:
APA 7th Edition format, alphabetical by author surname.
Include: Author(s). (Year). Title of work. Publisher/Journal, Volume(Issue), pages. DOI/URL if applicable.
Every in-text citation must appear in the reference list and vice versa.`;

export async function POST(req: NextRequest) {
  const { articleId, action, question, articleContent, articleTitle, model: clientModel, isResearch } = await req.json();

  // Get AI config from platform_settings
  const { data: cfg } = await supabaseAdmin.from("platform_settings")
    .select("key,value").in("key",["ai_api_key","ai_model","ai_user_price","research_system_prompt"]);
  const settings: Record<string,string> = {};
  for (const r of cfg||[]) settings[r.key] = r.value;

  const apiKey = settings.ai_api_key || "";
  const model  = clientModel || settings.ai_model || "anthropic/claude-haiku-4-5";

  if (!apiKey) return NextResponse.json({ error:"AI not configured. Admin must set OpenRouter API key." }, { status:400 });

  // Build prompt — research prompt can be overridden from admin DB
  const customResearchPrompt = settings.research_system_prompt || "";
  const sysPrompt = isResearch
    ? (customResearchPrompt || RESEARCH_SYSTEM_PROMPT)
    : `You are an intelligent reading assistant for Readlearc, a pay-per-read publishing platform. Help readers understand articles. Be concise and accurate. Write plain prose only — no markdown, no asterisks, no hashes.`;

  const actionPrompt = action && ACTIONS[action] ? ACTIONS[action] : "";
  const userMsg = actionPrompt
    ? `${actionPrompt}\n\nArticle Title: "${articleTitle}"\n\nArticle Content:\n${articleContent?.slice(0, 4000) || ""}${articleContent?.length > 4000 ? "\n...[truncated]" : ""}`
    : `Answer this question about the article:\n\nQuestion: ${question}\n\nArticle Title: "${articleTitle}"\n\nArticle Content:\n${articleContent?.slice(0, 4000) || ""}${articleContent?.length > 4000 ? "\n...[truncated]" : ""}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer":  "https://readlearc.vercel.app",
        "X-Title":       "Readlearc AI Assistant",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages:   [{ role:"system", content:sysPrompt }, { role:"user", content:userMsg }],
      }),
    });

    const d = await res.json();
    if (!res.ok) throw new Error(d.error?.message || "OpenRouter error");
    const text = d.choices?.[0]?.message?.content || "";
    return NextResponse.json({ ok:true, response:text, model });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
