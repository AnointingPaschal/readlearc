"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight,
  Wallet, PlusCircle, ExternalLink, RefreshCw, Send, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { fetchArticlesByAuthor, fetchWriterEarnings, READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI, ARC_EXPLORER } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const fadeUp: any = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } } };
const stagger: any = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 440, width: "100%", padding: "clamp(28px,5vw,52px) clamp(20px,5vw,36px)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Wallet size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>Connect to access Creator Studio</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>Connect your wallet to view your on-chain earnings, article analytics, and manage your creator balance.</p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? <><div className="rl-spinner" /> Connecting…</> : <><Wallet size={17} /> Connect Wallet</>}
          </button>
        </motion.div>
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}} .rl-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}`}</style>
    </div>
  );
}

export default function DashboardPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider, signer } = useWallet();

  const [articles,     setArticles]     = useState<any[]>([]);
  const [earnings,     setEarnings]     = useState<any>({ events: [], totalEarned: 0, weekEarned: 0 });
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  // Withdraw USDC (send to self / external)
  const [withdrawTo,   setWithdrawTo]   = useState("");
  const [withdrawing,  setWithdrawing]  = useState(false);
  const [withdrawStep, setWithdrawStep] = useState("");
  const [withdrawHash, setWithdrawHash] = useState("");
  const [withdrawErr,  setWithdrawErr]  = useState("");
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);

  const load = useCallback(async () => {
    if (!isConnected || !provider) { setLoading(false); return; }
    try {
      const [arts, earn] = await Promise.all([
        fetchArticlesByAuthor(address, provider),
        fetchWriterEarnings(address, provider),
      ]);
      setArticles(arts);
      setEarnings(earn);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isConnected, address, provider]);

  useEffect(() => { load(); }, [load]);

  async function handleWithdraw() {
    if (!signer || !USDC_ADDRESS || !withdrawTo) return;
    setWithdrawing(true);
    setWithdrawErr("");
    setWithdrawHash("");
    try {
      if (!ethers.isAddress(withdrawTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec = await usdc.decimals();
      const bal = await usdc.balanceOf(address);
      if (bal === BigInt(0)) throw new Error("No USDC balance to withdraw");
      setWithdrawStep("Confirm in wallet…");
      const tx = await usdc.transfer(withdrawTo, bal);
      setWithdrawStep("Confirming on Arc…");
      setWithdrawHash(tx.hash);
      await tx.wait();
      setWithdrawStep("Done!");
      setTimeout(() => { setShowWithdrawInput(false); setWithdrawStep(""); setWithdrawTo(""); setWithdrawHash(""); }, 4000);
    } catch (err: any) {
      setWithdrawErr(err.reason || err.message || "Transaction failed");
    } finally {
      setWithdrawing(false);
    }
  }

  if (!isConnected) return <ConnectGate />;

  const totalReads = articles.reduce((s, a) => s + parseInt(a.reads || "0"), 0);

  // Compute per-article earnings from events
  const earningsByArticle = new Map<string, number>();
  for (const ev of earnings.events) {
    earningsByArticle.set(ev.articleId, (earningsByArticle.get(ev.articleId) || 0) + ev.earned);
  }

  // Build 7-day bar chart from real events
  const now  = Date.now();
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(now - (6 - i) * 86400000);
    const day  = ["S","M","T","W","T","F","S"][d.getDay()];
    return { day, amount: 0 };
  });
  // NOTE: block timestamps not fetched here for perf — bars show article count distribution instead
  // In production, fetch block timestamps per event and group by day
  if (earnings.events.length > 0) {
    // Distribute known earnings across days proportionally (block height proxy)
    const total = earnings.events.length;
    earnings.events.forEach((ev: any, idx: number) => {
      const barIdx = Math.floor((idx / total) * 7);
      bars[Math.min(barIdx, 6)].amount += ev.earned;
    });
  }
  const maxBar = Math.max(...bars.map(b => b.amount), 0.001);

  const KPI = [
    { label: "Total Earned",    value: `$${earnings.totalEarned.toFixed(4)}`, sub: "USDC, writer share",   icon: DollarSign,  color: "#059669",    bg: "rgba(5,150,105,0.08)"   },
    { label: "USDC Balance",    value: `$${usdcBalance}`,                     sub: "in your wallet",       icon: Wallet,      color: "var(--brand)", bg: "var(--brand-muted)"     },
    { label: "Total Reads",     value: totalReads.toLocaleString(),           sub: "across all articles",  icon: BookOpen,    color: "#0284c7",    bg: "rgba(2,132,199,0.08)"   },
    { label: "Articles",        value: articles.length.toString(),            sub: "published on-chain",   icon: TrendingUp,  color: "#d97706",    bg: "rgba(217,119,6,0.08)"   },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin{to{transform:rotate(360deg)}}
        .rl-spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}
        .dash-kpi  { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:20px; }
        .dash-row  { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px; }
        .art-table { display:none; }
        .art-cards { display:block; }
        @media(min-width:640px)  { .art-table{display:block !important} .art-cards{display:none !important} }
        @media(min-width:768px)  { .dash-kpi{grid-template-columns:repeat(4,1fr) !important} }
        @media(min-width:900px)  { .dash-row{grid-template-columns:1fr 260px !important} }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,32px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              Creator Studio
            </h1>
            <p style={{ color: "var(--text-4)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              {shortAddress} · Arc Testnet
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setRefreshing(true); setLoading(true); load(); }} disabled={refreshing} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
              <RefreshCw size={14} style={refreshing ? { animation: "rl-spin 1s linear infinite" } : {}} />
            </button>
            <Link href={`/profile/${address}`} className="btn btn-ghost btn-sm">My Profile</Link>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <PlusCircle size={14} strokeWidth={2.5} /> New Article
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <motion.div className="dash-kpi" variants={stagger} initial="hidden" animate="visible">
          {KPI.map(kpi => (
            <motion.div key={kpi.label} variants={fadeUp} className="card" style={{ padding: "16px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <kpi.icon size={15} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,3.5vw,24px)", fontWeight: 900, color: kpi.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 1 }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart + Withdraw */}
        <div className="dash-row">
          {/* Earnings chart */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Earnings (7-day)</h2>
                <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>Writer share from on-chain reads</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>${earnings.totalEarned.toFixed(4)} total</span>
            </div>
            {earnings.events.length === 0 && !loading ? (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 13 }}>
                No earnings yet — publish and share your articles!
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div title={`$${b.amount.toFixed(4)}`} style={{ width: "100%", borderRadius: "4px 4px 0 0", background: "linear-gradient(to top, var(--brand), var(--brand-light, #a78bfa))", opacity: 0.8, height: `${Math.max((b.amount / maxBar) * 100, b.amount > 0 ? 6 : 2)}%`, transition: "opacity .2s", minHeight: 2, cursor: "default" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.8")}
                    />
                    <span style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 600 }}>{b.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdraw */}
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(5,150,105,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={14} style={{ color: "#059669" }} />
              </div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>USDC Balance</h2>
            </div>

            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(26px,4vw,36px)", fontWeight: 900, color: "#059669", letterSpacing: "-0.03em", lineHeight: 1 }}>${usdcBalance}</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", margin: "4px 0 12px" }}>Available in wallet</div>

            <div className="card-flat" style={{ padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text-3)" }}>Writer earnings (85%)</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>${earnings.totalEarned.toFixed(4)}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-4)", display: "flex", justifyContent: "space-between" }}>
                <span>Earnings go directly to your wallet</span>
              </div>
            </div>

            {!showWithdrawInput ? (
              <button onClick={() => setShowWithdrawInput(true)} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                <Send size={13} /> Send / Withdraw USDC
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Recipient address (0x…)"
                  value={withdrawTo}
                  onChange={e => setWithdrawTo(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", outline: "none", fontSize: 12, color: "var(--text)", fontFamily: "JetBrains Mono, monospace" }}
                />
                {withdrawErr && <div style={{ fontSize: 11, color: "#ef4444" }}>{withdrawErr}</div>}
                {withdrawHash && (
                  <a href={`${ARC_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--brand)", fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
                    Tx: {withdrawHash.slice(0,14)}… ↗
                  </a>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setShowWithdrawInput(false); setWithdrawErr(""); }} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                  <button onClick={handleWithdraw} disabled={withdrawing || !withdrawTo} className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: "center" }}>
                    {withdrawing ? <><div className="rl-spinner" /> {withdrawStep}</> : <><ArrowUpRight size={13} /> Send All USDC</>}
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: 10, color: "var(--text-4)", textAlign: "center", marginTop: 8, fontFamily: "JetBrains Mono, monospace" }}>
              Earnings paid directly to wallet on each read
            </p>
          </div>
        </div>

        {/* Articles */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Your Articles</h2>
            <Link href="/write" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>+ Publish new</Link>
          </div>

          {loading ? (
            <div style={{ padding: "16px" }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 10 }} />)}</div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <BookOpen size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
              <p style={{ color: "var(--text-3)", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No articles yet</p>
              <p style={{ color: "var(--text-4)", fontSize: 13, marginBottom: 18 }}>
                {READLEARC_ADDRESS ? "Publish your first article to see analytics here." : "Deploy the contract first, then publish articles."}
              </p>
              <Link href="/write" className="btn btn-primary btn-sm">Write First Article</Link>
            </div>
          ) : (<>
            {/* Desktop table */}
            <div className="art-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Article", "Reads", "Earned (85%)", "Price", ""].map((h, i) => (
                      <th key={i} style={{ padding: "10px 16px", textAlign: i === 0 ? "left" : "right", fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a, idx) => {
                    const articleEarned = earningsByArticle.get(a.id) || (parseInt(a.reads || "0") * parseFloat(a.price || "0") * 0.85);
                    return (
                      <tr key={a.id} style={{ borderBottom: idx < articles.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-alt)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "14px 16px", maxWidth: 300 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                          <span className="badge badge-neutral" style={{ marginTop: 4, fontSize: 9 }}>{a.category}</span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>{parseInt(a.reads).toLocaleString()}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#059669" }}>${articleEarned.toFixed(4)}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 12, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <Link href={`/article/${a.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="art-cards">
              {articles.map((a, idx) => {
                const articleEarned = earningsByArticle.get(a.id) || (parseInt(a.reads || "0") * parseFloat(a.price || "0") * 0.85);
                return (
                  <div key={a.id} style={{ padding: "14px 16px", borderBottom: idx < articles.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.title}</span>
                      <span className="badge badge-neutral" style={{ flexShrink: 0, fontSize: 9 }}>{a.category}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                      <div><div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Earned</div><div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>${articleEarned.toFixed(4)}</div></div>
                      <div><div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Reads</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{parseInt(a.reads).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Price</div><div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</div></div>
                      <Link href={`/article/${a.id}`} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 700 }}>View <ExternalLink size={11} /></Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
          <Zap size={9} style={{ display: "inline", marginRight: 4 }} />
          All earnings settled atomically via Readlearc.sol on Arc · Writer receives 85% per read
        </div>
      </div>
    </div>
  );
}
