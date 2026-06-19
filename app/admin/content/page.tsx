"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BookOpen, Flag, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, getReadProvider } from "../../../lib/web3";

export default function ContentOverviewPage() {
  const [counts, setCounts] = useState({ articles: 0, flagged: 2 });

  useEffect(() => {
    if (!READLEARC_ADDRESS) return;
    const prov = getReadProvider();
    const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
    c.articleCount().then((n: bigint) => setCounts(cc => ({ ...cc, articles: Number(n) }))).catch(() => {});
  }, []);

  const cards = [
    { href: "/admin/content/articles",   label: "Articles",        value: counts.articles, sub: "published on-chain",  icon: BookOpen,    color: "var(--brand)" },
    { href: "/admin/content/moderation", label: "Moderation Queue", value: counts.flagged,  sub: "items pending review", icon: Flag,        color: "#dc2626"      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Content Overview</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Manage articles and content moderation</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <c.icon size={16} style={{ color: c.color }} />
                <ArrowUpRight size={13} style={{ color: "var(--text-4)" }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 28, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginTop: 6 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
