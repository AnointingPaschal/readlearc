import Link from "next/link";
import { DollarSign, Percent, CreditCard, FileCode, ArrowUpRight } from "lucide-react";

const stats = [
  { label: "Fee Config",       value: "85/10/5%", sub: "writer/platform/referrer", icon: Percent,   href: "/admin/finance/fees",      color: "var(--brand)" },
  { label: "Platform Payouts", value: "USDC",     sub: "direct wallet withdrawal",  icon: CreditCard, href: "/admin/finance/payouts",   color: "#059669"      },
  { label: "Contracts",        value: "2",        sub: "deployed on Arc",           icon: FileCode,  href: "/admin/finance/contracts", color: "#0284c7"      },
];

export default function FinanceOverviewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Finance Overview</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Manage platform revenue, fee splits, and on-chain contracts.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {stats.map(s => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <s.icon size={16} style={{ color: s.color }} />
                <ArrowUpRight size={13} style={{ color: "var(--text-4)" }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
