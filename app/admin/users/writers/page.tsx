"use client";
import { useState } from "react";
import { Search, Shield, UserCheck, AlertTriangle, ExternalLink, PenTool } from "lucide-react";

const WRITERS = [
  { id: "1", handle: "vitalik_reads", articles: 14, earned: 284.50, status: "ACTIVE", verified: true, joined: "Jan 2026", split: "90% (Verified)" },
  { id: "2", handle: "circledev", articles: 8, earned: 142.10, status: "ACTIVE", verified: true, joined: "Feb 2026", split: "90% (Verified)" },
  { id: "3", handle: "cryptowriter", articles: 22, earned: 84.30, status: "ACTIVE", verified: false, joined: "Mar 2026", split: "85% (Default)" },
  { id: "4", handle: "spammer123", articles: 4, earned: 1.20, status: "SUSPENDED", verified: false, joined: "Jun 2026", split: "85% (Default)" },
];

export default function WritersAdminPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Writers</h1>
          <p className="text-gray-500 text-sm mt-1">{WRITERS.length} total writers</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by handle..."
            className="w-full pl-9 pr-4 py-2.5 glass border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-arc-500/50 bg-transparent" />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Handle", "Articles", "Earned", "Fee Split", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className={`py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider ${h === "Handle" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WRITERS.map((w) => (
                <tr key={w.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      @{w.handle}
                      {w.verified && <span title="Verified Writer" className="flex items-center"><UserCheck className="w-4 h-4 text-usdc-400" /></span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-gray-300">{w.articles}</td>
                  <td className="py-3 px-4 text-right text-xs text-usdc-400 font-semibold">${w.earned.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-xs text-gray-400">{w.split}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.status === "ACTIVE" ? "bg-usdc-500/15 text-usdc-400" : "bg-red-500/15 text-red-400"}`}>{w.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-gray-600">{w.joined}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:text-white text-gray-600 transition-colors" title="View Profile"><ExternalLink className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:text-usdc-400 text-gray-600 transition-colors" title="Toggle Verified Badge"><Shield className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:text-red-400 text-gray-600 transition-colors" title="Suspend"><AlertTriangle className="w-3.5 h-3.5" /></button>
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
