"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, ExternalLink, Wallet, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { fetchReadingHistory, ARC_EXPLORER } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 420, width: "100%", padding: "48px 28px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <BookOpen size={26} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>Connect to see your reading history</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>Every article you unlock is recorded on-chain. Connect your wallet to view your permanent read receipts.</p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? "Connecting…" : <><Wallet size={16} /> Connect Wallet</>}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function ReadingHistoryPage() {
  const { address, isConnected, provider } = useWallet();
  const [history,  setHistory]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isConnected || !provider) { setLoading(false); return; }
    setLoading(true);
    fetchReadingHistory(address, provider)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isConnected, address, provider, refreshKey]);

  if (!isConnected) return <ConnectGate />;

  const filtered = history.filter(h =>
    !search || h.title.toLowerCase().includes(search.toLowerCase()) || h.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = history.reduce((s, h) => s + parseFloat(h.pricePaid || "0"), 0);
  const totalTime  = history.reduce((s, h) => s + parseInt(h.readTime || "0"), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>Reading History</h1>
          <p style={{ color: "var(--text-4)", fontSize: 13 }}>Permanent on-chain proof of every article you've unlocked</p>
        </motion.div>

        {/* Summary strip */}
        {!loading && history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}
          >
            {[
              { label: "Articles Read",   value: history.length.toString(),        color: "var(--brand)", bg: "var(--brand-muted)" },
              { label: "On-chain Proofs", value: history.length.toString(),        color: "#059669",    bg: "rgba(5,150,105,0.08)" },
              { label: "USDC Spent",      value: `$${totalSpent.toFixed(4)}`,      color: "#d97706",    bg: "rgba(217,119,6,0.08)" },
              { label: "Time Reading",    value: `${totalTime}m`,                  color: "#0284c7",    bg: "rgba(2,132,199,0.08)" },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ position: "relative", marginBottom: 20 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search your reads…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input input-search"
              style={{ fontSize: 14 }}
            />
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
            <BookOpen size={36} style={{ color: "var(--text-4)", marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>
              {history.length === 0 ? "No articles read yet" : "No results match your search"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 20 }}>
              {history.length === 0
                ? "Unlock an article and your on-chain read receipt will appear here."
                : "Try a different search term."}
            </p>
            {history.length === 0 && <Link href="/explore" className="btn btn-primary btn-sm">Explore Articles</Link>}
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item, i) => (
              <motion.div key={`${item.txHash}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                    {/* Proof icon */}
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={17} style={{ color: "#059669" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                        <Link href={`/article/${item.id}`} style={{
                          fontSize: 14, fontWeight: 700, color: "var(--text)", textDecoration: "none",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", lineHeight: 1.35,
                        }}>
                          {item.title}
                        </Link>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>-${parseFloat(item.pricePaid).toFixed(4)}</div>
                          <div style={{ fontSize: 10, color: "var(--text-4)" }}>USDC</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <span className="badge badge-brand" style={{ textTransform: "capitalize", fontSize: 10 }}>{item.category}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-4)" }}>
                          <Clock size={10} /> {item.readTime}m read
                        </span>
                        <Link href={`/profile/${item.authorAddress}`} style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
                          {item.authorAddress.slice(0,6)}…{item.authorAddress.slice(-4)}
                        </Link>
                      </div>

                      {/* TX proof */}
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={10} style={{ color: "#059669", flexShrink: 0 }} />
                        <a
                          href={`${ARC_EXPLORER}/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {item.txHash} <ExternalLink size={9} style={{ flexShrink: 0 }} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Refresh */}
        {!loading && history.length > 0 && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={() => setRefreshKey(k => k + 1)} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              Refresh from chain
            </button>
          </div>
        )}

        {/* Chain proof note */}
        <div style={{ marginTop: 28, padding: "14px 16px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-4)", lineHeight: 1.65, textAlign: "center" }}>
          All read receipts are permanently recorded on <strong style={{ color: "var(--brand)" }}>Arc blockchain</strong>. Your reading history is verifiable, portable, and owned by you — not Readlearc.
        </div>
      </div>
    </div>
  );
}
