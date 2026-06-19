"use client";
import { useState } from "react";
import { Sun, Moon, Save, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../../../lib/theme";

export default function ThemePage() {
  const { theme, toggle } = useTheme();
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const SCHEMES = [
    { id: "purple-green", label: "Purple & Green", primary: "#6d28d9", accent: "#059669" },
    { id: "blue-teal",    label: "Blue & Teal",    primary: "#1d4ed8", accent: "#0d9488" },
    { id: "rose-amber",   label: "Rose & Amber",   primary: "#be185d", accent: "#d97706" },
    { id: "slate-indigo", label: "Slate & Indigo",  primary: "#374151", accent: "#4f46e5" },
  ];

  const [scheme, setScheme] = useState("purple-green");

  function applyScheme(s: typeof SCHEMES[0]) {
    setScheme(s.id);
    document.documentElement.style.setProperty("--brand", s.primary);
    document.documentElement.style.setProperty("--accent", s.accent);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Theme</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Light/dark mode and color scheme</p>
      </div>

      {/* Mode toggle */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Display Mode</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { id: "light", label: "Light Mode", icon: Sun, desc: "Clean white background" },
            { id: "dark",  label: "Dark Mode",  icon: Moon, desc: "Dark background for low light" },
          ].map(m => {
            const active = theme === m.id;
            return (
              <button key={m.id} onClick={toggle} style={{ padding: "16px", borderRadius: "var(--radius)", border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`, background: active ? "var(--brand-muted)" : "var(--bg-alt)", cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                <m.icon size={22} style={{ color: active ? "var(--brand)" : "var(--text-4)", marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--brand)" : "var(--text)" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>{m.desc}</div>
                {active && <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: "var(--brand)" }}>ACTIVE</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color scheme */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Color Scheme</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SCHEMES.map(s => {
            const active = scheme === s.id;
            return (
              <button key={s.id} onClick={() => applyScheme(s)} style={{ padding: "14px", borderRadius: "var(--radius)", border: `1.5px solid ${active ? s.primary : "var(--border)"}`, background: active ? `${s.primary}10` : "var(--bg-alt)", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.primary }} />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.accent }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? s.primary : "var(--text)" }}>{s.label}</div>
                {active && <div style={{ fontSize: 10, fontWeight: 700, color: s.primary, marginTop: 3 }}>ACTIVE</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 130 }}>
          {saved ? <><CheckCircle2 size={14} /> Applied!</> : <><Save size={14} /> Save Theme</>}
        </button>
      </div>
    </div>
  );
}
