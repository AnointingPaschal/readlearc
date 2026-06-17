import Link from "next/link";
import { DollarSign, BookOpen, Users, Zap, TrendingUp, AlertTriangle, FileText, Shield, BarChart3, ArrowUpRight } from "lucide-react";

const METRICS = [
  { label: "Platform Treasury", value: "$1,284.50", sub: "USDC on-chain", icon: DollarSign, color: "text-usdc-400", bg: "bg-usdc-500/10" },
  { label: "Revenue This Week", value: "$284.32", sub: "+18% vs last week", icon: TrendingUp, color: "text-arc-400", bg: "bg-arc-500/10" },
  { label: "Total Articles", value: "12,847", sub: "286 published today", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Total Users", value: "9,340", sub: "readers + writers", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Flagged Content", value: "7", sub: "needs review", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "AI Requests Today", value: "4,182", sub: "$2.14 estimated cost", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

const RECENT_LOGS = [
  { action: "FEE_SPLIT_CHANGED", admin: "super@readlearc.io", time: "2 hours ago", onChain: true },
  { action: "ARTICLE_REMOVED", admin: "mod@readlearc.io", time: "4 hours ago", onChain: true },
  { action: "AI_KEY_CHANGED", admin: "super@readlearc.io", time: "1 day ago", onChain: true },
  { action: "ADMIN_ADDED", admin: "super@readlearc.io", time: "2 days ago", onChain: true },
  { action: "CONTENT_FEATURED", admin: "mod@readlearc.io", time: "2 days ago", onChain: false },
];

const QUICK_LINKS = [
  { label: "Moderate flagged content", href: "/admin/content/moderation", color: "text-red-400", icon: AlertTriangle },
  { label: "Configure AI models", href: "/admin/ai/models", color: "text-arc-400", icon: Zap },
  { label: "View contract registry", href: "/admin/finance/contracts", color: "text-blue-400", icon: FileCode },
  { label: "Security settings", href: "/admin/security", color: "text-purple-400", icon: Shield },
];

function FileCode(props: React.SVGProps<SVGSVGElement>) {
  return <FileText {...props} />;
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview · Readlearc v1.0.0</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="glass rounded-xl p-5 hover:border-arc-500/20 transition-all">
            <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.label}</div>
            <div className="text-xs text-gray-700">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Admin Activity</h2>
            <Link href="/admin/logs" className="text-xs text-arc-400 hover:text-arc-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_LOGS.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-arc-300">{log.action}</span>
                    {log.onChain && (
                      <span className="text-[9px] bg-usdc-500/20 text-usdc-400 border border-usdc-500/30 px-1.5 py-0.5 rounded-full font-semibold">ON-CHAIN</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{log.admin} · {log.time}</span>
                </div>
                <Link href="/admin/logs" className="text-gray-700 hover:text-gray-400 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 p-3 glass rounded-xl hover:border-white/15 transition-all group"
              >
                <l.icon className={`w-4 h-4 ${l.color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{l.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 ml-auto transition-colors" />
              </Link>
            ))}
          </div>

          {/* Arc network status */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-arc-900/40 to-usdc-900/40 border border-arc-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-usdc-400 animate-pulse" />
              <span className="text-xs font-semibold text-white">Arc Testnet · Operational</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Block time: <span className="text-gray-300">0.8s avg</span></div>
              <div>Gas: <span className="text-gray-300">$0.001 USDC</span></div>
              <div>Contracts: <span className="text-gray-300">6 deployed</span></div>
              <div>USDC Supply: <span className="text-gray-300">$48,291</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
