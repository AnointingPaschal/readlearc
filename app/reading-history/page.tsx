"use client";
import Link from "next/link";
import { Zap, BookOpen, CheckCircle, ExternalLink, Calendar } from "lucide-react";

const HISTORY = [
  { id: "1", title: "The Future of Decentralized Content Monetization", author: "Alex Chen", handle: "vitalik_reads", paidAt: "June 17, 2026", amount: 0.02, txHash: "0x7f3c...d291", readTime: 5 },
  { id: "2", title: "Building AI Agents with Circle's Developer Stack", author: "Maria Santos", handle: "circledev", paidAt: "June 15, 2026", amount: 0.05, txHash: "0xa1b2...f3e4", readTime: 8 },
  { id: "3", title: "Why Sub-Second Finality Changes Everything", author: "James Wu", handle: "arcbuilder", paidAt: "June 14, 2026", amount: 0.01, txHash: "0x9d4e...c1a0", readTime: 3 },
  { id: "4", title: "The Writer's Guide to On-Chain Earnings", author: "Priya Patel", handle: "cryptowriter", paidAt: "June 12, 2026", amount: 0.03, txHash: "0x3f8a...7b92", readTime: 6 },
  { id: "5", title: "USDC vs Traditional Ad Revenue: A 90-Day Study", author: "Emma Thompson", handle: "datawriter", paidAt: "June 10, 2026", amount: 0.02, txHash: "0x2c9f...e4d7", readTime: 4 },
];

export default function ReadingHistoryPage() {
  const totalSpent = HISTORY.reduce((a, b) => a + b.amount, 0);

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
            <Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">Reading History</h1>
            <p className="text-gray-500 text-sm">Your on-chain proof of every article read</p>
          </div>
          <div className="glass rounded-xl p-4 text-right">
            <div className="text-xl font-black text-usdc-400">${totalSpent.toFixed(2)} USDC</div>
            <div className="text-xs text-gray-500">Total spent · {HISTORY.length} articles</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <BookOpen className="w-5 h-5 text-arc-400 mx-auto mb-2" />
            <div className="text-xl font-bold">{HISTORY.length}</div>
            <div className="text-xs text-gray-500">Articles Read</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-usdc-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-usdc-400">{HISTORY.length}</div>
            <div className="text-xs text-gray-500">On-chain Proofs</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold">{HISTORY.reduce((a, b) => a + b.readTime, 0)}m</div>
            <div className="text-xs text-gray-500">Time Reading</div>
          </div>
        </div>

        {/* History list */}
        <div className="space-y-4">
          {HISTORY.map((item) => (
            <div key={item.id} className="glass rounded-xl p-5 hover:border-arc-500/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link href={`/article/${item.id}`} className="font-semibold text-white hover:text-arc-300 transition-colors">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <Link href={`/profile/${item.handle}`} className="text-xs text-gray-500 hover:text-gray-400">@{item.handle}</Link>
                    <span className="text-xs text-gray-700">·</span>
                    <span className="text-xs text-gray-600">{item.paidAt}</span>
                    <span className="text-xs text-gray-700">·</span>
                    <span className="text-xs text-gray-600">{item.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-3 h-3 text-usdc-400" />
                    <a
                      href={`https://explorer.arc.io/testnet/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-arc-500 hover:text-arc-400 flex items-center gap-1 font-mono"
                    >
                      {item.txHash} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-bold text-gray-300">-${item.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">USDC</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 glass-arc rounded-xl p-5 text-center">
          <p className="text-sm text-gray-400">
            All reads are permanently recorded on <span className="text-arc-400">Arc blockchain</span>. Your reading history is verifiable, portable, and owned by you.
          </p>
        </div>
      </div>
    </div>
  );
}
