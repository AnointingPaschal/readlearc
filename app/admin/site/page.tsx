"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Globe, Mail, DollarSign, Tag, ToggleLeft, ToggleRight } from "lucide-react";

const DEFAULTS = {
  platformName: "Readlearc",
  tagline: "Pay per word. Own every read.",
  description: "A pay-per-read article platform built on Arc blockchain. Writers publish content locked behind USDC micro-payments.",
  contactEmail: "",
  minPrice: "0.001",
  maxPrice: "1.00",
  referralEnabled: true,
  verificationRequired: false,
  categories: "Web3,Development,Blockchain,Economics,Research,Guide,AI,DeFi,Culture,Opinion",
};

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("rl-admin-settings") || "{}") }; }
  catch { return DEFAULTS; }
}

export default function SiteSettingsPage() {
  const [cfg,   setCfg]   = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setCfg(loadSettings()); }, []);

  function set(key: string, value: any) {
    setCfg(c => ({ ...c, [key]: value }));
    setDirty(true);
  }

  function save() {
    localStorage.setItem("rl-admin-settings", JSON.stringify(cfg));
    setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const Field = ({ label, helpText, children }: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block" }}>{label}</label>
        {helpText && <span style={{ fontSize: 11, color: "var(--text-4)" }}>{helpText}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>General Settings</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Platform-wide configuration</p>
      </div>

      {/* Branding */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Platform Identity</h2>
        <Field label="Platform Name">
          <input value={cfg.platformName} onChange={e => set("platformName", e.target.value)} className="admin-input" placeholder="Readlearc" />
        </Field>
        <Field label="Tagline" helpText="Shown in hero section and browser tab">
          <input value={cfg.tagline} onChange={e => set("tagline", e.target.value)} className="admin-input" placeholder="Pay per word. Own every read." />
        </Field>
        <Field label="Description" helpText="Used for SEO meta description">
          <textarea value={cfg.description} onChange={e => set("description", e.target.value)} className="admin-input" rows={3} style={{ resize: "vertical", height: "auto" }} />
        </Field>
        <Field label="Contact Email">
          <div style={{ position: "relative" }}>
            <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
            <input value={cfg.contactEmail} onChange={e => set("contactEmail", e.target.value)} className="admin-input" style={{ paddingLeft: 34 }} placeholder="admin@yourdomain.com" type="email" />
          </div>
        </Field>
      </div>

      {/* Pricing */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Article Pricing Limits</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Minimum Price (USDC)", key: "minPrice" as const },
            { label: "Maximum Price (USDC)", key: "maxPrice" as const },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 12px" }}>
                <DollarSign size={13} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                <input type="number" value={cfg[f.key]} step={0.001} min={0} onChange={e => set(f.key, e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 700, color: "var(--brand)", fontFamily: "Outfit, sans-serif" }} />
              </div>
            </Field>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Article Categories</h2>
        <Field label="Categories" helpText="Comma-separated list shown in write + explore pages">
          <textarea value={cfg.categories} onChange={e => set("categories", e.target.value)} className="admin-input" rows={2} style={{ resize: "vertical", height: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} />
        </Field>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cfg.categories.split(",").map(c => c.trim()).filter(Boolean).map(cat => (
            <span key={cat} className="badge badge-neutral" style={{ fontSize: 10 }}>{cat}</span>
          ))}
        </div>
      </div>

      {/* Feature flags */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Features</h2>
        {[
          { key: "referralEnabled", label: "Referral System", desc: "Enable 5% referral fee split on article reads" },
          { key: "verificationRequired", label: "Require Writer Verification", desc: "Only verified writers can publish articles" },
        ].map(f => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{f.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{f.desc}</div>
            </div>
            <button onClick={() => set(f.key, !(cfg as any)[f.key])} style={{ background: "none", border: "none", cursor: "pointer", color: (cfg as any)[f.key] ? "var(--brand)" : "var(--text-4)", padding: 0, flexShrink: 0 }}>
              {(cfg as any)[f.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={save} disabled={!dirty} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130, opacity: !dirty ? 0.5 : 1 }}>
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>

      <div style={{ padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>
        Settings are stored locally in your admin browser session. For persistence across environments, set them as environment variables in Vercel.
      </div>
    </div>
  );
}
