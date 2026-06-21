import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

async function getConfig() {
  const { data } = await supabaseAdmin.from("platform_settings").select("key,value")
    .in("key",["ai_api_key","ai_model","ai_auto_approve","ai_prompt_quality"]);
  const c: Record<string,string> = {};
  for (const r of data||[]) c[r.key]=r.value;
  return { apiKey:c.ai_api_key||"", model:c.ai_model||"anthropic/claude-haiku-4-5", autoApprove:c.ai_auto_approve==="true", customPrompt:c.ai_prompt_quality||"" };
}

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

async function callAI(apiKey:string, model:string, prompt:string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`,"HTTP-Referer":"https://readlearc.vercel.app","X-Title":"Readlearc"},
    body:JSON.stringify({ model, max_tokens:700, temperature:0.1, messages:[{role:"user",content:prompt}], response_format:{type:"json_object"} }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message||JSON.stringify(d.error)||"OpenRouter error");
  return d.choices?.[0]?.message?.content||"";
}

export async function POST(_:NextRequest,{params}:C) {
  const {id} = await params;
  const {data:article} = await supabaseAdmin.from("articles").select("title,content,status").eq("id",id).single();
  if (!article) return NextResponse.json({error:"Article not found"},{status:404});

  const {apiKey,model,autoApprove,customPrompt} = await getConfig();
  if (!apiKey) return NextResponse.json({error:"No OpenRouter API key. Go to Admin → AI → OpenRouter AI."},{ status:400 });
  if (!model)  return NextResponse.json({error:"No active model. Go to Admin → AI → OpenRouter AI."},{ status:400 });

  const words    = (article.content||"").split(/\s+/).filter(Boolean).length;
  const prompt   = buildPrompt(customPrompt, article.title, article.content||"", words);

  try {
    const raw  = await callAI(apiKey, model, prompt);
    const data = JSON.parse(raw.replace(/```json|```/g,"").trim());
    const clamp= (n:number)=>Math.min(100,Math.max(0,Math.round(n||0)));

    const row = {
      article_id:        parseInt(id),
      plagiarism_score:  clamp(data.plagiarism_score),
      ai_score:          clamp(data.ai_score),
      quality_score:     clamp(data.quality_score),
      originality_score: clamp(data.originality_score),
      plagiarism_notes:  (data.plagiarism_notes||"").slice(0,200),
      ai_notes:          (data.ai_notes||"").slice(0,200),
      quality_notes:     (data.quality_notes||"").slice(0,200),
      originality_notes: (data.originality_notes||"").slice(0,200),
      recommendation:    ["approve","review","reject"].includes(data.recommendation)?data.recommendation:"review",
      analyzed_at:       new Date().toISOString(),
    };
    await supabaseAdmin.from("article_analysis").upsert(row,{onConflict:"article_id"});
    if (autoApprove && row.recommendation==="approve" && article.status==="pending") {
      await supabaseAdmin.from("articles").update({status:"approved"}).eq("id",id);
    }
    return NextResponse.json({ok:true,model,analysis:{...row,summary:data.summary||""},autoApproved:autoApprove&&row.recommendation==="approve"});
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}

export async function GET(_:NextRequest,{params}:C) {
  const {id} = await params;
  const {data} = await supabaseAdmin.from("article_analysis").select("*").eq("article_id",id).maybeSingle();
  return NextResponse.json(data||null);
}
