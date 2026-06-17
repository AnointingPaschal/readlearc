"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Zap, Shield, TrendingUp, Users, DollarSign, ChevronRight, Clock, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAllArticles } from "../lib/web3";

const STATS = [
  { label: "Articles Published", value: "12,847", icon: BookOpen },
  { label: "USDC Paid to Writers", value: "$48,291", icon: DollarSign },
  { label: "Active Readers", value: "9,340", icon: Users },
  { label: "Avg. Settlement Time", value: "0.8s", icon: Zap },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Writer Publishes",
    desc: "Write your article, set a USDC price ($0.01–$1.00), and publish entirely on-chain on the Arc network.",
    icon: BookOpen,
    color: "from-purple-600 to-purple-800",
  },
  {
    step: "02",
    title: "Reader Discovers",
    desc: "Browse the feed, see the preview blurb and price. Click 'Pay to Read' — your wallet handles the nanopayment instantly.",
    icon: Coins,
    color: "from-emerald-600 to-emerald-800",
  },
  {
    step: "03",
    title: "Instant Settlement",
    desc: "USDC is split atomically on-chain: 85% to writer, 10% to platform, 5% to referrer. No escrow. No delay.",
    icon: Zap,
    color: "from-blue-600 to-blue-800",
  },
  {
    step: "04",
    title: "Content Unlocks",
    desc: "Payment verified on-chain, decryption key released, full article renders in your browser. Proof-of-read recorded forever.",
    icon: Shield,
    color: "from-rose-600 to-rose-800",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllArticles();
        setArticles(data.slice(0, 6)); // Show top 6
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] selection:bg-arc-500/30">
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center shadow-lg shadow-arc-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight">Readlearc</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/write" className="hover:text-white transition-colors">Write</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex arc-badge text-arc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-usdc-400 animate-pulse" />
              Arc Testnet
            </div>
            <Link
              href="/wallet"
              className="px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-gray-200 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Connect
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 overflow-hidden grid-overlay">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-arc-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 arc-badge mb-8 px-4 py-2 bg-arc-500/10 border-arc-500/30 text-arc-300 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5" /> Built on Arc · Circle USDC · 100% On-Chain
            </motion.div>

            <motion.h1 variants={fadeIn} className="font-heading text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
              Pay per word.<br />
              <span className="gradient-text">Own every read.</span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              The first pay-per-read platform where writers earn instantly in USDC and readers own cryptographic proof of every article.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5 justify-center mb-24 w-full sm:w-auto">
              <Link
                href="/explore"
                className="px-8 py-4 bg-arc-600 hover:bg-arc-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Start Reading <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/write"
                className="px-8 py-4 glass border border-white/20 rounded-full font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-white"
              >
                Start Writing <TrendingUp className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Stats bar */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="glass rounded-2xl p-6 text-center hover:bg-white/5 transition-colors border-white/5">
                  <stat.icon className="w-6 h-6 text-arc-400 mx-auto mb-3" />
                  <div className="text-3xl font-heading font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-[#111827]/50 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
          >
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight mb-3">Trending Now</h2>
              <p className="text-gray-400 text-lg">Pay in USDC. Read instantly. Verified on-chain.</p>
            </div>
            <Link href="/explore" className="text-arc-400 hover:text-arc-300 flex items-center gap-1 font-bold text-sm bg-arc-500/10 px-5 py-2.5 rounded-full transition-colors">
              View all articles <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="glass rounded-3xl p-6 h-64 skeleton border-white/5"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/10">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No articles deployed yet</h3>
              <p className="text-gray-500 mt-2">Deploy the contract and publish the first article!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={article.id}
                >
                  <Link
                    href={`/article/${article.id}`}
                    className="block h-full glass rounded-3xl p-8 hover:bg-white/5 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-arc-500/10 group border-white/5"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-xs font-bold text-arc-400 bg-arc-500/10 px-3 py-1.5 rounded-full border border-arc-500/20 uppercase tracking-wider">
                        {article.category}
                      </span>
                      <span className="price-badge">${article.price} USDC</span>
                    </div>

                    <h3 className="font-heading text-2xl font-bold text-white mb-4 group-hover:text-arc-400 transition-colors leading-tight">
                      {article.title}
                    </h3>

                    <p className="text-gray-400 leading-relaxed mb-8 line-clamp-3 font-light">{article.blurb}</p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500 shadow-inner" />
                        <span className="text-sm font-semibold text-gray-300">@{article.author.handle}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> {article.readTime}m
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> {article.reads}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-black mb-6 tracking-tight">How Readlearc Works</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Built on Arc — Circle&apos;s USDC-native L1. Payments settle in under a second. Content is owned forever.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={item.step} 
                className="glass rounded-3xl p-8 hover:bg-white/5 transition-all border-white/5 relative overflow-hidden group"
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${item.color} rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-xl relative z-10`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-arc-400 font-mono text-sm font-bold mb-3 tracking-widest relative z-10">STEP {item.step}</div>
                <h3 className="font-heading text-xl font-bold mb-3 text-white relative z-10">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment split visualization */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/50 to-[#0a0a0f] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-arc rounded-[3rem] p-12 md:p-20 text-center shadow-2xl border-arc-500/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-arc-500/5 to-transparent pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 arc-badge mb-8 px-5 py-2 bg-black/40">
              <Zap className="w-4 h-4" /> Atomic On-Chain Splitting
            </div>
            
            <h2 className="font-heading text-5xl md:text-6xl font-black mb-6 tracking-tight text-white">Writers keep 85%</h2>
            <p className="text-gray-400 text-xl mb-16 max-w-2xl mx-auto font-light leading-relaxed">
              Every read triggers a smart contract. No escrow, no middlemen, no minimums. Instant settlement.
            </p>

            <div className="flex items-center justify-center gap-6 md:gap-12 mb-12 flex-wrap">
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-black text-usdc-400 mb-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">85<span className="text-4xl">%</span></div>
                <div className="text-lg font-bold text-gray-300 uppercase tracking-widest">Writer</div>
              </div>
              <div className="text-gray-700 text-5xl font-thin">+</div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-arc-400 mb-2 drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">10<span className="text-3xl">%</span></div>
                <div className="text-lg font-bold text-gray-300 uppercase tracking-widest">Platform</div>
              </div>
              <div className="text-gray-700 text-5xl font-thin">+</div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black text-blue-400 mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">5<span className="text-3xl">%</span></div>
                <div className="text-lg font-bold text-gray-300 uppercase tracking-widest">Referrer</div>
              </div>
            </div>

            <div className="h-4 rounded-full overflow-hidden flex bg-black/50 shadow-inner">
              <div className="bg-usdc-500" style={{ width: "85%" }} />
              <div className="bg-arc-500" style={{ width: "10%" }} />
              <div className="bg-blue-500" style={{ width: "5%" }} />
            </div>

            <p className="mt-8 text-sm text-gray-500 font-mono">
              Executed via Readlearc.sol on Arc Testnet
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-5xl md:text-7xl font-black mb-8 tracking-tight"
          >
            Start earning in <span className="gradient-text">USDC</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Join the decentralized publishing revolution. No ads, no paywall bypasses, just fair nanopayments settled in milliseconds.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-5 justify-center"
          >
            <Link
              href="/write"
              className="px-10 py-5 bg-white text-black rounded-full font-black text-lg transition-all hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-xl"
            >
              Publish Article
            </Link>
            <Link
              href="/explore"
              className="px-10 py-5 glass border border-white/20 rounded-full font-bold text-lg hover:bg-white/10 text-white transition-all active:scale-95"
            >
              Explore Network
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#050508]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">Readlearc</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500">
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <Link href="/write" className="hover:text-white transition-colors">Write</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
              <a href="https://explorer.arc.io/testnet" target="_blank" rel="noopener noreferrer" className="hover:text-usdc-400 transition-colors flex items-center gap-1">
                Arc Explorer <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <div>© 2026 Readlearc Protocol. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-usdc-400" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
