"use client";
import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";

export default function SEOPage() {
  const [form, setForm] = useState({
    meta_title_template: "%article_title% | Readlearc",
    meta_description: "Pay-per-read articles on Arc blockchain. USDC nanopayments. Sub-second settlement.",
    keywords: "pay-per-read, Arc blockchain, USDC, nanopayments, Circle, web3",
    google_analytics_id: "",
    twitter_handle: "@readlearc",
    auto_generate_sitemap: true,
    canonical_url: "https://readlearc.io",
    robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://readlearc.io/sitemap.xml",
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">SEO & Metadata</h1>
        <p className="text-gray-500 text-sm mt-1">Control how Readlearc appears in search engines and social media.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {[
          { label: "Meta Title Template", key: "meta_title_template", hint: "Use %article_title% as a placeholder" },
          { label: "Canonical URL", key: "canonical_url" },
          { label: "Google Analytics ID", key: "google_analytics_id", placeholder: "G-XXXXXXXXXX" },
          { label: "Twitter Handle", key: "twitter_handle", placeholder: "@handle" },
        ].map(({ label, key, hint, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">{label}</label>
            <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
            {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Meta Description</label>
          <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            rows={3} maxLength={160}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 resize-none" />
          <div className="text-right text-xs text-gray-600">{form.meta_description.length}/160</div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Keywords</label>
          <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">robots.txt</label>
          <textarea value={form.robots_txt} onChange={(e) => setForm({ ...form, robots_txt: e.target.value })}
            rows={6} className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-arc-500/50 resize-none" />
        </div>

        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div>
            <div className="text-sm font-medium">Auto-generate Sitemap</div>
            <div className="text-xs text-gray-500">Regenerate sitemap.xml on every publish</div>
          </div>
          <button onClick={() => setForm({ ...form, auto_generate_sitemap: !form.auto_generate_sitemap })}
            className={`w-11 h-6 rounded-full relative transition-colors ${form.auto_generate_sitemap ? "bg-arc-500" : "bg-gray-700"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.auto_generate_sitemap ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
          <Save className="w-4 h-4" />{saved ? "Saved! ✓" : "Save SEO Settings"}
        </button>
        <button className="flex items-center gap-2 px-5 py-3 glass border border-white/10 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-all">
          <RefreshCw className="w-4 h-4" />Regenerate Sitemap
        </button>
      </div>
    </div>
  );
}
