"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Clock, Users, Star, Zap, BookOpen } from "lucide-react";

const CATEGORIES = ["All", "Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi"];

const ARTICLES = [
  { id: "1", title: "The Future of Decentralized Content Monetization", blurb: "How Arc blockchain and USDC nanopayments are rewriting the economics of online publishing — giving writers 85¢ of every dollar.", price: 0.02, readTime: 5, author: { handle: "vitalik_reads", name: "Alex Chen" }, category: "Web3", reads: 1240, featured: true },
  { id: "2", title: "Building AI Agents with Circle's Developer Stack", blurb: "A deep dive into Circle Agent Wallets and how autonomous payment agents are transforming DeFi user experience at scale.", price: 0.05, readTime: 8, author: { handle: "circledev", name: "Maria Santos" }, category: "Development", reads: 897, featured: false },
  { id: "3", title: "Why Sub-Second Finality Changes Everything", blurb: "When transactions confirm in under a second, the entire mental model for micropayments collapses into something elegant and inevitable.", price: 0.01, readTime: 3, author: { handle: "arcbuilder", name: "James Wu" }, category: "Blockchain", reads: 2103, featured: true },
  { id: "4", title: "The Writer's Guide to On-Chain Earnings", blurb: "From your first article to your first $100 USDC withdrawal — everything you need to know about earning on Readlearc.", price: 0.03, readTime: 6, author: { handle: "cryptowriter", name: "Priya Patel" }, category: "Guide", reads: 543, featured: false },
  { id: "5", title: "Quadratic Pricing: The Math Behind Viral Articles", blurb: "Our pricing algorithm rewards widely-read articles with lower per-read costs, maximizing both writer income and reader reach.", price: 0.04, readTime: 7, author: { handle: "mathcrypto", name: "David Kim" }, category: "Economics", reads: 678, featured: false },
  { id: "6", title: "USDC vs Traditional Ad Revenue: A 90-Day Study", blurb: "We analyzed 200 creators who switched from ad-based platforms to Readlearc. The results will surprise you.", price: 0.02, readTime: 4, author: { handle: "datawriter", name: "Emma Thompson" }, category: "Research", reads: 1456, featured: false },
  { id: "7", title: "Circle CCTP: Cross-Chain USDC for the Masses", blurb: "Understanding how Circle's Cross-Chain Transfer Protocol makes USDC truly universal across all EVM networks.", price: 0.03, readTime: 5, author: { handle: "bridgebuilder", name: "Liam O'Brien" }, category: "DeFi", reads: 832, featured: false },
  { id: "8", title: "Proof-of-Readership NFTs: A New Creator Economy", blurb: "What happens when every article you finish mints you a free on-chain badge? We explore the implications.", price: 0.02, readTime: 4, author: { handle: "nftwriter", name: "Sofia Garcia" }, category: "Web3", reads: 1120, featured: false },
  { id: "9", title: "OpenRouter and the AI Content Layer", blurb: "How Readlearc uses OpenRouter to power article summarization, content moderation, and personalized recommendations.", price: 0.04, readTime: 6, author: { handle: "aibuilder", name: "Chen Wei" }, category: "AI", reads: 445, featured: false },
];

const SORT_OPTIONS = ["Newest", "Most Read", "Lowest Price", "Highest Earning"];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const filtered = ARTICLES.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.blurb.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">Readlearc</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="/explore" className="text-white font-medium">Explore</Link>
            <Link href="/write" className="hover:text-white transition-colors">Write</Link>
          </div>
          <Link href="/wallet" className="px-4 py-2 text-sm font-semibold bg-arc-600 hover:bg-arc-500 rounded-lg transition-all">
            Connect Wallet
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold mb-2">Explore Articles</h1>
          <p className="text-gray-500">Discover stories worth paying for. Pay in USDC, read instantly.</p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search articles, topics, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 glass rounded-xl border border-white/10 bg-transparent text-white placeholder:text-gray-600 focus:outline-none focus:border-arc-500/50 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass rounded-xl border border-white/10 bg-[#1a1f2e] text-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-arc-500/50"
            >
              {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-arc-600 text-white shadow-arc"
                  : "glass border border-white/10 text-gray-400 hover:border-arc-500/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600 mb-6">{filtered.length} articles found</p>

        {/* Articles grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="glass rounded-2xl p-5 hover:border-arc-500/30 transition-all hover:-translate-y-1 hover:shadow-card group"
            >
              {article.featured && (
                <div className="flex items-center gap-1 text-xs text-yellow-400 mb-3 font-medium">
                  <Star className="w-3 h-3 fill-yellow-400" /> Featured
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-arc-400 bg-arc-500/10 px-3 py-1 rounded-full border border-arc-500/20">
                  {article.category}
                </span>
                <span className="price-badge">${article.price} USDC</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-white mb-2 group-hover:text-arc-300 transition-colors leading-snug">
                {article.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{article.blurb}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500" />
                  <span className="text-sm text-gray-400">@{article.author.handle}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}m</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {article.reads.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No articles match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
