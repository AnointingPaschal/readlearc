"use client";
import Link from "next/link";
import { Zap, BookOpen, DollarSign, Users, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";

const WRITER = {
  handle: "vitalik_reads",
  name: "Alex Chen",
  bio: "Blockchain researcher & writer. Building the future of decentralized media. Former Circle engineer. Based in Singapore.",
  verified: true,
  joined: "January 2026",
  totalEarned: 284.5,
  totalReaders: 3240,
  articles: [
    { id: "1", title: "The Future of Decentralized Content Monetization", price: 0.02, reads: 1240, earned: 24.8, publishedAt: "June 15, 2026" },
    { id: "2", title: "Circle CCTP: Cross-Chain USDC for the Masses", price: 0.03, reads: 832, earned: 24.96, publishedAt: "June 8, 2026" },
    { id: "3", title: "Building With Arc: A Developer's First Look", price: 0.04, reads: 567, earned: 22.68, publishedAt: "May 28, 2026" },
  ],
};

export default function ProfilePage({ params }: { params: { handle: string } }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Explore
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold">Readlearc</span>
          </Link>
          <Link href="/wallet" className="px-4 py-2 text-sm font-semibold bg-arc-600 hover:bg-arc-500 rounded-lg transition-all">
            Wallet
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        {/* Profile header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-arc-500 to-usdc-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading text-3xl font-bold">{WRITER.name}</h1>
                {WRITER.verified && <CheckCircle className="w-6 h-6 text-usdc-400" />}
              </div>
              <p className="text-gray-400 text-sm mb-1">@{WRITER.handle} · Joined {WRITER.joined}</p>
              <p className="text-gray-300 text-sm leading-relaxed max-w-lg">{WRITER.bio}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-white">{WRITER.articles.length}</div>
                <div className="text-xs text-gray-500">Articles</div>
              </div>
              <div>
                <div className="text-2xl font-black text-usdc-400">${WRITER.totalEarned}</div>
                <div className="text-xs text-gray-500">Earned</div>
              </div>
              <div>
                <div className="text-2xl font-black text-arc-400">{WRITER.totalReaders.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Readers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `$${WRITER.totalEarned} USDC`, icon: DollarSign, color: "text-usdc-400" },
            { label: "Total Reads", value: WRITER.articles.reduce((a, b) => a + b.reads, 0).toLocaleString(), icon: BookOpen, color: "text-arc-400" },
            { label: "Unique Readers", value: WRITER.totalReaders.toLocaleString(), icon: Users, color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Articles */}
        <h2 className="font-heading text-xl font-bold mb-4">Published Articles</h2>
        <div className="space-y-4">
          {WRITER.articles.map((a) => (
            <Link
              key={a.id}
              href={`/article/${a.id}`}
              className="glass rounded-xl p-5 flex items-center justify-between hover:border-arc-500/30 transition-all group"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-arc-300 transition-colors mb-1">{a.title}</h3>
                <p className="text-xs text-gray-500">{a.publishedAt} · {a.reads.toLocaleString()} reads · ${a.earned} earned</p>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className="price-badge">${a.price} USDC</span>
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-arc-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
