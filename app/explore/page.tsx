"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Clock, Users, BookOpen, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAllArticles } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const CATEGORIES = ["All", "Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi"];
const SORT_OPTIONS = ["Newest", "Most Read", "Lowest Price"];

const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllArticles()
      .then(d => setArticles(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.blurb.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === "Newest") return Number(b.timestamp) - Number(a.timestamp);
    if (sortBy === "Most Read") return Number(b.reads) - Number(a.reads);
    if (sortBy === "Lowest Price") return Number(a.price) - Number(b.price);
    return 0;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px 80px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            marginBottom: 8,
          }}>
            Explore Articles
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 16 }}>
            Discover stories stored permanently on-chain. Pay in USDC, read instantly.
          </p>
        </motion.div>

        {/* Search + Sort row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={17} style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-4)", pointerEvents: "none",
            }} />
            <input
              type="text"
              placeholder="Search articles, topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input input-search"
              style={{ fontSize: 14 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={16} style={{ color: "var(--text-4)" }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input"
              style={{ width: "auto", paddingLeft: 14, paddingRight: 36, fontSize: 14, cursor: "pointer", backgroundImage: "none" }}
            >
              {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--radius-full)",
                border: activeCategory === cat ? "1.5px solid var(--brand)" : "1.5px solid var(--border)",
                background: activeCategory === cat ? "var(--brand-muted)" : "var(--bg-card)",
                color: activeCategory === cat ? "var(--brand)" : "var(--text-3)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: activeCategory === cat ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Articles grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 20 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card"
            style={{ padding: "80px 32px", textAlign: "center" }}
          >
            <BookOpen size={44} style={{ color: "var(--text-4)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>
              {articles.length === 0 ? "No articles yet" : "No articles match your search"}
            </h3>
            <p style={{ color: "var(--text-4)", fontSize: 14 }}>
              {articles.length === 0
                ? "Deploy the contract and publish the first article."
                : "Try adjusting your search or category filter."}
            </p>
          </motion.div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--text-4)", fontWeight: 500, marginBottom: 20 }}>
              {filtered.length} article{filtered.length !== 1 ? "s" : ""} on-chain
            </p>
            <motion.div
              variants={stagger} initial="hidden" animate="visible"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}
            >
              {filtered.map(article => (
                <motion.div key={article.id} variants={fadeUp}>
                  <Link href={`/article/${article.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                    <div className="card" style={{ padding: "26px 22px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="badge badge-brand" style={{ textTransform: "capitalize" }}>
                          {article.category}
                        </span>
                        <span className="price-tag">${article.price} USDC</span>
                      </div>

                      <h3 style={{
                        fontFamily: "Outfit, sans-serif",
                        fontSize: 19, fontWeight: 700,
                        color: "var(--text)", lineHeight: 1.3,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {article.title}
                      </h3>

                      <p style={{
                        color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, flex: 1,
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {article.blurb}
                      </p>

                      <div style={{
                        paddingTop: 14,
                        borderTop: "1px solid var(--border)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--brand), var(--accent))",
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                            @{article.author?.handle}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={11} /> {article.readTime}m
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Users size={11} /> {article.reads}
                          </span>
                        </div>
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
