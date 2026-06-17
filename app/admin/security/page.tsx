"use client";
import { useState } from "react";
import { Key, Save, Shield, ShieldAlert, RefreshCw } from "lucide-react";

export default function SecurityPage() {
  const [settings, setSettings] = useState({
    session_timeout: "4 hours", require_2fa: true, ip_allowlist: false,
    max_login_attempts: 5, login_alert_email: true
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Security Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage admin access controls and API keys.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4" /> Access Controls</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Session Timeout</label>
            <select value={settings.session_timeout} onChange={(e) => setSettings({ ...settings, session_timeout: e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50">
              {["1 hour", "4 hours", "8 hours", "24 hours"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Max Login Attempts</label>
            <input type="number" value={settings.max_login_attempts} onChange={(e) => setSettings({ ...settings, max_login_attempts: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
        </div>

        <div className="space-y-2">
          {[
            { key: "require_2fa", label: "Require 2FA for all admins", desc: "Mandatory TOTP authenticator setup on first login." },
            { key: "ip_allowlist", label: "Enable IP Allowlist", desc: "Restrict admin access to specific IP addresses." },
            { key: "login_alert_email", label: "Login Alerts", desc: "Send email to super_admin on new device logins." }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 glass rounded-xl border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
              <button onClick={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                className={`w-11 h-6 rounded-full relative transition-colors ${(settings as any)[item.key] ? "bg-arc-500" : "bg-gray-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(settings as any)[item.key] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Key className="w-4 h-4" /> API Keys</h2>
        <div className="space-y-3">
          {[
            { name: "Webhook Secret", prefix: "sk_wh_********************", date: "Created Mar 1" },
            { name: "Internal API Key", prefix: "sk_int_********************", date: "Created Mar 1" },
          ].map((k) => (
            <div key={k.name} className="flex items-center justify-between p-4 bg-[#111827] border border-white/5 rounded-xl">
              <div>
                <div className="text-sm font-medium text-white mb-1">{k.name}</div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">{k.prefix}</span>
                  <span className="text-xs text-gray-600">{k.date}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 glass border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors">
                <RefreshCw className="w-3 h-3" /> Rotate Key
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">On-Chain Admin Registry</h3>
          <p className="text-xs text-gray-400 mt-1">Wallet-based admin logins check the AdminRegistry.sol contract on Arc. To revoke wallet access, you must remove the address from the smart contract.</p>
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
        <Save className="w-4 h-4" />{saved ? "Saved! ✓" : "Save Security Settings"}
      </button>
    </div>
  );
}
