"use client";
import { useState } from "react";
import { Search, Filter, Eye, Edit, Star, Trash2, EyeOff } from "lucide-react";
import Link from "next/link";

const ARTICLES = [
  { id: "1", title: "The Future of Decentralized Content Monetization", writer: "@vitalik_reads", price: 0.02, reads: 1240, earned: 24.8, status: "LIVE", publishedAt: "Jun 15, 2026", category: "Web3" },
  { id: "2", title: "Building AI Agents with Circle's Developer Stack", writer: "@circledev", price: 0.05, reads: 897, earned: 44.85, status: "LIVE", publishedAt: "Jun 14, 2026", category: "Dev" },
  { id: "3", title: "Why Sub-Second Finality Changes Everything", writer: "@arcbuilder", price: 0.01, reads: 2103, earned: 21.03, status: "LIVE", publishedAt: "Jun 12, 2026", category: "Blockchain" },
  { id: "4", title: "Understanding USDC Stability Mechanisms", writer: "@cryptowriter", price: 0.03, reads: 214, earned: 6.42, status: "DRAFT", publishedAt: "Jun 10, 2026", category: "DeFi" },
  { id: "5", title: "How to Earn $500/month Writing on Web3 Platforms", writer: "@spammer123", price: 0.01, reads: 45, earned: 0.45, status: "FLAGGED", publishedAt: "Jun 9, 2026", category: "Guide" },
  { id: "6", title: "Circle CCTP: Cross-Chain USDC for the Masses", writer: "@bridgebuilder", price: 0.03, reads: 832, earned: 24.96, status: "LIVE", publishedAt: "Jun 8, 2026", category: "DeFi" },
];

const STATUS_COLORS: Record<string, string> = {
  LIVE: "status-live", DRAFT: "status-draft", FLAGGED: "status-flagged", REMOVED: "status-removed", UNPUBLISHED: "status-draft",
};

export default function ArticlesAdminPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = ARTICLES.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.writer.includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">All Articles</h1>
          <p className="text-gray-500 text-sm mt-1">{ARTICLES.length} total articles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles or writers..."
            className="w-full pl-9 pr-4 py-2.5 glass border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-arc-500/50 bg-transparent" />
        </div>
        {["All", "LIVE", "DRAFT", "FLAGGED", "REMOVED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-arc-600 text-white" : "glass border border-white/10 text-gray-400 hover:text-white"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Title", "Writer", "Price", "Reads", "Earned", "Status", "Published", "Actions"].map((h) => (
                  <th key={h} className={`py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider ${h === "Title" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-white max-w-xs line-clamp-1">{a.title}</div>
                    <div className="text-xs text-gray-600">{a.category}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-arc-400">{a.writer}</td>
                  <td className="py-3 px-4 text-right text-xs text-gray-300">${a.price}</td>
                  <td className="py-3 px-4 text-right text-xs text-gray-300">{a.reads.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-xs text-usdc-400 font-semibold">${a.earned.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-gray-600">{a.publishedAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/article/${a.id}`} className="p-1.5 hover:text-white text-gray-600 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></Link>
                      <button className="p-1.5 hover:text-yellow-400 text-gray-600 transition-colors" title="Feature"><Star className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:text-orange-400 text-gray-600 transition-colors" title="Unpublish"><EyeOff className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:text-red-400 text-gray-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
