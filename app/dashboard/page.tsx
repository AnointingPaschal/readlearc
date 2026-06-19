"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, DollarSign, Clock, CheckCircle2, Wallet, ArrowRight, History, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { fetchReadingHistory } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "20px 16px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 420, width: "100%", padding: "clamp(28px,5vw,48px) clamp(20px,4vw,32px)", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={26} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,4vw,22px)", fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>Your Reading Dashboard</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>Connect your wallet to see articles you've read, USDC spent, and your on-chain reading history.</p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? "Connecting…" : <><Wallet size={16} /> Connect Wallet</>}
          </button>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 10 }}>A writer? Manage your articles and earnings →</p>
            <Link href="/creator" className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <PenLine size={13} /> Creator Studio
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected, provider, usdcBalance, shortAddress } = useWallet();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !provider) { setLoading(false); return; }
    fetchReadingHistory(address, provider).then(setHistory).catch(console.error).finally(() => setLoading(false));
  }, [isConnected, address, provider]);

  if (!isConnected) return <ConnectGate />;

  const totalSpent = history.reduce((s, h) => s + parseFloat(h.pricePaid || "0"), 0);
  const totalTime  = history.reduce((s, h) => s + parseInt(h.readTime || "0"), 0);

  const KPI = [
    { label: "Articles Read",  value: history.length, color: "var(--brand)", bg: "var(--brand-muted)" },
    { label: "USDC Spent",     value: `$${totalSpent.toFixed(4)}`, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
    { label: "Time Reading",   value: `${totalTime}m`,             color: "#0284c7", bg: "rgba(2,132,199,0.08)" },
    { label: "USDC Balance",   value: `$${usdcBalance}`,           color: "#059669", bg: "rgba(5,150,105,0.08)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,28px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>Reading Dashboard</h1>
            <p style={{ color: "var(--text-4)", fontSize: 12 }}>{shortAddress} · your on-chain reading record</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/creator" className="btn btn-ghost btn-sm"><PenLine size={13} /> Creator Studio</Link>
            <Link href="/explore" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>Browse Articles</Link>
          </div>
        </motion.div>

        {/* KPI row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}
          className="dash-kpi"
        >
          {KPI.map(k => (
            <div key={k.label} className="card" style={{ padding: "16px" }}>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,26px)", fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 5 }}>{k.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 28 }}
        >
          {[
            { href: "/reading-history", icon: History,     label: "Reading History",     sub: "All your read receipts" },
            { href: "/wallet",          icon: Wallet,      label: "My Wallet",           sub: "USDC balance & transactions" },
            { href: "/explore",         icon: BookOpen,    label: "Explore",             sub: "Discover new articles" },
            { href: "/creator",         icon: PenLine,     label: "Creator Studio",      sub: "Publish & earn USDC" },
          ].map(lnk => (
            <Link key={lnk.href} href={lnk.href} style={{ textDecoration: "none", display: "block" }}>
              <div className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <lnk.icon size={15} style={{ color: "var(--brand)" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{lnk.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{lnk.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Recent reads */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Recent Reads</h2>
            <Link href="/reading-history" style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>View all <ArrowRight size={12} /></Link>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)}
            </div>
          ) : history.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
              <BookOpen size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>No articles read yet</p>
              <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 16 }}>Unlock your first article and it'll appear here with its on-chain proof.</p>
              <Link href="/explore" className="btn btn-primary btn-sm">Browse Articles</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(0, 5).map((h, i) => (
                <Link key={i} href={`/article/${h.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={15} style={{ color: "#059669" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", display: "flex", gap: 8, marginTop: 2 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} /> {h.readTime}m</span>
                        <span>${parseFloat(h.pricePaid).toFixed(4)} USDC</span>
                      </div>
                    </div>
                    <ArrowRight size={13} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <style>{`.dash-kpi{@media(min-width:640px){grid-template-columns:repeat(4,1fr)!important}}`}</style>
    </div>
  );
}
