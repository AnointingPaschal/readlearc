"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";

function loadCfg() {
  try { return JSON.parse(localStorage.getItem("rl-ai-config") || "{}"); }
  catch { return {}; }
}

export default function ProvidersPage() {
  const [cfg, setCfg]     = useState({ anthropicKey: "", openaiKey: "", activeProvider: "anthropic" });
  const [showKeys, setShowKeys] = useState({ anthropic: false, openai: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => { const c = loadCfg(); if (c) setCfg(cc => ({ ...cc, ...c })); }, []);

  function set(key: string, val: string) { setCfg(c => ({ ...c, [key]: val })); }

  function save() {
    localStorage.setItem("rl-ai-config", JSON.stringify(cfg));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const providers = [
    { id: "anthropic", label: "Anthropic (Claude)",   keyField: "anthropicKey" as const, placeholder: "sk-ant-api03-…", docsUrl: "https://console.anthropic.com" },
    { id: "openai",    label: "OpenAI (GPT-4)",       keyField: "openaiKey"    as const, placeholder: "sk-proj-…",      docsUrl: "https://platform.openai.com" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>AI Providers</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Configure API keys for content moderation AI</p>
      </div>

      <div style={{ padding: "12px 14px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.18)", borderRadius: "var(--radius)", display: "flex", gap: 8 }}>
        <AlertCircle size={14} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
          API keys are stored in your browser only. For production, add them as environment variables in Vercel: <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>ANTHROPIC_API_KEY</code> / <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>OPENAI_API_KEY</code>
        </span>
      </div>

      {providers.map(p => {
        const hasKey = !!(cfg as any)[p.keyField];
        const show = (showKeys as any)[p.id];
        return (
          <div key={p.id} className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.label}</h2>
                {hasKey && <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.18)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>CONFIGURED</span>}
              </div>
              <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Get API key →</a>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>API Key</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={(cfg as any)[p.keyField]}
                  onChange={e => set(p.keyField, e.target.value)}
                  className="admin-input"
                  placeholder={p.placeholder}
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, paddingRight: 44 }}
                />
                <button onClick={() => setShowKeys(s => ({ ...s, [p.id]: !show }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex" }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="radio" id={p.id} name="provider" checked={cfg.activeProvider === p.id} onChange={() => set("activeProvider", p.id)} style={{ accentColor: "var(--brand)", cursor: "pointer" }} />
              <label htmlFor={p.id} style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>Use as active provider</label>
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Keys</>}
        </button>
      </div>
    </div>
  );
}
