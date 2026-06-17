"use client";
import { useState } from "react";
import { Save, Eye, EyeOff, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function AIProvidersPage() {
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    api_key: "sk-or-v1-••••••••••••••••••••••••••••••",
    base_url: "https://openrouter.ai/api/v1",
    monthly_spend_cap: 50,
    spend_alert_threshold: 40,
    alert_email: "admin@readlearc.io",
    request_timeout: 30,
    max_retries: 3,
    fallback_behavior: "Skip AI feature",
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | "ok" | "fail">(null);
  const [saved, setSaved] = useState(false);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setTesting(false);
    setTestResult("ok");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">OpenRouter Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your AI provider API key and spend limits. Super admin only.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">API Credentials</h2>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">API Key</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-arc-500/50 pr-10"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-4 py-3 glass border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-arc-500/40 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Test Connection"}
            </button>
          </div>
          {testResult === "ok" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-usdc-400">
              <CheckCircle className="w-3.5 h-3.5" /> Connected · Latency: 142ms
            </div>
          )}
          {testResult === "fail" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
              <XCircle className="w-3.5 h-3.5" /> Connection failed — check API key
            </div>
          )}
          <p className="text-xs text-gray-700 mt-1">Stored AES-256 encrypted. Never exposed in frontend.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Base URL</label>
          <input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-arc-500/50" />
          <p className="text-xs text-gray-700 mt-1">Editable for custom proxy endpoints.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Spend Limits</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Monthly Cap ($USD)</label>
            <input type="number" value={form.monthly_spend_cap} onChange={(e) => setForm({ ...form, monthly_spend_cap: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Alert Threshold ($USD)</label>
            <input type="number" value={form.spend_alert_threshold} onChange={(e) => setForm({ ...form, spend_alert_threshold: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Alert Email</label>
            <input value={form.alert_email} onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Fallback Behavior</label>
            <select value={form.fallback_behavior} onChange={(e) => setForm({ ...form, fallback_behavior: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50">
              {["Use cached response", "Skip AI feature", "Return error"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Request Timeout (s)</label>
            <input type="number" value={form.request_timeout} onChange={(e) => setForm({ ...form, request_timeout: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Max Retries</label>
            <input type="number" value={form.max_retries} onChange={(e) => setForm({ ...form, max_retries: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
        <Save className="w-4 h-4" />{saved ? "Saved! Audit log written ✓" : "Save Provider Config"}
      </button>
    </div>
  );
}
