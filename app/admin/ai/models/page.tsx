"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Cpu } from "lucide-react";

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"],
  openai:    ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
};

const TASKS = [
  { key: "moderation",  label: "Content Moderation",  desc: "Analyze flagged articles" },
  { key: "riskScore",   label: "Risk Scoring",         desc: "Rate content risk level"  },
  { key: "summarize",   label: "Article Summaries",    desc: "Generate blurb suggestions" },
];

function loadModelCfg() {
  try { return JSON.parse(localStorage.getItem("rl-ai-models") || "{}"); }
  catch { return {}; }
}

function loadProvider() {
  try { return JSON.parse(localStorage.getItem("rl-ai-config") || "{}")?.activeProvider || "anthropic"; }
  catch { return "anthropic"; }
}

export default function ModelsPage() {
  const provider = loadProvider();
  const models = MODELS_BY_PROVIDER[provider] || MODELS_BY_PROVIDER.anthropic;
  const [cfg, setCfg]   = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = loadModelCfg();
    const defaults: Record<string, string> = {};
    TASKS.forEach(t => { defaults[t.key] = models[0]; });
    setCfg({ ...defaults, ...saved });
  }, []);

  function save() {
    localStorage.setItem("rl-ai-models", JSON.stringify(cfg));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>AI Models</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Assign models to tasks · Provider: <strong>{provider}</strong></p>
      </div>

      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {TASKS.map(t => (
          <div key={t.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Cpu size={13} style={{ color: "var(--brand)" }} />
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{t.label}</label>
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>— {t.desc}</span>
            </div>
            <select value={cfg[t.key] || models[0]} onChange={e => setCfg(c => ({ ...c, [t.key]: e.target.value }))}
              style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 12px", outline: "none", fontSize: 13, color: "var(--text)", cursor: "pointer", fontFamily: "JetBrains Mono, monospace" }}>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Models</>}
        </button>
      </div>
    </div>
  );
}
