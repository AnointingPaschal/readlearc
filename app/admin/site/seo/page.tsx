"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Search, Globe } from "lucide-react";

const SEO_DEFAULTS = {
  metaTitle: "Readlearc — Pay per word. Own every read.",
  metaDescription: "A pay-per-read article platform built on Arc blockchain. Writers publish, readers pay in USDC, all on-chain.",
  metaKeywords: "pay-per-read, Arc blockchain, USDC, nanopayments, Circle, web3, articles",
  ogTitle: "Readlearc — Pay per word. Own every read.",
  ogDescription: "Pay-per-read articles on Arc blockchain. USDC nanopayments. Sub-second settlement.",
  twitterCard: "summary_large_image",
  siteUrl: "",
};

function loadSEO() {
  try { return { ...SEO_DEFAULTS, ...JSON.parse(localStorage.getItem("rl-seo") || "{}") }; }
  catch { return SEO_DEFAULTS; }
}

export default function SEOPage() {
  const [cfg, setCfg] = useState(SEO_DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setCfg(loadSEO()); }, []);

  function set(key: string, val: string) { setCfg(c => ({ ...c, [key]: val })); }
  function save() {
    localStorage.setItem("rl-seo", JSON.stringify(cfg));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const Field = ({ label, helpText, children }: any) => (
    <div>
      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block" }}>{label}</label>
        {helpText && <span style={{ fontSize: 11, color: "var(--text-4)" }}>{helpText}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>SEO Settings</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Meta tags and search engine configuration</p>
      </div>

      {/* Basic meta */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Search size={14} style={{ color: "var(--brand)" }} /><h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Basic Meta Tags</h2></div>
        <Field label="Meta Title" helpText={`${cfg.metaTitle.length}/70 chars`}>
          <input value={cfg.metaTitle} onChange={e => set("metaTitle", e.target.value)} className="admin-input" maxLength={70} />
        </Field>
        <Field label="Meta Description" helpText={`${cfg.metaDescription.length}/160 chars`}>
          <textarea value={cfg.metaDescription} onChange={e => set("metaDescription", e.target.value)} className="admin-input" rows={3} maxLength={160} style={{ resize: "vertical", height: "auto" }} />
        </Field>
        <Field label="Keywords" helpText="Comma-separated">
          <input value={cfg.metaKeywords} onChange={e => set("metaKeywords", e.target.value)} className="admin-input" />
        </Field>
        <Field label="Site URL" helpText="Your production domain">
          <div style={{ position: "relative" }}>
            <Globe size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
            <input value={cfg.siteUrl} onChange={e => set("siteUrl", e.target.value)} className="admin-input" style={{ paddingLeft: 34 }} placeholder="https://readlearc.io" type="url" />
          </div>
        </Field>
      </div>

      {/* OG */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Globe size={14} style={{ color: "#0284c7" }} /><h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Open Graph (Social Sharing)</h2></div>
        <Field label="OG Title">
          <input value={cfg.ogTitle} onChange={e => set("ogTitle", e.target.value)} className="admin-input" />
        </Field>
        <Field label="OG Description">
          <textarea value={cfg.ogDescription} onChange={e => set("ogDescription", e.target.value)} className="admin-input" rows={2} style={{ resize: "vertical", height: "auto" }} />
        </Field>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Google Search Preview</h2>
        <div style={{ padding: "14px 16px", background: "var(--bg-alt)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.metaTitle}</div>
          <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>{cfg.siteUrl || "https://readlearc.io"}</div>
          <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{cfg.metaDescription}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save SEO</>}
        </button>
      </div>

      <div style={{ padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>
        To apply SEO changes to your live site, update the <code style={{ fontFamily: "JetBrains Mono, monospace" }}>metadata</code> object in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>app/layout.tsx</code> with these values and redeploy on Vercel.
      </div>
    </div>
  );
}
