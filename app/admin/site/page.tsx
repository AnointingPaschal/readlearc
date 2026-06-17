"use client";
import { useState } from "react";
import { Save, Globe, Mail, Clock, AlertTriangle } from "lucide-react";

export default function SiteSettingsPage() {
  const [form, setForm] = useState({
    site_name: "Readlearc",
    tagline: "Pay per word. Own every read.",
    site_url: "https://readlearc.io",
    support_email: "support@readlearc.io",
    default_language: "English",
    timezone: "UTC",
    maintenance_mode: false,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">General Site Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your platform&apos;s core identity and settings.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Site Name</label>
          <input
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
            <Globe className="w-3.5 h-3.5 inline mr-1.5 text-gray-500" />Site URL
          </label>
          <input
            value={form.site_url}
            onChange={(e) => setForm({ ...form, site_url: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
            <Mail className="w-3.5 h-3.5 inline mr-1.5 text-gray-500" />Support Email
          </label>
          <input
            value={form.support_email}
            onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Language</label>
            <select
              value={form.default_language}
              onChange={(e) => setForm({ ...form, default_language: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm"
            >
              {["English", "Spanish", "French", "German", "Portuguese"].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-gray-500" />Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arc-500/50 text-sm"
            >
              {["UTC", "America/New_York", "Europe/London", "Asia/Singapore", "Asia/Tokyo"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Maintenance mode */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white">Maintenance Mode</div>
              <div className="text-xs text-gray-500">Blocks all public routes. Shows maintenance page to visitors.</div>
            </div>
          </div>
          <button
            onClick={() => setForm({ ...form, maintenance_mode: !form.maintenance_mode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.maintenance_mode ? "bg-red-500" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.maintenance_mode ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all"
      >
        <Save className="w-4 h-4" />
        {saved ? "Saved! ✓" : "Save Changes"}
      </button>
    </div>
  );
}
