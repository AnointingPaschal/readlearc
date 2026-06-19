"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, RotateCcw } from "lucide-react";

const DEFAULT_PROMPTS = {
  moderation: `You are a content moderation AI for Readlearc, a pay-per-read publishing platform on Arc blockchain.

Analyze the following article and determine if it violates platform policies.

Policies:
- No spam or get-rich-quick schemes
- No misleading financial advice
- No hate speech or harassment  
- No plagiarized content
- No excessive self-promotion or referral link abuse

Respond with JSON only:
{
  "risk": "HIGH" | "MEDIUM" | "LOW",
  "violations": ["list of specific violations found"],
  "recommendation": "APPROVE" | "REVIEW" | "REJECT",
  "reason": "brief explanation"
}`,

  riskScore: `You are a risk scoring AI for a web3 publishing platform.
  
Score this content from 0-100 for platform risk. Consider:
- Financial claims accuracy
- Spam indicators  
- User safety concerns
- Community impact

Return JSON: { "score": number, "factors": ["key risk factors"] }`,
};

function loadPrompts() {
  try { return { ...DEFAULT_PROMPTS, ...JSON.parse(localStorage.getItem("rl-ai-prompts") || "{}") }; }
  catch { return DEFAULT_PROMPTS; }
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [active,  setActive]  = useState<keyof typeof DEFAULT_PROMPTS>("moderation");
  const [saved,   setSaved]   = useState(false);

  useEffect(() => { setPrompts(loadPrompts()); }, []);

  function save() {
    localStorage.setItem("rl-ai-prompts", JSON.stringify(prompts));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  function reset() { setPrompts(p => ({ ...p, [active]: (DEFAULT_PROMPTS as any)[active] })); }

  const tabs = [
    { key: "moderation", label: "Content Moderation" },
    { key: "riskScore",  label: "Risk Scoring" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>AI Prompts</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>System prompts used for AI content analysis</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key as any)} style={{
            padding: "8px 16px", border: "none", background: "transparent",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            color: active === t.key ? "var(--brand)" : "var(--text-4)",
            borderBottom: `2px solid ${active === t.key ? "var(--brand)" : "transparent"}`,
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--bg-alt)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>System Prompt</span>
          <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-4)", fontWeight: 600 }}>
            <RotateCcw size={11} /> Reset to default
          </button>
        </div>
        <textarea
          value={(prompts as any)[active]}
          onChange={e => setPrompts(p => ({ ...p, [active]: e.target.value }))}
          style={{ width: "100%", minHeight: 320, padding: "16px", border: "none", outline: "none", resize: "vertical", fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.7, background: "var(--bg-card)", color: "var(--text)" }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Prompts</>}
        </button>
      </div>
    </div>
  );
}
