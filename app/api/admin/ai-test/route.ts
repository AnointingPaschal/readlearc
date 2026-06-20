import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  const { data: settings } = await supabaseAdmin
    .from("platform_settings").select("key,value").in("key",["ai_provider","ai_model","ai_api_key"]);
  const cfg: Record<string,string> = {};
  for (const s of settings||[]) cfg[s.key]=s.value;

  const provider = cfg.ai_provider || "anthropic";
  const model    = cfg.ai_model    || "claude-haiku-4-5-20251001";
  const apiKey   = cfg.ai_api_key  || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) return NextResponse.json({ ok:false, error:"No API key configured" });

  const testPrompt = 'Return exactly this JSON: {"test":"ok","status":"connected"}';

  try {
    let text = "";
    if (provider==="openai"||provider==="groq"||provider==="deepseek") {
      const url = provider==="openai"?"https://api.openai.com/v1/chat/completions":provider==="groq"?"https://api.groq.com/openai/v1/chat/completions":"https://api.deepseek.com/chat/completions";
      const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model,max_tokens:50,messages:[{role:"user",content:testPrompt}]})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||"Error");
      text = d.choices?.[0]?.message?.content||"";
    } else if (provider==="anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model,max_tokens:50,messages:[{role:"user",content:testPrompt}]})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||"Error");
      text = d.content?.[0]?.text||"";
    } else if (provider==="gemini") {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:testPrompt}]}],generationConfig:{maxOutputTokens:50}})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||"Error");
      text = d.candidates?.[0]?.content?.parts?.[0]?.text||"";
    }
    return NextResponse.json({ ok:true, provider, model, response:text.slice(0,100) });
  } catch(e:any) {
    return NextResponse.json({ ok:false, error:e.message });
  }
}
