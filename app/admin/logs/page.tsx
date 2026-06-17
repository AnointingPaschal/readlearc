"use client";
import { Search, Download, Filter, FileCode } from "lucide-react";

const LOGS = [
  { id: "1", time: "Jun 17, 14:32:01", admin: "super@readlearc.io", action: "FEE_SPLIT_CHANGED", desc: "Updated verified writer split to 90/7/3", ip: "192.168.1.1", onChain: true, tx: "0x7f3c...d291" },
  { id: "2", time: "Jun 17, 13:15:22", admin: "mod@readlearc.io", action: "ARTICLE_REMOVED", desc: "Unpublished article ID 5 due to ToS violation", ip: "10.0.0.4", onChain: true, tx: "0xa1b2...f3e4" },
  { id: "3", time: "Jun 17, 10:05:11", admin: "finance@readlearc.io", action: "FUNDS_WITHDRAWN", desc: "Withdrew 4500 USDC from platform treasury", ip: "172.16.0.2", onChain: true, tx: "0x9d4e...c1a0" },
  { id: "4", time: "Jun 16, 16:44:33", admin: "super@readlearc.io", action: "AI_KEY_CHANGED", desc: "Rotated OpenRouter API key", ip: "192.168.1.1", onChain: true, tx: "0x3f8a...7b92" },
  { id: "5", time: "Jun 16, 09:21:05", admin: "mod@readlearc.io", action: "CONTENT_FEATURED", desc: "Added article ID 1 to homepage hero slot", ip: "10.0.0.4", onChain: false },
  { id: "6", time: "Jun 15, 11:30:00", admin: "super@readlearc.io", action: "ADMIN_ADDED", desc: "Added mod2@readlearc.io with content_mod role", ip: "192.168.1.1", onChain: true, tx: "0x2c9f...e4d7" },
];

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Activity Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Audit trail of all admin actions. Critical actions are stored immutably on Arc.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="Search logs..." className="w-full pl-9 pr-4 py-2.5 glass border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-arc-500/50 bg-transparent" />
        </div>
        <button className="px-4 py-2.5 glass border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp / Admin</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">IP / On-Chain</th>
            </tr>
          </thead>
          <tbody>
            {LOGS.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-white">{log.time}</div>
                  <div className="text-xs text-gray-500">{log.admin}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-arc-300 bg-arc-500/10 px-2 py-1 rounded">{log.action}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400">{log.desc}</td>
                <td className="py-3 px-4 text-right">
                  <div className="text-xs text-gray-500 font-mono mb-1">{log.ip}</div>
                  {log.onChain && (
                    <a href={`https://explorer.arc.io/testnet/tx/${log.tx}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] bg-usdc-500/10 text-usdc-400 border border-usdc-500/20 px-1.5 py-0.5 rounded-full font-mono hover:bg-usdc-500/20 transition-colors">
                      <FileCode className="w-3 h-3" /> {log.tx}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
