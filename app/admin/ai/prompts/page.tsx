"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, RotateCcw, FlaskConical, Bot, ChevronDown, ChevronUp, Info } from "lucide-react";

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

PLAGIARISM (score 0-100):
- 0 = completely original content
- 100 = directly copied from known sources`;

const DEFAULT_RESEARCH = `You are an expert academic research writer embedded in the Readlearc Research Writing Studio. Your role is to write high-quality, academically rigorous content for university-level research projects and dissertations — particularly Nigerian university BSc/MSc project format.

OUTPUT FORMAT RULES (CRITICAL):
1. Write ALL headings in UPPERCASE on their own line, followed by a blank line.
2. Number sections: CHAPTER ONE, 1.1 BACKGROUND OF THE STUDY, 1.1.1 Sub-Section
3. Never use any markdown: no **, no *, no #, no ##, no >, no backticks
4. Write body text as clean prose paragraphs separated by blank lines
5. APA 7th Edition in-text citations: (Author, Year) or (Author et al., Year)
6. Formal third-person passive voice: "It was found that..." not "I found..."
7. End each section with: [Apply: Times New Roman 12pt, double-spaced, 1-inch margins]

DOCUMENT FORMAT STANDARD (Nigerian University BSc/MSc):
- Font: Times New Roman, 12pt
- Line spacing: Double-spaced (2.0)
- Margins: 1 inch (2.54 cm) all sides
- Alignment: Left-aligned
- Paragraph indent: 0.5 inches first line
- Page numbers: Roman numerals (prelims), Arabic from Chapter One, top-right

CHAPTER STRUCTURE:
ABSTRACT: 150-300 words, one paragraph covering: problem, methodology, findings, conclusion. End with Keywords.

CHAPTER ONE - INTRODUCTION:
1.1 Background of the Study
1.2 Statement of the Problem
1.3 Objectives (1.3.1 General, 1.3.2 Specific — each starting "To...")
1.4 Research Questions
1.5 Research Hypotheses (H0 and H1)
1.6 Significance of the Study
1.7 Scope of the Study

CHAPTER TWO - LITERATURE REVIEW:
2.1 Conceptual Framework
2.2 Theoretical Framework (min 2 theories)
2.3 Empirical Review (grouped by theme: author/year/method/findings/gap)
2.4 Gap in Literature

CHAPTER THREE - MATERIALS AND METHODS:
3.1 Study Design
3.2 Population of Study
3.3 Sample Size and Sampling Technique (Taro Yamane formula)
3.4 Data Collection Instrument
3.5 Validity and Reliability (Cronbach Alpha >0.7)
3.6 Method of Data Analysis (SPSS, ANOVA, Duncan MRT, p<0.05)

CHAPTER FOUR - RESULTS AND DISCUSSION:
4.1 Present data with [Insert Table X Here] placeholders
4.2 Answer each research question
4.3 Test hypotheses (H0 rejected/accepted, state p-value)
4.4 Discuss findings vs empirical review

CHAPTER FIVE - CONCLUSION AND RECOMMENDATIONS:
5.1 Summary of Findings (bulleted)
5.2 Conclusion (no new information)
5.3 Recommendations (addressed to specific stakeholders)
5.4 Suggestions for Further Studies

REFERENCES: APA 7th Edition, alphabetical by surname.`;

export default function PromptsPage() {
  const [quality,   setQuality]   = useState("");
  const [research,  setResearch]  = useState("");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string|null>(null);
  const [saved,     setSaved]     = useState<string|null>(null);
  const [showQ,     setShowQ]     = useState(false);
  const [showR,     setShowR]     = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d => {
      setQuality(d.quality_prompt || DEFAULT_QUALITY);
      setResearch(d.research_system_prompt || DEFAULT_RESEARCH);
      setLoading(false);
    }).catch(() => {
      setQuality(DEFAULT_QUALITY);
      setResearch(DEFAULT_RESEARCH);
      setLoading(false);
    });
  }, []);

  async function save(key: string, value: string, label: string) {
    setSaving(key);
    await fetch("/api/admin/settings", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(null); setSaved(label);
    setTimeout(() => setSaved(null), 3000);
  }

  const card = (children: React.ReactNode) => (
    <div className="card" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
      {children}
    </div>
  );

  const labelStyle: React.CSSProperties = {
    fontSize:10, fontWeight:800, color:"var(--text-4)",
    textTransform:"uppercase", letterSpacing:".08em",
    display:"block", fontFamily:"Outfit,sans-serif",
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:860 }}>
      {[...Array(2)].map((_,i) => <div key={i} className="skeleton" style={{ height:200, borderRadius:"var(--r-lg)" }}/>)}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:860 }}>
      <div>
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em", marginBottom:4 }}>AI Prompts</h1>
        <p style={{ fontSize:12, color:"var(--text-4)" }}>Edit the system instructions that control how the AI behaves. Changes take effect immediately.</p>
      </div>

      {saved && (
        <div style={{ padding:"10px 14px", background:"rgba(5,150,105,.07)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-md)", fontSize:13, color:"var(--accent)", display:"flex", gap:7 }}>
          <CheckCircle2 size={14}/>{saved} prompt saved.
        </div>
      )}

      {/* Research Writing Prompt */}
      <div className="card" style={{ padding:0, overflow:"hidden", border:"2px solid rgba(79,70,229,.2)" }}>
        <button onClick={() => setShowR(v=>!v)}
          style={{ width:"100%", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(79,70,229,.1)", border:"1.5px solid rgba(79,70,229,.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FlaskConical size={18} style={{ color:"#4f46e5" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)" }}>Research Writing System Prompt</div>
            <div style={{ fontSize:11, color:"var(--text-4)" }}>Controls the AI Research Assistant in the Research Studio — chapter structure, Nigerian university format, APA citations</div>
          </div>
          {showR ? <ChevronUp size={16} style={{ color:"var(--text-4)", flexShrink:0 }}/> : <ChevronDown size={16} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
        </button>
        {showR && (
          <div style={{ borderTop:"1px solid var(--border)", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ padding:"10px 13px", background:"rgba(79,70,229,.06)", border:"1px solid rgba(79,70,229,.15)", borderRadius:"var(--r-md)", display:"flex", gap:8, alignItems:"flex-start" }}>
              <Info size={13} style={{ color:"#4f46e5", flexShrink:0, marginTop:1 }}/>
              <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.6 }}>
                This prompt defines how the AI writes academic content. It includes output format rules, document formatting standards (Times New Roman 12pt, double-spaced, 1-inch margins), Nigerian BSc/MSc chapter structure, and APA 7th Edition citation rules. Edit to match your institution requirements.
              </p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={() => setResearch(DEFAULT_RESEARCH)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"var(--text-3)" }}>
                <RotateCcw size={11}/>Reset to Default
              </button>
              <button onClick={() => save("research_system_prompt", research, "Research Writing")} disabled={saving==="research_system_prompt"}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", background:"#4f46e5", border:"none", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"white", opacity:saving?"0.6":"1" }}>
                <Save size={11}/>{saving==="research_system_prompt" ? "Saving…" : "Save Prompt"}
              </button>
            </div>
            <textarea
              value={research}
              onChange={e => setResearch(e.target.value)}
              rows={28}
              style={{ width:"100%", padding:"12px 14px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", fontSize:11, fontFamily:"JetBrains Mono,monospace", color:"var(--text)", outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box" as const }}
            />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={() => save("research_system_prompt", research, "Research Writing")} disabled={saving==="research_system_prompt"}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 20px", background:"#4f46e5", border:"none", borderRadius:"var(--r-lg)", cursor:"pointer", fontSize:13, fontWeight:700, color:"white", opacity:saving?"0.6":"1", fontFamily:"Outfit,sans-serif" }}>
                <Save size={13}/>{saving==="research_system_prompt" ? "Saving…" : "Save Research Prompt"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Quality Prompt */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <button onClick={() => setShowQ(v=>!v)}
          style={{ width:"100%", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Bot size={18} style={{ color:"var(--brand)" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)" }}>Content Quality Analyser Prompt</div>
            <div style={{ fontSize:11, color:"var(--text-4)" }}>System instructions for the AI that scores article quality, originality, AI detection and plagiarism</div>
          </div>
          {showQ ? <ChevronUp size={16} style={{ color:"var(--text-4)", flexShrink:0 }}/> : <ChevronDown size={16} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
        </button>
        {showQ && (
          <div style={{ borderTop:"1px solid var(--border)", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={() => setQuality(DEFAULT_QUALITY)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"var(--text-3)" }}>
                <RotateCcw size={11}/>Reset to Default
              </button>
              <button onClick={() => save("quality_prompt", quality, "Content Quality")} disabled={saving==="quality_prompt"}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", background:"var(--brand)", border:"none", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"white", opacity:saving?"0.6":"1" }}>
                <Save size={11}/>{saving==="quality_prompt" ? "Saving…" : "Save Prompt"}
              </button>
            </div>
            <textarea
              value={quality}
              onChange={e => setQuality(e.target.value)}
              rows={20}
              style={{ width:"100%", padding:"12px 14px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", fontSize:11, fontFamily:"JetBrains Mono,monospace", color:"var(--text)", outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box" as const }}
            />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={() => save("quality_prompt", quality, "Content Quality")} disabled={saving==="quality_prompt"}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 20px", background:"var(--brand)", border:"none", borderRadius:"var(--r-lg)", cursor:"pointer", fontSize:13, fontWeight:700, color:"white", opacity:saving?"0.6":"1", fontFamily:"Outfit,sans-serif" }}>
                <Save size={13}/>{saving==="quality_prompt" ? "Saving…" : "Save Quality Prompt"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
