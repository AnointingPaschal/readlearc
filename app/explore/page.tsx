"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Clock, Users, Zap, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAllArticles } from "../../lib/web3";

const CATEGORIES = ["All", "Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi"];
const SORT_OPTIONS = ["Newest", "Most Read", "Lowest Price"];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllArticles();
        setArticles(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.blurb.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === "Newest") return Number(b.timestamp) - Number(a.timestamp);
    if (sortBy === "Most Read") return Number(b.reads) - Number(a.reads);
    if (sortBy === "Lowest Price") return Number(a.price) - Number(b.price);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] selection:bg-arc-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center shadow-lg shadow-arc-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight">Readlearc</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="/explore" className="text-white">Explore</Link>
            <Link href="/write" className="hover:text-white transition-colors">Write</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <Link href="/wallet" className="px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-gray-200 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95">
            Connect
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-5xl font-black mb-4 tracking-tight">Explore Articles</h1>
          <p className="text-gray-400 text-lg">Discover stories stored permanently on-chain. Pay in USDC, read instantly.</p>
        </motion.div>

        {/* Search + Filter bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search articles, topics, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 glass rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:outline-none focus:border-arc-500/50 focus:bg-white/10 transition-all font-light"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass rounded-2xl border border-white/5 bg-white/5 text-white px-6 py-4 font-medium focus:outline-none focus:border-arc-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-all"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#111827]">{o}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-3 flex-wrap mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat
                  ? "bg-white text-black shadow-lg hover:scale-105"
                  : "glass border border-white/5 text-gray-400 hover:border-arc-500/30 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass rounded-3xl p-6 h-64 skeleton border-white/5"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 glass rounded-3xl border border-white/5 bg-white/2">
            <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <p className="text-white text-2xl font-bold mb-2">No articles found</p>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </motion.div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600 mb-6">{filtered.length} articles found on-chain</p>
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filtered.map((article) => (
                <motion.div variants={fadeUp} key={article.id}>
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
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
