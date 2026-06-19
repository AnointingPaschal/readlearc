"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight,
  BarChart3, Wallet, Bell, PlusCircle, ExternalLink,
  ChevronUp, ChevronDown, Zap, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { READLEARC_ADDRESS, READLEARC_ABI } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const stagger: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

// ── ConnectGate ─────────────────────────────────────────────────
function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{
          maxWidth: 420, width: "100%", padding: "clamp(32px,5vw,56px) clamp(20px,5vw,40px)", textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--brand-muted)", border: "2px solid var(--border-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Wallet size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,26px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
            Connect Your Wallet
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
            Connect your wallet to access your writer dashboard, track earnings, and manage your articles.
          </p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting
              ? <><div className="rl-spinner" /> Connecting…</>
              : <><Wallet size={17} /> Connect Wallet</>
            }
          </button>
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--text-4)" }}>MetaMask, WalletConnect, or any EIP-1193 wallet</p>
        </motion.div>
      </div>
      <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } } .rl-spinner { width:15px;height:15px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:rl-spin 0.7s linear infinite;flex-shrink:0; }`}</style>
    </div>
  );
}

// ── Main dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider } = useWallet();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!isConnected || !provider) { setLoading(false); return; }
    async function load() {
      try {
        if (!READLEARC_ADDRESS) { setLoading(false); return; }
        const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider!);
        const count = await contract.articleCount();
        const total = Number(count);
        const fetched: any[] = [];
        for (let i = total; i >= Math.max(1, total - 20); i--) {
          try {
            const meta = await contract.getArticleMetadata(i);
            if (meta.author.toLowerCase() === address.toLowerCase()) {
              fetched.push({
                id: meta.id.toString(),
                title: meta.title,
                reads: Number(meta.reads),
                price: ethers.formatUnits(meta.price, 6),
                earned: (Number(ethers.formatUnits(meta.price, 6)) * Number(meta.reads) * 0.85).toFixed(2),
                category: meta.category,
              });
            }
          } catch {}
        }
        setArticles(fetched);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [isConnected, address, provider]);

  if (!isConnected) return <ConnectGate />;

  const totalEarned = articles.reduce((s, a) => s + parseFloat(a.earned), 0);
  const totalReads = articles.reduce((s, a) => s + a.reads, 0);

  const BARS = ["M","T","W","T","F","S","S"].map((d, i) => ({
    day: d, h: [45, 72, 38, 88, 65, 92, 55][i],
  }));

  const KPI = [
    { label: "Total Earned",   value: `$${totalEarned.toFixed(2)}`, sub: "USDC all-time",       icon: DollarSign, color: "#059669",    bg: "rgba(5,150,105,0.08)"   },
    { label: "USDC Balance",   value: `$${usdcBalance}`,             sub: "in wallet",            icon: Wallet,     color: "var(--brand)", bg: "var(--brand-muted)"     },
    { label: "Total Reads",    value: totalReads.toLocaleString(),   sub: "across articles",      icon: BookOpen,   color: "#0284c7",    bg: "rgba(2,132,199,0.08)"   },
    { label: "Articles",       value: articles.length.toString(),    sub: "published on-chain",   icon: TrendingUp, color: "#d97706",    bg: "rgba(217,119,6,0.08)"   },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin { to { transform: rotate(360deg); } }
        .rl-spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:rl-spin 0.7s linear infinite;flex-shrink:0; }

        .dash-kpi   { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:20px; }
        .dash-row   { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px; }
        .art-table  { display:none; }
        .art-cards  { display:block; }

        @media(min-width:640px)  { .art-table { display:block !important; } .art-cards { display:none !important; } }
        @media(min-width:768px)  { .dash-kpi  { grid-template-columns:repeat(4,1fr) !important; } }
        @media(min-width:900px)  { .dash-row  { grid-template-columns:1fr 240px !important; } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              Writer Dashboard
            </h1>
            <p style={{ color: "var(--text-4)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              {shortAddress} · Arc Testnet
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(v => !v)} style={{
                width: 38, height: 38, borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border)", background: "var(--bg-card)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-3)", position: "relative",
              }}>
                <Bell size={15} />
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 15, height: 15, borderRadius: "50%",
                  background: "var(--brand)", color: "white",
                  fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>3</span>
              </button>
              {notifOpen && (
                <div className="card" style={{ position: "absolute", right: 0, top: 46, width: 260, zIndex: 100, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Notifications</div>
                  {[
                    { msg: "Article unlocked by 0x1a2b…", time: "2 min ago" },
                    { msg: "Earned $0.04 USDC from read", time: "14 min ago" },
                    { msg: "New comment on your article", time: "1 hr ago" },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? "1px solid var(--border)" : "none", fontSize: 12, color: "var(--text-2)" }}>
                      <div>{n.msg}</div>
                      <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <PlusCircle size={14} strokeWidth={2.5} /> New Article
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <motion.div className="dash-kpi" variants={stagger} initial="hidden" animate="visible">
          {KPI.map(kpi => (
            <motion.div key={kpi.label} variants={fadeUp} className="card" style={{ padding: "18px 16px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,3.5vw,26px)", fontWeight: 900, color: kpi.color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 5 }}>{kpi.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 1 }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart + Withdraw */}
        <div className="dash-row">
          {/* Bar chart */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Weekly Earnings</h2>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>USDC earned per day</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                <BarChart3 size={13} /> ${(parseFloat(usdcBalance) || 28).toFixed(2)} this week
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
              {BARS.map(b => (
                <div key={b.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: "100%", borderRadius: "4px 4px 0 0",
                    background: "linear-gradient(to top, var(--brand), var(--brand-light, #a78bfa))",
                    opacity: 0.75, height: `${b.h}%`, transition: "opacity 0.2s", minHeight: 4,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
                  />
                  <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600 }}>{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdraw */}
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(5,150,105,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={14} style={{ color: "#059669" }} />
              </div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Withdraw</h2>
            </div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(28px,5vw,38px)", fontWeight: 900, color: "#059669", letterSpacing: "-0.03em", lineHeight: 1 }}>
              ${totalEarned.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-4)", margin: "4px 0 16px" }}>Available USDC</div>
            <div className="card-flat" style={{ padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                <span>Writer earnings (85%)</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>${totalEarned.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-4)" }}>
                <span>Gas estimate</span><span>~$0.001</span>
              </div>
            </div>
            <button
              onClick={() => setWithdrawing(true)}
              disabled={withdrawing || totalEarned === 0}
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <ArrowUpRight size={14} /> Withdraw to Wallet
            </button>
            <p style={{ fontSize: 10, color: "var(--text-4)", textAlign: "center", marginTop: 8 }}>Instant on Arc · sign with wallet</p>
          </div>
        </div>

        {/* Articles */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Your Articles</h2>
            <Link href="/write" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>+ Publish new</Link>
          </div>

          {loading ? (
            <div style={{ padding: "20px 16px" }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 10 }} />)}
            </div>
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
                    {["Article", "Reads", "Earned", "Price/Read", ""].map((h, i) => (
                      <th key={i} style={{
                        padding: "10px 16px", textAlign: i === 0 ? "left" : "right",
                        fontSize: 10, color: "var(--text-4)", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom: idx < articles.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-alt)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px", maxWidth: 280 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                        <span className="badge badge-neutral" style={{ marginTop: 4 }}>{a.category}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>{a.reads.toLocaleString()}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#059669" }}>${a.earned}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 13, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <Link href={`/article/${a.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                          View <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="art-cards">
              {articles.map((a, idx) => (
                <div key={a.id} style={{ padding: "14px 16px", borderBottom: idx < articles.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, flex: 1,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                      {a.title}
                    </span>
                    <span className="badge badge-neutral" style={{ flexShrink: 0 }}>{a.category}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Earned</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>${a.earned}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Reads</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>{a.reads.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Price</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</div>
                    </div>
                    <Link href={`/article/${a.id}`} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 700 }}>
                      View <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
          <Zap size={10} style={{ display: "inline", marginRight: 4 }} />
          All earnings settled via Readlearc.sol on Arc Testnet
        </div>
      </div>
    </div>
  );
}
