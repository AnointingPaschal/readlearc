"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Zap } from "lucide-react";

const BRAND_DEFAULTS = { primaryColor: "#6d28d9", accentColor: "#059669", logoText: "Readlearc", logoTagline: "Admin" };

function loadBrand() {
  try { return { ...BRAND_DEFAULTS, ...JSON.parse(localStorage.getItem("rl-branding") || "{}") }; }
  catch { return BRAND_DEFAULTS; }
}

export default function BrandingPage() {
  const [cfg, setCfg] = useState(BRAND_DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setCfg(loadBrand()); }, []);

  function set(key: string, val: string) { setCfg(c => ({ ...c, [key]: val })); }

  function save() {
    localStorage.setItem("rl-branding", JSON.stringify(cfg));
    // Apply brand colors live
    document.documentElement.style.setProperty("--brand", cfg.primaryColor);
    document.documentElement.style.setProperty("--accent", cfg.accentColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Branding</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Colors, logo, and visual identity</p>
      </div>

      {/* Logo preview */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Logo Preview</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px", background: "var(--bg-alt)", borderRadius: "var(--radius)", marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.accentColor})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${cfg.primaryColor}55` }}>
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text)" }}>{cfg.logoText}</div>
            <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.logoTagline}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Logo Text</label>
            <input value={cfg.logoText} onChange={e => set("logoText", e.target.value)} className="admin-input" placeholder="Readlearc" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Tagline (admin)</label>
            <input value={cfg.logoTagline} onChange={e => set("logoTagline", e.target.value)} className="admin-input" placeholder="Admin Panel" />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Brand Colors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { key: "primaryColor", label: "Primary (Brand)", desc: "Buttons, active links, badges" },
            { key: "accentColor",  label: "Accent (Green)",  desc: "Earnings, success states, USDC" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{f.label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px" }}>
                <input type="color" value={(cfg as any)[f.key]} onChange={e => set(f.key, e.target.value)} style={{ width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "JetBrains Mono, monospace" }}>{(cfg as any)[f.key]}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)" }}>{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Color preview strip */}
        <div style={{ marginTop: 14, height: 8, borderRadius: "var(--radius-full)", background: `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.accentColor})`, overflow: "hidden" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Applied!</> : <><Save size={14} /> Apply Branding</>}
        </button>
      </div>
    </div>
  );
}
