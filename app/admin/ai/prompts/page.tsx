"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, RotateCcw } from "lucide-react";

const DEFAULT_QUALITY = `You are an expert content quality analyst for Readlearc, a pay-per-read publishing platform on Arc blockchain.

Analyze the following article based on these criteria:

QUALITY (score 0-100):
- Length: articles should be substantial and informative (min 300 words ideal)
- Informative: provides real value, insights, or knowledge to the reader
- Well-formatted: clear structure, paragraphs, good readability
- User-lovable: engaging, interesting, enjoyable to read
- No abusive/offensive language or inappropriate content
- Score < 30 if under 100 words or completely incoherent

ORIGINALITY (score 0-100):
- Writer's own voice and perspective
- No obvious copy-paste from other sources
- Not generic filler content
- Contains unique insights, experiences, or analysis
- Score < 20 if clearly copied or entirely generic

AI-GENERATED (score 0-100):
- 0 = clearly human-written with personality and imperfections
- 100 = robotic, overly structured, no genuine human voice
- Look for: excessive bullet points, repetitive phrases, no personal voice

PLAGIARISM (score 0-100):
- 0 = completely original content
- 100 = directly copied from known sources
- Look for: unnatural formal language shifts, inconsistent writing style`;

const DEFAULT_RISK = `You are a content risk assessor for Readlearc.

Analyze the article for policy violations:

POLICIES:
- No spam or get-rich-quick schemes
- No misleading financial advice  
- No hate speech, harassment, or discrimination
- No plagiarized content
- No excessive self-promotion or referral link abuse
- No adult/explicit content
- No misinformation or fake news

Respond with JSON only:
{
  "risk": "HIGH" | "MEDIUM" | "LOW",
  "violations": ["list of specific violations found"],
  "approved": true | false,
  "notes": "brief summary"
}`;

const TABS = [
  { key:"ai_prompt_quality",  label:"Content Moderation",  default:DEFAULT_QUALITY },
  { key:"ai_prompt_risk",     label:"Risk Scoring",        default:DEFAULT_RISK    },
];

export default function PromptsPage() {
  const [values,  setValues]  = useState<Record<string,string>>({});
  const [active,  setActive]  = useState("ai_prompt_quality");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    const vals: Record<string,string> = {};
    for (const t of TABS) vals[t.key] = d[t.key] || t.default;
    setValues(vals);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function save() {
    setSaving(true); setSaved(false);
    await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  }

  function reset() {
    const t = TABS.find(t=>t.key===active);
    if (t) setValues(v=>({...v,[t.key]:t.default}));
  }

  const tab = TABS.find(t=>t.key===active)!;

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:700 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>AI Prompts</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>System prompts used for AI content analysis</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={reset} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RotateCcw size={12}/>Reset to default
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6 }}>
            {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?"Saving…":<><Save size={12}/>Save Prompts</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"1px solid var(--border)",gap:0 }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActive(t.key)} style={{ padding:"10px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:active===t.key?700:400,color:active===t.key?"var(--text)":"var(--text-4)",borderBottom:`2px solid ${active===t.key?"var(--brand)":"transparent"}`,transition:"all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Prompt editor */}
      <div className="card" style={{ padding:0,overflow:"hidden" }}>
        <div style={{ padding:"10px 16px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".1em",fontFamily:"Outfit,sans-serif" }}>System Prompt</span>
        </div>
        {loading
          ? <div className="skeleton" style={{ height:360,borderRadius:0 }}/>
          : <textarea
              value={values[active]||""}
              onChange={e=>setValues(v=>({...v,[active]:e.target.value}))}
              style={{ width:"100%",minHeight:380,padding:"16px 18px",border:"none",outline:"none",background:"var(--bg-card)",fontFamily:"JetBrains Mono,monospace",fontSize:12,lineHeight:1.7,color:"var(--text)",resize:"vertical" }}
            />
        }
      </div>

      <div style={{ padding:"10px 14px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r-md)",fontSize:11,color:"var(--text-4)",lineHeight:1.65 }}>
        <strong style={{ color:"var(--text-3)" }}>Tip:</strong> The Content Moderation prompt is used for quality, originality, AI detection, and plagiarism scoring. The Risk Scoring prompt checks for policy violations. Both are sent to your configured OpenRouter model.
      </div>
    </div>
  );
}
