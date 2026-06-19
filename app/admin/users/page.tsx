"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Users, PenTool, UserCheck, ArrowUpRight, BookOpen } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, getReadProvider } from "../../../lib/web3";

export default function UsersOverviewPage() {
  const [counts, setCounts] = useState({ writers: 0, readers: 0, articles: 0 });

  useEffect(() => {
    async function load() {
      if (!READLEARC_ADDRESS) return;
      try {
        const prov = getReadProvider();
        const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
        const pubEvs  = await c.queryFilter(c.filters.ArticlePublished(), -100000);
        const readEvs = await c.queryFilter(c.filters.ArticleRead(),      -100000);
        const authors  = new Set(pubEvs.map((e: any) => e.args.author));
        const readers  = new Set(readEvs.map((e: any) => e.args.reader));
        setCounts({ writers: authors.size, readers: readers.size, articles: Number(await c.articleCount()) });
      } catch {}
    }
    load();
  }, []);

  const stats = [
    { label: "Writers",  value: counts.writers,  sub: "unique authors on-chain", icon: PenTool,    href: "/admin/users/writers", color: "var(--brand)" },
    { label: "Readers",  value: counts.readers,  sub: "unique reader wallets",   icon: UserCheck,  href: "/admin/users/readers", color: "#0284c7"      },
    { label: "Articles", value: counts.articles, sub: "published on-chain",      icon: BookOpen,   href: "/admin/content/articles", color: "#059669"   },
    { label: "Admins",   value: 1,               sub: "wallet authorized",       icon: Users,      href: "/admin/security",      color: "#7c3aed"      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>User Overview</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>All user data derived from on-chain events — no external database.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
        {stats.map(s => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none", display: "block" }}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <s.icon size={16} style={{ color: s.color }} />
                <ArrowUpRight size={13} style={{ color: "var(--text-4)" }} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
