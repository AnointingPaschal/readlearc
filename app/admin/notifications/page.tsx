"use client";
import { useState } from "react";
import { Save, Mail, MessageSquare, Bell } from "lucide-react";

export default function NotificationsPage() {
  const [emailConfig, setEmailConfig] = useState({
    recipient: "admin@readlearc.io",
    flagged_content: true, ai_spend_alert: true, low_treasury: true,
    new_writer: true, every_article: false, contract_event: true, failed_payment: true
  });
  const [discordUrl, setDiscordUrl] = useState("https://discord.com/api/webhooks/...");
  const [discordEvents, setDiscordEvents] = useState({ moderation_alerts: true, finance_alerts: true });
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Notification Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">Configure where and when admins receive platform alerts.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Mail className="w-4 h-4" /> Email Alerts</h2>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Recipient Email</label>
          <input value={emailConfig.recipient} onChange={(e) => setEmailConfig({ ...emailConfig, recipient: e.target.value })}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
        </div>
        <div className="space-y-2 pt-2 border-t border-white/5">
          {[
            { key: "flagged_content", label: "New flagged content" },
            { key: "ai_spend_alert", label: "AI API spend > 80% of cap" },
            { key: "low_treasury", label: "Treasury balance < $10 USDC" },
            { key: "new_writer", label: "New writer signup" },
            { key: "contract_event", label: "Contract deployment events" },
            { key: "failed_payment", label: "Failed payment on Arc" },
            { key: "every_article", label: "Every article published" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
              <input type="checkbox" checked={(emailConfig as any)[item.key]} onChange={(e) => setEmailConfig({ ...emailConfig, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded bg-[#1a1f2e] border-white/20 text-arc-500 focus:ring-arc-500/50" />
              <span className="text-sm text-gray-300">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Discord Webhook</h2>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Webhook URL</label>
          <input value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)}
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-arc-500/50" />
        </div>
        <div className="flex gap-4 pt-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={discordEvents.moderation_alerts} onChange={(e) => setDiscordEvents({ ...discordEvents, moderation_alerts: e.target.checked })}
              className="w-4 h-4 rounded bg-[#1a1f2e] border-white/20 text-arc-500" />
            <span className="text-sm text-gray-300">Moderation Alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={discordEvents.finance_alerts} onChange={(e) => setDiscordEvents({ ...discordEvents, finance_alerts: e.target.checked })}
              className="w-4 h-4 rounded bg-[#1a1f2e] border-white/20 text-arc-500" />
            <span className="text-sm text-gray-300">Finance Alerts</span>
          </label>
        </div>
        <button className="text-xs font-semibold text-arc-400 hover:text-arc-300">Send Test Message</button>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
        <Save className="w-4 h-4" />{saved ? "Saved! ✓" : "Save Configurations"}
      </button>
    </div>
  );
}
