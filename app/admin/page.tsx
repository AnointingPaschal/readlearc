"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  DollarSign, BookOpen, Users, Zap, TrendingUp,
  Shield, ArrowUpRight, RefreshCw, ExternalLink,
} from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI, ARC_EXPLORER, getReadProvider } from "../../lib/web3";

const QUICK_LINKS = [
  { label: "Manage all articles",   href: "/admin/content/moderation", color: "var(--brand)",  icon: BookOpen   },
  { label: "Verify writers",        href: "/admin/users/writers",       color: "#059669",      icon: Users      },
  { label: "Update fee splits",     href: "/admin/finance/fees",        color: "#0284c7",      icon: DollarSign },
  { label: "Security & ownership",  href: "/admin/security",            color: "#7c3aed",      icon: Shield     },
];

export default function AdminDashboard() {
  const [stats,  setStats]  = useState({ articles: 0, writers: 0, readers: 0, treasury: "0.00", totalReads: 0, totalRevenue: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      if (!READLEARC_ADDRESS) return;
      const prov = getReadProvider();
      const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);

      const [count, pubEvs, readEvs, verEvs] = await Promise.all([
        c.articleCount(),
        c.queryFilter(c.filters.ArticlePublished(), -100000),
        c.queryFilter(c.filters.ArticleRead(),      -100000),
        c.queryFilter(c.filters.WriterVerified(),   -100000),
      ]);

      const writers = new Set((pubEvs as any[]).map(e => e.args.author));
      const readers = new Set((readEvs as any[]).map(e => e.args.reader));

      const totalRevenue = (readEvs as any[]).reduce((s, e) => {
        return s + parseFloat(ethers.formatUnits(e.args.price, 6));
      }, 0);

      // Treasury balance (platform's share)
      let treasury = "0.00";
      if (USDC_ADDRESS) {
        try {
          const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
          // Try to read owner/treasury address first
          const owner = await c.owner();
          const bal   = await usdc.balanceOf(owner);
          treasury = parseFloat(ethers.formatUnits(bal, 6)).toFixed(4);
        } catch {}
      }

      setStats({
        articles:     Number(count),
        writers:      writers.size,
        readers:      readers.size,
        treasury,
        totalReads:   (readEvs as any[]).length,
        totalRevenue,
      });

      // Build real activity log from chain events
      const allEvents: any[] = [
        ...(pubEvs as any[]).map(e => ({
          action:  "ARTICLE_PUBLISHED",
          detail:  `"${e.args.title?.slice(0, 50)}"`,
          actor:   `${e.args.author?.slice(0,10)}…`,
          block:   e.blockNumber,
          hash:    e.transactionHash,
          chain:   true,
          color:   "var(--brand)",
          link:    `/article/${e.args.id}`,
        })),
        ...(readEvs as any[]).map(e => ({
          action:  "ARTICLE_READ",
          detail:  `Article #${e.args.id} · $${ethers.formatUnits(e.args.price, 6)} USDC`,
          actor:   `${e.args.reader?.slice(0,10)}…`,
          block:   e.blockNumber,
          hash:    e.transactionHash,
          chain:   true,
          color:   "#059669",
          link:    null,
        })),
        ...(verEvs as any[]).map(e => ({
          action:  e.args.status ? "WRITER_VERIFIED" : "WRITER_UNVERIFIED",
          detail:  `${e.args.writer?.slice(0,14)}…`,
          actor:   "Admin",
          block:   e.blockNumber,
          hash:    e.transactionHash,
          chain:   true,
          color:   "#0284c7",
          link:    `/profile/${e.args.writer}`,
        })),
      ].sort((a, b) => b.block - a.block).slice(0, 10);

      setEvents(allEvents);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const KPI = [
    { label: "Articles",      value: stats.articles,                              icon: BookOpen,    color: "var(--brand)", bg: "var(--brand-muted)"        },
    { label: "Writers",       value: stats.writers,                               icon: Users,       color: "#0284c7",    bg: "rgba(2,132,199,0.08)"       },
    { label: "Readers",       value: stats.readers,                               icon: Users,       color: "#7c3aed",    bg: "rgba(124,58,237,0.08)"      },
    { label: "Total Reads",   value: stats.totalReads,                            icon: TrendingUp,  color: "#d97706",    bg: "rgba(217,119,6,0.08)"       },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(4)}`,         icon: DollarSign,  color: "#059669",    bg: "rgba(5,150,105,0.08)"       },
    { label: "Fee Split",     value: "85/10/5",                                   icon: Zap,         color: "var(--brand)", bg: "var(--brand-muted)"        },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Platform overview · live from Arc blockchain</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
          <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="admin-kpi-grid">
        {KPI.map(k => (
          <div key={k.label} className="card" style={{ padding: "16px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            {loading
              ? <div className="skeleton" style={{ height: 28, borderRadius: 6, marginBottom: 8 }} />
              : <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
            }
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>

        {/* Live activity log */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Live Activity</h2>
            <Link href="/admin/logs" style={{ fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              All logs <ArrowUpRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6, marginBottom: 8 }} />)}</div>
          ) : events.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
              No on-chain activity yet.{" "}
              {!READLEARC_ADDRESS && <span style={{ color: "#dc2626" }}>Contract address not configured.</span>}
            </div>
          ) : (
            <div>
              {events.map((ev, i) => (
                <div key={`${ev.hash}-${i}`} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "9px 0", borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700, color: ev.color }}>{ev.action}</span>
                      <span style={{ fontSize: 9, color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>ON-CHAIN</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.detail}</div>
                    <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 1 }}>Block #{ev.block} · {ev.actor}</div>
                  </div>
                  <a href={`${ARC_EXPLORER}/tx/${ev.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-4)", display: "flex", flexShrink: 0, marginTop: 2 }}>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_LINKS.map(ql => (
              <Link key={ql.href} href={ql.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius)", background: "var(--bg-alt)", border: "1px solid var(--border)", textDecoration: "none", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-brand)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-muted)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; }}
              >
                <ql.icon size={14} style={{ color: ql.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", flex: 1 }}>{ql.label}</span>
                <ArrowUpRight size={12} style={{ color: "var(--text-4)" }} />
              </Link>
            ))}
          </div>

          {/* Contract status */}
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: READLEARC_ADDRESS ? "#059669" : "#dc2626", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>
                {READLEARC_ADDRESS ? "Contract deployed" : "Contract not configured"}
              </span>
            </div>
            {READLEARC_ADDRESS && (
              <a href={`${ARC_EXPLORER}/address/${READLEARC_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                {READLEARC_ADDRESS.slice(0,16)}… <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
