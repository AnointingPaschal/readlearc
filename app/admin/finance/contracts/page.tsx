"use client";
import { Copy, ExternalLink, ShieldCheck, AlertCircle, FileCode } from "lucide-react";

const CONTRACTS = [
  { name: "ArticleRegistry", address: "0x8a1B...2C9f", status: "ACTIVE", version: "v1.2", date: "May 10, 2026", desc: "Stores article metadata and price" },
  { name: "PaymentGate", address: "0x3d4E...5F6a", status: "ACTIVE", version: "v1.1", date: "May 10, 2026", desc: "Handles USDC payment and access" },
  { name: "PaymentSplitter", address: "0x7b8C...9D0e", status: "ACTIVE", version: "v2.0", date: "Jun 1, 2026", desc: "Atomic 85/10/5 fee splitting" },
  { name: "PaymentSplitter (Old)", address: "0x1a2B...3C4d", status: "DEPRECATED", version: "v1.0", date: "May 10, 2026", desc: "Legacy 80/15/5 fee splitting" },
  { name: "ArticleVault", address: "0xE1f2...A3b4", status: "ACTIVE", version: "v1.0", date: "May 10, 2026", desc: "Holds AES encryption keys" },
  { name: "AdminRegistry", address: "0xC5d6...E7f8", status: "ACTIVE", version: "v1.0", date: "May 10, 2026", desc: "Authorized admin wallets" },
  { name: "AdminActivityLog", address: "0x9a0B...1C2d", status: "ACTIVE", version: "v1.0", date: "May 10, 2026", desc: "Immutable audit trail" },
];

export default function ContractsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Smart Contract Registry</h1>
          <p className="text-gray-500 text-sm mt-1">Manage core platform contracts deployed on Arc Testnet.</p>
        </div>
        <div className="flex items-center gap-2 bg-arc-500/10 border border-arc-500/30 px-3 py-1.5 rounded-lg text-sm text-arc-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-arc-400 animate-pulse" />
          Arc Testnet
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Contract</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Address</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Deployed</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACTS.map((c) => (
              <tr key={c.address} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-gray-500" />
                    {c.name} <span className="text-xs text-gray-500 font-mono">{c.version}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{c.desc}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-300">{c.address}</span>
                    <button className="text-gray-600 hover:text-white transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {c.status === "ACTIVE" ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-usdc-400 bg-usdc-500/10 px-2.5 py-1 rounded-full w-max">
                      <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full w-max">
                      <AlertCircle className="w-3.5 h-3.5" /> DEPRECATED
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right text-xs text-gray-400">{c.date}</td>
                <td className="py-4 px-4 text-right">
                  <a href={`https://explorer.arc.io/testnet/address/${c.address}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 glass border border-white/10 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 transition-all">
                    Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
