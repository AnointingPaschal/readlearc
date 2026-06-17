"use client";
import Link from "next/link";
import { Zap, TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight, BarChart3, Wallet, Bell } from "lucide-react";

const EARNINGS_DATA = [
  { day: "Mon", amount: 2.14 },
  { day: "Tue", amount: 3.82 },
  { day: "Wed", amount: 1.96 },
  { day: "Thu", amount: 5.44 },
  { day: "Fri", amount: 4.20 },
  { day: "Sat", amount: 6.88 },
  { day: "Sun", amount: 3.52 },
];

const ARTICLES = [
  { id: "1", title: "The Future of Decentralized Content Monetization", reads: 1240, earned: 24.8, price: 0.02, trend: "+12%", status: "LIVE" },
  { id: "2", title: "Circle CCTP: Cross-Chain USDC for the Masses", reads: 832, earned: 24.96, price: 0.03, trend: "+8%", status: "LIVE" },
  { id: "3", title: "Building With Arc: A Developer's First Look", reads: 567, earned: 22.68, price: 0.04, trend: "+3%", status: "LIVE" },
  { id: "4", title: "Understanding USDC Stability Mechanisms", reads: 214, earned: 4.28, price: 0.02, trend: "-1%", status: "DRAFT" },
];

const maxBar = Math.max(...EARNINGS_DATA.map((d) => d.amount));

export default function DashboardPage() {
  const totalEarned = ARTICLES.reduce((a, b) => a + b.earned, 0);
  const totalReads = ARTICLES.reduce((a, b) => a + b.reads, 0);
  const weekEarnings = EARNINGS_DATA.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold">Readlearc</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <span className="text-white font-medium">Dashboard</span>
            <Link href="/write" className="hover:text-white transition-colors">Write</Link>
            <Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 glass rounded-lg relative">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-arc-500 rounded-full text-[8px] flex items-center justify-center">3</span>
            </button>
            <Link href="/write" className="px-4 py-2 text-sm font-semibold bg-arc-600 hover:bg-arc-500 rounded-lg transition-all">
              + New Article
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Writer Dashboard</h1>
          <p className="text-gray-500 mt-1">Your earnings and analytics · Arc Testnet</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, sub: "USDC all-time", icon: DollarSign, color: "text-usdc-400", bg: "bg-usdc-500/10" },
            { label: "This Week", value: `$${weekEarnings.toFixed(2)}`, sub: "+23% vs last week", icon: TrendingUp, color: "text-arc-400", bg: "bg-arc-500/10" },
            { label: "Total Reads", value: totalReads.toLocaleString(), sub: "across all articles", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Unique Readers", value: "1,847", sub: "wallet addresses", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass rounded-xl p-5 hover:border-arc-500/20 transition-all">
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
              <div className="text-xs text-gray-700 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Earnings chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold">Weekly Earnings</h2>
                <p className="text-xs text-gray-500">USDC earned per day</p>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-arc-400" />
                <span className="text-sm font-bold text-usdc-400">${weekEarnings.toFixed(2)} this week</span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-32">
              {EARNINGS_DATA.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-arc-600 to-arc-400 opacity-80 hover:opacity-100 transition-opacity cursor-default"
                    style={{ height: `${(d.amount / maxBar) * 100}%` }}
                    title={`$${d.amount}`}
                  />
                  <span className="text-xs text-gray-600">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdraw */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-usdc-400" />
              <h2 className="font-semibold">Withdraw Earnings</h2>
            </div>
            <div className="flex-1">
              <div className="text-4xl font-black text-usdc-400 mb-1">${totalEarned.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mb-6">Available USDC</div>
              <div className="glass-arc rounded-xl p-4 mb-4 text-sm text-gray-400">
                <div className="flex justify-between mb-2">
                  <span>Writer earnings (85%)</span>
                  <span className="text-usdc-400">${totalEarned.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Gas fee est.</span>
                  <span>~$0.001 USDC</span>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-usdc-600 hover:bg-usdc-500 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Withdraw to Wallet
            </button>
            <p className="text-xs text-gray-700 text-center mt-2">Instant on Arc · sign with wallet</p>
          </div>
        </div>

        {/* Articles table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold">Your Articles</h2>
            <Link href="/write" className="text-sm text-arc-400 hover:text-arc-300 transition-colors">+ Publish new</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Article</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Reads</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Earned</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Price</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Trend</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-600 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {ARTICLES.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/article/${a.id}`} className="text-sm font-medium text-white hover:text-arc-300 transition-colors line-clamp-1 max-w-xs">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-400">{a.reads.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-usdc-400">${a.earned.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-400">${a.price}</td>
                    <td className={`px-4 py-4 text-right text-sm font-semibold ${a.trend.startsWith("+") ? "text-usdc-400" : "text-red-400"}`}>{a.trend}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${a.status === "LIVE" ? "status-live" : "status-draft"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
