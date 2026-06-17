"use client";
import { useState } from "react";
import { Save } from "lucide-react";

export default function ThemePage() {
  const [theme, setTheme] = useState({
    homepage_style: "Feed", article_width: "720px", sidebar: "Right",
    heading_font: "Outfit", body_font: "Inter", base_font_size: 16,
    line_height: 1.75, default_color_mode: "Dark", allow_user_toggle: true,
    paywall_blur_intensity: 5, paywall_cta_text: "🔓 Pay $0.02 to Read", paywall_cta_color: "#7C3AED",
  });
  const [saved, setSaved] = useState(false);

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-gray-300 mb-1.5 block">{label}</label>
      {children}
    </div>
  );

  const Select = ({ field, opts }: { field: keyof typeof theme; opts: string[] }) => (
    <select value={theme[field] as string} onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50">
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Theme & Appearance</h1>
        <p className="text-gray-500 text-sm mt-1">Control layout, typography, and paywall settings.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-sm text-gray-400">Layout</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Homepage Style"><Select field="homepage_style" opts={["Feed", "Magazine"]} /></Field>
          <Field label="Article Width"><Select field="article_width" opts={["640px", "720px", "800px"]} /></Field>
          <Field label="Sidebar"><Select field="sidebar" opts={["Left", "Right", "None"]} /></Field>
          <Field label="Color Mode"><Select field="default_color_mode" opts={["Dark", "Light", "System"]} /></Field>
        </div>
        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div>
            <div className="text-sm font-medium">Allow User Toggle</div>
            <div className="text-xs text-gray-500">Let readers switch between dark/light</div>
          </div>
          <button onClick={() => setTheme({ ...theme, allow_user_toggle: !theme.allow_user_toggle })}
            className={`w-11 h-6 rounded-full transition-colors relative ${theme.allow_user_toggle ? "bg-arc-500" : "bg-gray-700"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${theme.allow_user_toggle ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-sm text-gray-400">Typography</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Heading Font">
            <input value={theme.heading_font} onChange={(e) => setTheme({ ...theme, heading_font: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </Field>
          <Field label="Body Font">
            <input value={theme.body_font} onChange={(e) => setTheme({ ...theme, body_font: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </Field>
          <Field label="Base Font Size (px)">
            <input type="number" value={theme.base_font_size} onChange={(e) => setTheme({ ...theme, base_font_size: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </Field>
          <Field label="Line Height">
            <input type="number" step="0.05" value={theme.line_height} onChange={(e) => setTheme({ ...theme, line_height: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </Field>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-sm text-gray-400">Paywall Settings</h2>
        <Field label={`Blur Intensity: ${theme.paywall_blur_intensity}`}>
          <input type="range" min={0} max={10} value={theme.paywall_blur_intensity}
            onChange={(e) => setTheme({ ...theme, paywall_blur_intensity: +e.target.value })}
            className="w-full accent-arc-500" />
        </Field>
        <Field label="CTA Button Text">
          <input value={theme.paywall_cta_text} onChange={(e) => setTheme({ ...theme, paywall_cta_text: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
        </Field>
        <div className="p-3 rounded-xl border border-white/10 flex items-center gap-3" style={{ background: theme.paywall_cta_color + "20" }}>
          <span className="text-sm">Preview:</span>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: theme.paywall_cta_color }}>
            {theme.paywall_cta_text}
          </button>
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
        <Save className="w-4 h-4" />{saved ? "Saved! ✓" : "Save Theme"}
      </button>
    </div>
  );
}
