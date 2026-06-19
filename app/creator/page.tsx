"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight,
  Wallet, PlusCircle, ExternalLink, RefreshCw, Send, Zap, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { fetchArticlesByAuthor, fetchWriterEarnings, READLEARC_ADDRESS, USDC_ADDRESS, USDC_ABI, ARC_EXPLORER } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const fadeUp: any = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };
const stagger: any = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 440, width: "100%", padding: "clamp(28px,5vw,52px) clamp(20px,5vw,36px)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Zap size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>Creator Studio</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>Connect your wallet to view your on-chain earnings, article analytics, and manage your USDC.</p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? <><div className="rl-spinner" /> Connecting…</> : <><Wallet size={17} /> Connect Wallet</>}
          </button>
        </motion.div>
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}} .rl-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}`}</style>
    </div>
  );
}

export default function CreatorPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider, signer } = useWallet();

  const [articles,    setArticles]    = useState<any[]>([]);
  const [earnings,    setEarnings]    = useState<any>({ events: [], totalEarned: 0 });
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const [withdrawTo,    setWithdrawTo]    = useState("");
  const [withdrawing,   setWithdrawing]   = useState(false);
  const [withdrawStep,  setWithdrawStep]  = useState("");
  const [withdrawHash,  setWithdrawHash]  = useState("");
  const [withdrawErr,   setWithdrawErr]   = useState("");
  const [showWithdraw,  setShowWithdraw]  = useState(false);

  const load = useCallback(async () => {
    if (!isConnected || !provider) { setLoading(false); return; }
    try {
      const [arts, earn] = await Promise.all([fetchArticlesByAuthor(address, provider), fetchWriterEarnings(address, provider)]);
      setArticles(arts);
      setEarnings(earn);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isConnected, address, provider]);

  useEffect(() => { load(); }, [load]);

  async function handleWithdraw() {
    if (!signer || !USDC_ADDRESS || !withdrawTo) return;
    setWithdrawing(true); setWithdrawErr(""); setWithdrawHash("");
    try {
      if (!ethers.isAddress(withdrawTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const bal  = await usdc.balanceOf(address);
      if (bal === BigInt(0)) throw new Error("No USDC balance");
      setWithdrawStep("Confirm in wallet…");
      const tx = await usdc.transfer(withdrawTo, bal);
      setWithdrawStep("Confirming on Arc…");
      setWithdrawHash(tx.hash);
      await tx.wait();
      setWithdrawStep("Sent!");
      setTimeout(() => { setShowWithdraw(false); setWithdrawStep(""); setWithdrawTo(""); setWithdrawHash(""); }, 4000);
    } catch (err: any) { setWithdrawErr(err.reason || err.message); }
    finally { setWithdrawing(false); }
  }

  if (!isConnected) return <ConnectGate />;

  const totalReads = articles.reduce((s, a) => s + parseInt(a.reads || "0"), 0);
  const earningsByArticle = new Map<string, number>();
  for (const ev of earnings.events) {
    earningsByArticle.set(ev.articleId, (earningsByArticle.get(ev.articleId) || 0) + ev.earned);
  }
  const bars = Array.from({ length: 7 }, (_, i) => ({ day: ["S","M","T","W","T","F","S"][(new Date(Date.now() - (6-i)*86400000)).getDay()], amount: 0 }));
  if (earnings.events.length > 0) {
    earnings.events.forEach((ev: any, idx: number) => {
      bars[Math.min(Math.floor((idx / earnings.events.length) * 7), 6)].amount += ev.earned;
    });
  }
  const maxBar = Math.max(...bars.map(b => b.amount), 0.001);

  const KPI = [
    { label: "Total Earned",    value: `$${earnings.totalEarned.toFixed(4)}`, sub: "writer share (85%)", icon: DollarSign, color: "#059669",    bg: "rgba(5,150,105,0.08)"  },
    { label: "USDC Balance",    value: `$${usdcBalance}`,                     sub: "in your wallet",     icon: Wallet,     color: "var(--brand)", bg: "var(--brand-muted)"    },
    { label: "Total Reads",     value: totalReads.toLocaleString(),           sub: "across articles",    icon: Users,      color: "#0284c7",    bg: "rgba(2,132,199,0.08)"  },
    { label: "Articles",        value: articles.length.toString(),            sub: "published on-chain", icon: BookOpen,   color: "#d97706",    bg: "rgba(217,119,6,0.08)"  },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin{to{transform:rotate(360deg)}}
        .rl-spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}
        .c-kpi{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
        .c-row{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:20px}
        .art-tbl{display:none}.art-crd{display:block}
        @media(min-width:640px){.art-tbl{display:block!important}.art-crd{display:none!important}}
        @media(min-width:768px){.c-kpi{grid-template-columns:repeat(4,1fr)!important}}
        @media(min-width:900px){.c-row{grid-template-columns:1fr 260px!important}}
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>Creator Studio</h1>
            <p style={{ color: "var(--text-4)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              {shortAddress} · Arc Testnet
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setRefreshing(true); setLoading(true); load(); }} disabled={refreshing} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
              <RefreshCw size={13} style={refreshing ? { animation: "rl-spin 1s linear infinite" } : {}} />
            </button>
            <Link href={`/profile/${address}`} className="btn btn-ghost btn-sm">My Profile</Link>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <PlusCircle size={14} strokeWidth={2.5} /> New Article
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <motion.div className="c-kpi" variants={stagger} initial="hidden" animate="visible">
          {KPI.map(k => (
            <motion.div key={k.label} variants={fadeUp} className="card" style={{ padding: "16px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,3.5vw,22px)", fontWeight: 900, color: k.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 4 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 1 }}>{k.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart + Withdraw */}
        <div className="c-row">
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Earnings Distribution</h2>
                <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>From on-chain ArticleRead events</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>${earnings.totalEarned.toFixed(4)} total</span>
            </div>
            {earnings.events.length === 0 && !loading ? (
              <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 13 }}>
                No earnings yet — publish and share your articles!
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div title={`$${b.amount.toFixed(4)}`} style={{ width: "100%", borderRadius: "4px 4px 0 0", background: "linear-gradient(to top, var(--brand), var(--brand-light, #a78bfa))", opacity: 0.8, height: `${Math.max((b.amount / maxBar) * 100, b.amount > 0 ? 6 : 2)}%`, minHeight: 2, cursor: "default" }} />
                    <span style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 600 }}>{b.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(5,150,105,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={13} style={{ color: "#059669" }} />
              </div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>USDC Balance</h2>
            </div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, color: "#059669", letterSpacing: "-0.03em", lineHeight: 1 }}>${usdcBalance}</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", margin: "4px 0 10px" }}>Available in wallet</div>
            <div className="card-flat" style={{ padding: "10px 12px", marginBottom: 10, fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "var(--text-3)" }}>Writer earnings (85%)</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>${earnings.totalEarned.toFixed(4)}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-4)" }}>Paid directly to your wallet per read</div>
            </div>
            {!showWithdraw ? (
              <button onClick={() => setShowWithdraw(true)} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                <Send size={12} /> Send / Withdraw USDC
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <input type="text" placeholder="Recipient address (0x…)" value={withdrawTo} onChange={e => setWithdrawTo(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", outline: "none", fontSize: 11, color: "var(--text)", fontFamily: "JetBrains Mono, monospace" }} />
                {withdrawErr && <div style={{ fontSize: 10, color: "#dc2626" }}>{withdrawErr}</div>}
                {withdrawHash && (
                  <a href={`${ARC_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: "var(--brand)", fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
                    Tx: {withdrawHash.slice(0,14)}… ↗
                  </a>
                )}
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => { setShowWithdraw(false); setWithdrawErr(""); }} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>Cancel</button>
                  <button onClick={handleWithdraw} disabled={withdrawing || !withdrawTo} className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: "center", fontSize: 11 }}>
                    {withdrawing ? <><div className="rl-spinner" /> {withdrawStep}</> : <><ArrowUpRight size={12} /> Send All</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Your Articles</h2>
            <Link href="/write" style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>+ New article</Link>
          </div>

          {loading ? (
            <div style={{ padding: 16 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} />)}</div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <BookOpen size={28} style={{ color: "var(--text-4)", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>No articles yet</p>
              <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14 }}>{READLEARC_ADDRESS ? "Publish your first article to see earnings here." : "Deploy the contract first."}</p>
              <Link href="/write" className="btn btn-primary btn-sm">Write First Article</Link>
            </div>
          ) : (<>
            {/* Desktop */}
            <div className="art-tbl" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Article", "Reads", "Earned", "Price", ""].map((h, i) => (
                    <th key={i} style={{ padding: "9px 14px", textAlign: i === 0 ? "left" : "right", fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {articles.map((a, idx) => {
                    const earned = earningsByArticle.get(a.id) || (parseInt(a.reads||"0") * parseFloat(a.price||"0") * 0.85);
                    return (
                      <tr key={a.id} style={{ borderBottom: idx < articles.length-1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background="var(--bg-alt)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background="transparent"}
                      >
                        <td style={{ padding: "13px 14px", maxWidth: 280 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                          <span className="badge badge-neutral" style={{ marginTop: 3, fontSize: 9 }}>{a.category}</span>
                        </td>
                        <td style={{ padding: "13px 14px", textAlign: "right", fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{parseInt(a.reads).toLocaleString()}</td>
                        <td style={{ padding: "13px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#059669" }}>${earned.toFixed(4)}</td>
                        <td style={{ padding: "13px 14px", textAlign: "right", fontSize: 11, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</td>
                        <td style={{ padding: "13px 14px", textAlign: "right" }}>
                          <Link href={`/article/${a.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>View <ExternalLink size={10} /></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="art-crd">
              {articles.map((a, idx) => {
                const earned = earningsByArticle.get(a.id) || (parseInt(a.reads||"0") * parseFloat(a.price||"0") * 0.85);
                return (
                  <div key={a.id} style={{ padding: "12px 14px", borderBottom: idx < articles.length-1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div><div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase" }}>Earned</div><div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>${earned.toFixed(4)}</div></div>
                      <div><div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase" }}>Reads</div><div style={{ fontSize: 13, color: "var(--text-2)" }}>{parseInt(a.reads).toLocaleString()}</div></div>
                      <Link href={`/article/${a.id}`} style={{ marginLeft: "auto", fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>View <ExternalLink size={10} /></Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
          <Zap size={9} style={{ display: "inline", marginRight: 4 }} />
          All earnings settled atomically via Readlearc.sol on Arc · 85% writer share per read
        </div>
      </div>
    </div>
  );
}
