"use client";
import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, DollarSign, BookOpen, Users, ArrowUpRight,
  BarChart3, Wallet, Bell, ExternalLink, ChevronUp, ChevronDown,
  Clock, Zap
} from "lucide-react";
import Navbar from "../../components/ui/Navbar";

const EARNINGS_DATA = [
  { day: "Mon", amount: 2.14 },
  { day: "Tue", amount: 3.82 },
  { day: "Wed", amount: 1.96 },
  { day: "Thu", amount: 5.44 },
  { day: "Fri", amount: 4.20 },
  { day: "Sat", amount: 6.88 },
  { day: "Sun", amount: 3.52 },
];

const ARTICLES = [
  { id: "1", title: "The Future of Decentralized Content Monetization", reads: 1240, earned: 24.8, price: 0.02, trend: "+12%", status: "LIVE" },
  { id: "2", title: "Circle CCTP: Cross-Chain USDC for the Masses", reads: 832, earned: 24.96, price: 0.03, trend: "+8%", status: "LIVE" },
  { id: "3", title: "Building With Arc: A Developer's First Look", reads: 567, earned: 22.68, price: 0.04, trend: "+3%", status: "LIVE" },
  { id: "4", title: "Understanding USDC Stability Mechanisms", reads: 214, earned: 4.28, price: 0.02, trend: "-1%", status: "DRAFT" },
];

const maxBar = Math.max(...EARNINGS_DATA.map((d) => d.amount));

export default function DashboardPage() {
  const [notifOpen, setNotifOpen] = useState(false);
  const totalEarned = ARTICLES.reduce((a, b) => a + b.earned, 0);
  const totalReads = ARTICLES.reduce((a, b) => a + b.reads, 0);
  const weekEarnings = EARNINGS_DATA.reduce((a, b) => a + b.amount, 0);

  const KPI = [
    { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, sub: "USDC all-time", icon: DollarSign, color: "#059669", bg: "rgba(5,150,105,0.08)" },
    { label: "This Week",    value: `$${weekEarnings.toFixed(2)}`, sub: "+23% vs last week", icon: TrendingUp, color: "#6d28d9", bg: "rgba(109,40,217,0.08)" },
    { label: "Total Reads",  value: totalReads.toLocaleString(), sub: "across all articles", icon: BookOpen, color: "#0284c7", bg: "rgba(2,132,199,0.08)" },
    { label: "Unique Readers", value: "1,847", sub: "wallet addresses", icon: Users, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "92px 20px 80px" }}>

        {/* Page header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 32, gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em",
            }}>
              Writer Dashboard
            </h1>
            <p style={{ color: "var(--text-4)", marginTop: 4, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              Arc Testnet · Live earnings
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  border: "1.5px solid var(--border)",
                  background: "var(--bg-card)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-3)", position: "relative",
                }}
              >
                <Bell size={16} />
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--brand)", color: "white",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>3</span>
              </button>
              {notifOpen && (
                <div className="card" style={{
                  position: "absolute", right: 0, top: 48, width: 280, zIndex: 100, padding: 0, overflow: "hidden",
                }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    Notifications
                  </div>
                  {[
                    { msg: "Article unlocked by 0x1a2b…", time: "2 min ago" },
                    { msg: "Earned $0.04 USDC from read", time: "14 min ago" },
                    { msg: "New comment on your article", time: "1 hr ago" },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: "12px 18px", borderBottom: i < 2 ? "1px solid var(--border)" : "none", fontSize: 13, color: "var(--text-2)" }}>
                      <div>{n.msg}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              + New Article
            </Link>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 24,
        }} className="kpi-grid">
          {KPI.map(kpi => (
            <div key={kpi.label} className="card" style={{ padding: "20px 18px" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: kpi.bg, border: `1px solid ${kpi.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <kpi.icon size={17} style={{ color: kpi.color }} />
              </div>
              <div style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900,
                color: kpi.color, letterSpacing: "-0.02em", lineHeight: 1,
              }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginTop: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Withdraw */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }} className="chart-row">
          {/* Earnings chart */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  Weekly Earnings
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>USDC earned per day</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart3 size={14} style={{ color: "var(--brand)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>
                  ${weekEarnings.toFixed(2)} this week
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
              {EARNINGS_DATA.map(d => (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                  <div style={{
                    flex: 1, width: "100%", display: "flex", alignItems: "flex-end",
                  }}>
                    <div
                      title={`$${d.amount}`}
                      style={{
                        width: "100%",
                        height: `${(d.amount / maxBar) * 100}%`,
                        background: "linear-gradient(to top, var(--brand), var(--brand-light))",
                        borderRadius: "6px 6px 2px 2px",
                        opacity: 0.8,
                        transition: "opacity 0.2s",
                        cursor: "default",
                        minHeight: 4,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "1"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0.8"}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdraw */}
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(5,150,105,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={15} style={{ color: "#059669" }} />
              </div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                Withdraw Earnings
              </h2>
            </div>

            <div style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 40, fontWeight: 900, color: "#059669", letterSpacing: "-0.03em", lineHeight: 1,
            }}>
              ${totalEarned.toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 4, marginBottom: 20 }}>Available USDC</div>

            <div className="card-flat" style={{ padding: "14px 16px", marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--text-3)" }}>Writer earnings (85%)</span>
                <span style={{ fontWeight: 700, color: "#059669" }}>${totalEarned.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-4)" }}>Gas fee est.</span>
                <span style={{ color: "var(--text-4)" }}>~$0.001</span>
              </div>
            </div>

            <button style={{
              width: "100%", height: 46,
              background: "#059669", color: "white",
              border: "none", borderRadius: "var(--radius)",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s ease",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#047857"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#059669"}
            >
              <ArrowUpRight size={16} /> Withdraw to Wallet
            </button>
            <p style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 10, fontFamily: "JetBrains Mono, monospace" }}>
              Instant on Arc · sign with wallet
            </p>
          </div>
        </div>

        {/* Articles section */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{
            padding: "18px 20px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              Your Articles
            </h2>
            <Link href="/write" style={{ fontSize: 13, color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
              + Publish new
            </Link>
          </div>

          {/* Desktop table */}
          <div className="articles-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Article", "Reads", "Earned", "Price", "Trend", "Status"].map((h, i) => (
                    <th key={h} style={{
                      padding: i === 0 ? "12px 20px" : "12px 14px",
                      textAlign: i === 0 ? "left" : "right",
                      fontSize: 11, fontWeight: 700, color: "var(--text-4)",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARTICLES.map((a, i) => (
                  <tr key={a.id} style={{
                    borderBottom: i < ARTICLES.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-alt)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "16px 20px", maxWidth: 300 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <Link href={`/article/${a.id}`} style={{
                          fontSize: 14, fontWeight: 600, color: "var(--text)",
                          textDecoration: "none",
                          display: "-webkit-box", WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {a.title}
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Clock size={10} style={{ color: "var(--text-4)" }} />
                          <span style={{ fontSize: 11, color: "var(--text-4)" }}>{Math.ceil(a.reads / 200)} min read</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>
                      {a.reads.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#059669" }}>
                      ${a.earned.toFixed(2)}
                    </td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 13, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
                      ${a.price}
                    </td>
                    <td style={{ padding: "16px 14px", textAlign: "right" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        fontSize: 13, fontWeight: 700,
                        color: a.trend.startsWith("+") ? "#059669" : "#ef4444",
                      }}>
                        {a.trend.startsWith("+") ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {a.trend}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: "var(--radius-full)",
                        fontWeight: 700,
                        ...(a.status === "LIVE"
                          ? { background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.2)" }
                          : { background: "var(--bg-alt)", color: "var(--text-4)", border: "1px solid var(--border)" }),
                      }}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="articles-cards" style={{ display: "none" }}>
            {ARTICLES.map((a, i) => (
              <div key={a.id} style={{
                padding: "16px 20px",
                borderBottom: i < ARTICLES.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <Link href={`/article/${a.id}`} style={{
                    fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none",
                    lineHeight: 1.4, flex: 1,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {a.title}
                  </Link>
                  <span style={{
                    flexShrink: 0, fontSize: 11, padding: "4px 10px", borderRadius: "var(--radius-full)", fontWeight: 700,
                    ...(a.status === "LIVE"
                      ? { background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.2)" }
                      : { background: "var(--bg-alt)", color: "var(--text-4)", border: "1px solid var(--border)" }),
                  }}>
                    {a.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Earned</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>${a.earned.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Reads</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)" }}>{a.reads.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Trend</div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 3,
                      color: a.trend.startsWith("+") ? "#059669" : "#ef4444",
                    }}>
                      {a.trend.startsWith("+") ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {a.trend}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Price</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>${a.price}</div>
                  </div>
                  <Link href={`/article/${a.id}`} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: "var(--brand)", fontWeight: 700, textDecoration: "none", marginLeft: "auto",
                  }}>
                    View <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
          <Zap size={10} style={{ display: "inline", marginRight: 4 }} />
          All earnings settled via Readlearc.sol on Arc Testnet
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .chart-row {
            grid-template-columns: 1fr 320px !important;
          }
        }

        @media (max-width: 640px) {
          .articles-table { display: none !important; }
          .articles-cards { display: block !important; }
        }

        @media (min-width: 641px) {
          .articles-table { display: block !important; }
          .articles-cards { display: none !important; }
        }
      `}</style>
    </div>
  );
}
