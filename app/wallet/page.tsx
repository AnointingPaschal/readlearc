"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, Wallet, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, Copy, ExternalLink, Shield } from "lucide-react";

const MOCK_WALLET = {
  address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  balance: 4.82,
  network: "Arc Testnet",
};

const MOCK_TXS = [
  { type: "read", title: "The Future of Decentralized Content Monetization", amount: -0.02, time: "2 hours ago", hash: "0x7f3c...d291" },
  { type: "topup", title: "Top-up from Coinbase", amount: +5.00, time: "1 day ago", hash: "0xa1b2...f3e4" },
  { type: "read", title: "Building AI Agents with Circle's Developer Stack", amount: -0.05, time: "2 days ago", hash: "0x9d4e...c1a0" },
  { type: "read", title: "Why Sub-Second Finality Changes Everything", amount: -0.01, time: "3 days ago", hash: "0x3f8a...7b92" },
  { type: "topup", title: "Top-up from bank", amount: +2.00, time: "5 days ago", hash: "0x2c9f...e4d7" },
];

const TOP_UP_AMOUNTS = [1, 5, 10, 25];

export default function WalletPage() {
  const [copied, setCopied] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [topupDone, setTopupDone] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(MOCK_WALLET.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTopUp() {
    if (!topupAmount) return;
    setToppingUp(true);
    await new Promise((r) => setTimeout(r, 2000));
    setToppingUp(false);
    setTopupDone(true);
    setTimeout(() => setTopupDone(false), 3000);
  }

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
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/reading-history" className="hover:text-white transition-colors">History</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-heading text-3xl font-bold mb-8">My Wallet</h1>

        {/* Balance card */}
        <div className="rounded-2xl p-8 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #0a1a0e 100%)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-arc-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-usdc-400" />
              <span className="text-xs text-gray-400">Circle Agent Wallet · {MOCK_WALLET.network}</span>
            </div>
            <div className="text-5xl font-black text-white mb-1">
              ${MOCK_WALLET.balance.toFixed(2)} <span className="text-2xl text-usdc-400">USDC</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="font-mono text-xs text-gray-500">{MOCK_WALLET.address.slice(0, 20)}...{MOCK_WALLET.address.slice(-6)}</span>
              <button onClick={copyAddress} className="text-gray-500 hover:text-white transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-xs text-usdc-400">Copied!</span>}
            </div>
          </div>
        </div>

        {/* Top up */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-usdc-400" />
            <h2 className="font-semibold">Top Up USDC</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {TOP_UP_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setTopupAmount(amt)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  topupAmount === amt ? "bg-arc-600 text-white shadow-arc" : "glass border border-white/10 text-gray-400 hover:border-arc-500/30"
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
          <button
            onClick={handleTopUp}
            disabled={!topupAmount || toppingUp}
            className="w-full py-3 bg-arc-600 hover:bg-arc-500 disabled:bg-arc-800 disabled:text-gray-600 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {toppingUp ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Processing via Circle...</>
            ) : topupDone ? (
              "✓ Top-up Successful!"
            ) : (
              <><ArrowDownLeft className="w-4 h-4" /> Top Up {topupAmount ? `$${topupAmount} USDC` : "USDC"}</>
            )}
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">Powered by Circle Gateway · Instant settlement on Arc</p>
        </div>

        {/* Transaction history */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {MOCK_TXS.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-usdc-500/20" : "bg-arc-500/20"}`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4 text-usdc-400" /> : <ArrowUpRight className="w-4 h-4 text-arc-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium line-clamp-1">{tx.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{tx.time}</span>
                      <a href={`https://explorer.arc.io/testnet/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-xs text-arc-500 hover:text-arc-400 transition-colors">
                        {tx.hash} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
                <span className={`font-mono text-sm font-bold ${tx.amount > 0 ? "text-usdc-400" : "text-gray-300"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)} USDC
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
