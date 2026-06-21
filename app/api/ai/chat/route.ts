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

export async function POST(req: NextRequest) {
  const { articleId, action, question, articleContent, articleTitle, model: clientModel } = await req.json();

  // Get AI config from platform_settings
  const { data: cfg } = await supabaseAdmin.from("platform_settings")
    .select("key,value").in("key",["ai_api_key","ai_model","ai_user_price"]);
  const settings: Record<string,string> = {};
  for (const r of cfg||[]) settings[r.key] = r.value;

  const apiKey = settings.ai_api_key || "";
  const model  = clientModel || settings.ai_model || "anthropic/claude-haiku-4-5";

  if (!apiKey) return NextResponse.json({ error:"AI not configured. Admin must set OpenRouter API key." }, { status:400 });

  // Build prompt
  const sysPrompt = `You are an intelligent reading assistant for Readlearc, a pay-per-read publishing platform. You help readers understand and engage more deeply with articles. Be helpful, accurate, and concise. Format your responses clearly.`;

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
