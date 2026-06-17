import Link from "next/link";
import { Bot, Zap, CheckCircle, AlertTriangle, ArrowUpRight, BarChart3, DollarSign } from "lucide-react";

const AI_FEATURES = [
  { key: "article_summarization", label: "Article Summarization", desc: "Auto-generate preview blurbs", enabled: true },
  { key: "content_moderation", label: "Content Moderation", desc: "AI-assisted moderation scoring on publish", enabled: true },
  { key: "reader_recommendations", label: "Reader Recommendations", desc: "Personalized next-article suggestions", enabled: true },
  { key: "writer_analytics_insights", label: "Writer Analytics Insights", desc: "Natural language earnings summaries", enabled: true },
  { key: "auto_pricing_suggestions", label: "Auto Pricing Suggestions", desc: "AI suggests optimal article price", enabled: false },
];

export default function AIOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">AI Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Powered by OpenRouter · Active model: Gemini 2.5 Pro</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Provider", value: "OpenRouter", icon: Bot, color: "text-arc-400" },
          { label: "Active Model", value: "Gemini 2.5 Pro", icon: Zap, color: "text-yellow-400" },
          { label: "Connection", value: "Connected ✓", icon: CheckCircle, color: "text-usdc-400" },
          { label: "Requests Today", value: "4,182", icon: BarChart3, color: "text-blue-400" },
          { label: "Est. Cost Today", value: "$2.14", icon: DollarSign, color: "text-usdc-400" },
          { label: "Monthly Spend", value: "$14.20 / $50", icon: AlertTriangle, color: "text-yellow-400" },
        ].map((c) => (
          <div key={c.label} className="glass rounded-xl p-5">
            <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
            <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Spend bar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex justify-between text-sm mb-3">
          <span className="font-medium">Monthly AI Spend</span>
          <span className="text-gray-400">$14.20 of $50.00</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-arc-500 to-usdc-500 rounded-full" style={{ width: "28.4%" }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1.5">
          <span>28.4% used</span><span>Alert threshold: $40.00 (80%)</span>
        </div>
      </div>

      {/* AI Features */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">AI Features</h2>
          <Link href="/admin/ai/models" className="text-xs text-arc-400 hover:text-arc-300 flex items-center gap-1">
            Manage models <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {AI_FEATURES.map((f) => (
            <div key={f.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <div className="text-sm font-medium text-white">{f.label}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${f.enabled ? "bg-usdc-400" : "bg-gray-600"}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/admin/ai/providers" className="px-5 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl text-sm font-semibold transition-all">Configure Provider</Link>
        <Link href="/admin/ai/models" className="px-5 py-3 glass border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all">Manage Models</Link>
      </div>
    </div>
  );
}
