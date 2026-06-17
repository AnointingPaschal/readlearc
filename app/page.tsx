"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Zap, Shield, TrendingUp, Users, DollarSign, ChevronRight, Clock, Coins, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAllArticles } from "../lib/web3";
import Navbar from "../components/ui/Navbar";

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
    desc: "Write your article, set a USDC price, and publish entirely on-chain on the Arc network.",
    icon: BookOpen,
    accent: "#6d28d9",
    accentBg: "rgba(109,40,217,0.08)",
  },
  {
    step: "02",
    title: "Reader Discovers",
    desc: "Browse the feed, see the preview blurb and price. Pay with your wallet — instant nanopayment.",
    icon: Coins,
    accent: "#059669",
    accentBg: "rgba(5,150,105,0.08)",
  },
  {
    step: "03",
    title: "Instant Settlement",
    desc: "USDC is split atomically on-chain: 85% to writer, 10% to platform, 5% to referrer. No delay.",
    icon: Zap,
    accent: "#0284c7",
    accentBg: "rgba(2,132,199,0.08)",
  },
  {
    step: "04",
    title: "Content Unlocks",
    desc: "Payment verified on-chain. Full article renders immediately. Proof-of-read recorded forever.",
    icon: Shield,
    accent: "#d97706",
    accentBg: "rgba(217,119,6,0.08)",
  },
];

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllArticles()
      .then(d => setArticles(d.slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section style={{ paddingTop: 128, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        {/* subtle grid */}
        <div className="hero-grid" style={{
          position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none",
        }} />
        {/* glow blobs */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(109,40,217,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative" }}>
          <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

            <motion.div variants={fadeUp}>
              <span className="badge badge-brand" style={{ marginBottom: 24 }}>
                <Zap size={11} strokeWidth={3} />
                Built on Arc · Circle USDC · 100% On-Chain
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "clamp(44px, 7vw, 88px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                marginBottom: 24,
              }}
            >
              Pay per word.<br />
              <span className="gradient-text">Own every read.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "var(--text-3)",
                maxWidth: 560,
                lineHeight: 1.65,
                marginBottom: 40,
                fontWeight: 400,
              }}
            >
              The first pay-per-read platform where writers earn instantly in USDC
              and readers own cryptographic proof of every article they unlock.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 72 }}>
              <Link href="/explore" className="btn btn-primary btn-lg">
                Start Reading <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link href="/write" className="btn btn-secondary btn-lg">
                Start Writing <TrendingUp size={18} />
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={stagger}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
                width: "100%",
              }}
            >
              {STATS.map(stat => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="card"
                  style={{ padding: "24px 20px", textAlign: "center", cursor: "default" }}
                >
                  <stat.icon size={20} style={{ color: "var(--brand)", marginBottom: 10 }} />
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500, marginTop: 4 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ─── Trending Articles ─────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-alt)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, gap: 16, flexWrap: "wrap" }}
          >
            <div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                Trending Now
              </h2>
              <p style={{ color: "var(--text-3)", marginTop: 6, fontSize: 15 }}>
                Pay in USDC. Read instantly. Verified on-chain.
              </p>
            </div>
            <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color: "var(--brand)", fontWeight: 700 }}>
              View all <ChevronRight size={14} />
            </Link>
          </motion.div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 20 }} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card"
              style={{ padding: "64px 32px", textAlign: "center", borderStyle: "dashed" }}
            >
              <BookOpen size={40} style={{ color: "var(--text-4)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>No articles yet</h3>
              <p style={{ color: "var(--text-4)", fontSize: 14 }}>Deploy the contract and publish the first article!</p>
              <Link href="/write" className="btn btn-primary" style={{ marginTop: 24 }}>
                Write First Article
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}
            >
              {articles.map((article, i) => (
                <motion.div key={article.id} variants={fadeUp}>
                  <Link href={`/article/${article.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div className="card" style={{ padding: "28px 24px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="badge badge-brand" style={{ textTransform: "capitalize" }}>{article.category}</span>
                        <span className="price-tag">${article.price} USDC</span>
                      </div>
                      <h3 style={{
                        fontFamily: "Outfit, sans-serif",
                        fontSize: 20, fontWeight: 700,
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
                      <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--brand), var(--accent))",
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                            @{article.author?.handle}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} /> {article.readTime}m
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Users size={12} /> {article.reads}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── How it Works ─────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 12 }}>
              How Readlearc Works
            </h2>
            <p style={{ color: "var(--text-3)", fontSize: 16, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              Built on Arc — Circle's USDC-native L1. Payments settle in under a second.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card"
                style={{ padding: "28px 24px" }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: item.accentBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, border: `1px solid ${item.accent}22`,
                }}>
                  <item.icon size={22} style={{ color: item.accent }} strokeWidth={2} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-4)", marginBottom: 8, textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
                  Step {item.step}
                </div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Revenue Split ─────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-alt)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="card"
            style={{ padding: "56px 48px", textAlign: "center", background: "var(--bg-card)" }}
          >
            <span className="badge badge-brand" style={{ marginBottom: 24 }}>
              <Zap size={11} strokeWidth={3} />
              Atomic On-Chain Splitting
            </span>

            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 12 }}>
              Writers keep <span className="gradient-text">85%</span>
            </h2>
            <p style={{ color: "var(--text-3)", fontSize: 16, marginBottom: 48, lineHeight: 1.65 }}>
              Every read triggers a smart contract. No escrow, no middlemen, no minimums.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 40, flexWrap: "wrap" }}>
              {[
                { pct: "85%", label: "Writer", color: "#059669" },
                { pct: "10%", label: "Platform", color: "#6d28d9" },
                { pct: "5%", label: "Referrer", color: "#0284c7" },
              ].map(({ pct, label, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 52, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>
                    {pct}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="split-bar">
              <div style={{ width: "85%", background: "#059669" }} />
              <div style={{ width: "10%", background: "#6d28d9" }} />
              <div style={{ width: "5%", background: "#0284c7" }} />
            </div>

            <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
              Executed via Readlearc.sol on Arc Testnet
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 20 }}
          >
            Start earning in <span className="gradient-text">USDC</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ color: "var(--text-3)", fontSize: 17, lineHeight: 1.65, marginBottom: 40 }}
          >
            Join the decentralized publishing revolution. No ads, no paywall bypasses, just fair nanopayments settled in milliseconds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/write" className="btn btn-primary btn-lg">
              Publish Article
            </Link>
            <Link href="/explore" className="btn btn-secondary btn-lg">
              Explore Network
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 24px", background: "var(--bg-alt)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, var(--brand), var(--accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={15} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Readlearc</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { href: "/explore", label: "Explore" },
                { href: "/write", label: "Write" },
                { href: "/admin", label: "Admin" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{ fontSize: 14, color: "var(--text-4)", textDecoration: "none", fontWeight: 500 }}>
                  {label}
                </Link>
              ))}
              <a href="https://explorer.arc.io/testnet" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--text-4)", textDecoration: "none", fontWeight: 500 }}>
                Arc Explorer ↗
              </a>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-4)" }}>© 2026 Readlearc Protocol.</span>
            <span style={{ fontSize: 13, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
