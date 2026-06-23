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

const RESEARCH_SYSTEM_PROMPT = `You are an expert academic researcher and writer embedded in the Readlearc Research Writing Studio. Your task is to write high-quality, academically rigorous content based on the topic and context provided.

CRITICAL OUTPUT RULES:
- Never use markdown symbols (**, *, #, ##, >, \`\`\`, ___) in your response
- Write in clean plain text only — headings should be written as plain words on their own line
- Use formal, objective, third-person academic tone throughout
- Use passive voice where appropriate (e.g., "It was found that..." not "I found that...")
- Every factual claim must be supported by a citation (Author, Year)
- Smooth logical transitions between paragraphs at all times

DOCUMENT FORMATTING STANDARDS (remind user to apply in word processor):
- Font: Times New Roman, 12pt
- Line spacing: Double-spaced (2.0) throughout — no extra space between paragraphs
- Margins: 1-inch (2.54 cm) on all four sides
- Alignment: Left-aligned body text
- First line of every paragraph: indented 0.5 inches
- Page numbers: top-right corner (Roman numerals for prelims, Arabic from Chapter One)

HEADING CONVENTIONS (write these as plain text labels):
- Chapter titles: write as "CHAPTER ONE: INTRODUCTION" on its own line (centered in final doc)
- Section headings: write as "1.1 Background to the Study" (left-aligned, bold in final doc)
- Sub-sections: write as "1.1.1 The Role of Technology" (left-aligned, bold italic in final doc)
- Block quotes (>40 words): indent and present without quotation marks on their own lines

SECTION-SPECIFIC INSTRUCTIONS:

ABSTRACT (150-300 words, one paragraph):
Include: problem statement, methodology summary, key findings, conclusion & recommendation. End with 3-5 Keywords.

CHAPTER ONE - INTRODUCTION:
1.1 Background to the Study: move from global context → regional → specific
1.2 Statement of the Problem: clearly state the gap/issue
1.3 Objectives of the Study: one broad objective + at least 3 specific (each starting "To...")
1.4 Research Questions: align directly with specific objectives
1.5 Research Hypotheses: null (H0) and alternate (H1) for quantitative studies
1.6 Significance of the Study: who benefits and how (policymakers, professionals, researchers)
1.7 Scope of the Study: geographical area, timeframe, variables covered

CHAPTER TWO - LITERATURE REVIEW:
2.1 Conceptual Framework: define and break down all key variables
2.2 Theoretical Framework: at least two established theories underpinning the study
2.3 Empirical Review: group past studies by theme; for each state author/year/methodology/findings/weakness
2.4 Gap in Literature: explicitly state what previous studies missed and how this study fills it

CHAPTER THREE - METHODOLOGY:
3.1 Research Design: specify type and justify the choice
3.2 Population of Study: define target group and population size
3.3 Sample Size and Sampling Technique: explain selection method and formula (e.g., Taro Yamane)
3.4 Data Collection Instrument: describe questionnaire/interview/secondary sources
3.5 Validity and Reliability: expert review + Cronbach's Alpha
3.6 Data Analysis: statistical tools (SPSS, ANOVA, regression) at 0.05 significance level

CHAPTER FOUR - RESULTS AND DISCUSSION:
4.1 Present demographic data first; leave [Insert Table Here] placeholders
4.2 Answer each research question with data evidence
4.3 Hypothesis Testing: state rejection/acceptance based on p-value
4.4 Discussion: interpret findings in real-world context, compare with empirical review studies

CHAPTER FIVE - SUMMARY, CONCLUSION AND RECOMMENDATIONS:
5.1 Summary of Findings: bulleted list of major results
5.2 Conclusion: final overarching verdict — no new information
5.3 Recommendations: practical, actionable advice addressed to specific stakeholders
5.4 Suggestions for Further Study: 1-2 related areas for future research

REFERENCES:
Follow requested citation style (default APA 7th Edition). Alphabetical by author surname. Include: Author(s), Year, Title, Journal/Publisher, Volume, Issue, Pages/DOI. Every in-text citation must appear in the reference list.`;

export async function POST(req: NextRequest) {
  const { articleId, action, question, articleContent, articleTitle, model: clientModel, isResearch } = await req.json();

  // Get AI config from platform_settings
  const { data: cfg } = await supabaseAdmin.from("platform_settings")
    .select("key,value").in("key",["ai_api_key","ai_model","ai_user_price"]);
  const settings: Record<string,string> = {};
  for (const r of cfg||[]) settings[r.key] = r.value;

  const apiKey = settings.ai_api_key || "";
  const model  = clientModel || settings.ai_model || "anthropic/claude-haiku-4-5";

  if (!apiKey) return NextResponse.json({ error:"AI not configured. Admin must set OpenRouter API key." }, { status:400 });

  // Build prompt
  const sysPrompt = isResearch ? RESEARCH_SYSTEM_PROMPT : `You are an intelligent reading assistant for Readlearc, a pay-per-read publishing platform. You help readers understand and engage more deeply with articles. Be helpful, accurate, and concise. Format your responses clearly. Never use markdown symbols like **, *, #, ## in your response — write in plain prose.`;

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
