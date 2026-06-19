"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { DollarSign, BookOpen, Users, Zap, TrendingUp, AlertTriangle, Shield, ArrowUpRight, RefreshCw } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI, getReadProvider, ARC_EXPLORER } from "../../lib/web3";

const QUICK_LINKS = [
  { label: "Moderate flagged content", href: "/admin/content/moderation", color: "var(--c-red,#dc2626)",    icon: AlertTriangle },
  { label: "Manage fee splits",        href: "/admin/finance/fees",       color: "var(--brand)",            icon: DollarSign   },
  { label: "Contract registry",        href: "/admin/finance/contracts",  color: "var(--c-blue,#0284c7)",   icon: Shield       },
  { label: "Writer verification",      href: "/admin/users/writers",      color: "var(--c-green,#059669)",  icon: Users        },
];

const ACTIVITY_LOG = [
  { action: "FEE_SPLIT_CHANGED",  actor: "super@readlearc.io", time: "2 hr ago",  chain: true  },
  { action: "WRITER_VERIFIED",    actor: "admin@readlearc.io", time: "5 hr ago",  chain: true  },
  { action: "ARTICLE_REMOVED",    actor: "mod@readlearc.io",   time: "1 day ago", chain: true  },
  { action: "AI_KEY_ROTATED",     actor: "super@readlearc.io", time: "2 day ago", chain: false },
  { action: "CONTENT_FEATURED",   actor: "mod@readlearc.io",   time: "3 day ago", chain: false },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ articles: 0, treasury: "0.00", loading: true });

  useEffect(() => {
    async function load() {
      try {
        if (!READLEARC_ADDRESS) return;
        const prov = getReadProvider();
        const c = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
        const count = await c.articleCount();
        let treasury = "0.00";
        if (USDC_ADDRESS) {
          const u = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
          const bal = await u.balanceOf(/* platform treasury placeholder */ ethers.ZeroAddress);
          treasury = parseFloat(ethers.formatUnits(bal, 6)).toFixed(2);
        }
        setStats({ articles: Number(count), treasury, loading: false });
      } catch { setStats(s => ({ ...s, loading: false })); }
    }
    load();
  }, []);

  const KPI = [
    { label: "Articles On-Chain", value: stats.loading ? "…" : stats.articles.toString(), sub: "from blockchain", icon: BookOpen,  color: "var(--brand)",          bg: "var(--brand-muted)"         },
    { label: "Platform Treasury", value: `$${stats.treasury}`, sub: "USDC on Arc",         icon: DollarSign,  color: "#059669",                bg: "rgba(5,150,105,0.08)"       },
    { label: "Fee Split",         value: "85/10/5",             sub: "writer/platform/ref", icon: TrendingUp,  color: "#0284c7",                bg: "rgba(2,132,199,0.08)"       },
    { label: "Contract Status",   value: "LIVE",                sub: "Arc Testnet",          icon: Shield,      color: "#059669",                bg: "rgba(5,150,105,0.08)"       },
    { label: "Moderation Queue",  value: "2",                   sub: "items pending",        icon: AlertTriangle, color: "#dc2626",              bg: "rgba(220,38,38,0.08)"       },
    { label: "Network",           value: "Arc",                 sub: "Circle USDC L1",       icon: Zap,         color: "#d97706",                bg: "rgba(217,119,6,0.08)"       },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
        <p style={{ color: "var(--text-4)", fontSize: 13, marginTop: 4 }}>Platform overview · Readlearc Protocol</p>
      </div>

      {/* KPIs */}
      <div className="admin-kpi-grid">
        {KPI.map(k => (
          <div key={k.label} className="card" style={{ padding: "16px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <k.icon size={15} style={{ color: k.color }} />
            </div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
        {/* Activity log */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Recent Activity</h2>
            <Link href="/admin/logs" style={{ fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>View all <ArrowUpRight size={12} /></Link>
          </div>
          <div>
            {ACTIVITY_LOG.map((log, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: i < ACTIVITY_LOG.length - 1 ? "1px solid var(--border)" : "none", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "var(--brand)" }}>{log.action}</span>
                    {log.chain && <span style={{ fontSize: 9, fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", padding: "1px 5px", borderRadius: 4 }}>ON-CHAIN</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{log.actor} · {log.time}</div>
                </div>
                <Link href="/admin/logs"><ArrowUpRight size={12} style={{ color: "var(--text-4)", marginTop: 2 }} /></Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_LINKS.map(ql => (
              <Link key={ql.href} href={ql.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-alt)", border: "1px solid var(--border)", textDecoration: "none", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-brand)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-muted)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; }}
              >
                <ql.icon size={15} style={{ color: ql.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", flex: 1 }}>{ql.label}</span>
                <ArrowUpRight size={13} style={{ color: "var(--text-4)" }} />
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              <span style={{ color: "var(--text-3)", fontWeight: 600 }}>Contract deployed · Arc Testnet</span>
            </div>
            <a href={`${ARC_EXPLORER}/address/${READLEARC_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              {READLEARC_ADDRESS?.slice(0,14) || "Not deployed"}… <ArrowUpRight size={9} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
