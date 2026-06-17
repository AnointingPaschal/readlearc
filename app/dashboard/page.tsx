"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Zap, TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight,
  BarChart3, Wallet, Bell, PlusCircle, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { READLEARC_ADDRESS, READLEARC_ABI } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const stagger: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

// ── ConnectGate: shown when wallet is not connected ─────────────
function ConnectGate() {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{
          maxWidth: 460, width: "100%", padding: "56px 40px", textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--brand-muted)", border: "2px solid var(--border-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Wallet size={30} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Connect Your Wallet
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
            Connect your wallet to access your writer dashboard, track earnings, and manage your articles.
          </p>
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            {isConnecting
              ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "rl-spin 0.7s linear infinite" }} /> Connecting…</>
              : <><Wallet size={17} /> Connect Wallet</>
            }
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-4)" }}>
            MetaMask, WalletConnect, or any EIP-1193 wallet
          </p>
          <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider } = useWallet();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

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

  // Placeholder bar chart data (weekly simulated from USDC balance)
  const BARS = ["M","T","W","T","F","S","S"].map((d, i) => ({
    day: d,
    h: [45, 72, 38, 88, 65, 92, 55][i],
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 20px 60px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              Writer Dashboard
            </h1>
            <p style={{ color: "var(--text-4)", fontSize: 14 }}>
              {shortAddress} · Arc Testnet
            </p>
          </div>
          <Link href="/write" className="btn btn-primary">
            <PlusCircle size={15} strokeWidth={2.5} /> New Article
          </Link>
        </div>

        {/* KPI cards */}
        <motion.div variants={stagger} initial="hidden" animate="visible"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}
        >
          {[
            { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, sub: "USDC all-time", icon: DollarSign, color: "#059669", bg: "rgba(5,150,105,0.08)" },
            { label: "USDC Balance", value: `$${usdcBalance}`, sub: "in wallet", icon: Wallet, color: "var(--brand)", bg: "var(--brand-muted)" },
            { label: "Total Reads", value: totalReads.toLocaleString(), sub: "across articles", icon: BookOpen, color: "#0284c7", bg: "rgba(2,132,199,0.08)" },
            { label: "Articles", value: articles.length.toString(), sub: "published on-chain", icon: TrendingUp, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
          ].map(kpi => (
            <motion.div key={kpi.label} variants={fadeUp} className="card" style={{ padding: "20px 18px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <kpi.icon size={17} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Outfit, sans-serif", color: kpi.color, letterSpacing: "-0.02em" }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, marginTop: 2 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart + Withdraw row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, marginBottom: 28 }}>
          {/* Bar chart */}
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Weekly Earnings</h2>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>USDC earned per day</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                <BarChart3 size={14} /> ${(parseFloat(usdcBalance) || 28).toFixed(2)} this week
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {BARS.map(b => (
                <div key={b.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", borderRadius: "4px 4px 0 0",
                    background: "linear-gradient(to top, var(--brand), var(--brand-light, #a78bfa))",
                    opacity: 0.75, height: `${b.h}%`,
                    transition: "opacity 0.2s",
                  }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")} />
                  <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600 }}>{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdraw card */}
          <div className="card" style={{ padding: "22px 20px", minWidth: 220, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Wallet size={15} style={{ color: "#059669" }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Withdraw</h2>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "#059669", letterSpacing: "-0.02em" }}>
                ${totalEarned.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 16 }}>Available USDC</div>
              <div style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                  <span>Writer earnings (85%)</span>
                  <span style={{ color: "#059669", fontWeight: 600 }}>${totalEarned.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-4)" }}>
                  <span>Gas estimate</span><span>~$0.001</span>
                </div>
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
            <p style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 8 }}>Instant on Arc</p>
          </div>
        </div>

        {/* Articles table */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Your Articles</h2>
            <Link href="/write" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>+ Publish new</Link>
          </div>

          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 10 }} />)}
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <BookOpen size={36} style={{ color: "var(--text-4)", marginBottom: 12 }} />
              <p style={{ color: "var(--text-3)", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No articles yet</p>
              <p style={{ color: "var(--text-4)", fontSize: 13, marginBottom: 20 }}>
                {READLEARC_ADDRESS ? "Publish your first article to see analytics here." : "Deploy the contract first, then publish articles."}
              </p>
              <Link href="/write" className="btn btn-primary btn-sm">Write First Article</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Article", "Reads", "Earned", "Price/Read"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Article" ? "left" : "right" }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11 }} />
                  </tr>
                </thead>
                <tbody>
                  {articles.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 16px", maxWidth: 320 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {a.title}
                        </span>
                        <span className="badge badge-neutral" style={{ marginTop: 4 }}>{a.category}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>{a.reads.toLocaleString()}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#059669" }}>${a.earned}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 13, color: "var(--text-3)" }}>${a.price}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
