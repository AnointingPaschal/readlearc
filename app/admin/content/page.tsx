
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Flag, ArrowUpRight } from "lucide-react";
import { readContract, CONTRACT_ADDRESS } from "../../../lib/chain";

export default function ContentPage() {
  const [count, setCount] = useState<number|null>(null);
  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    readContract().articleCount().then((n: bigint) => setCount(Number(n))).catch(()=>{});
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div><h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Content</h1></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
        {[
          { href:"/admin/content/moderation", label:"All Articles",       icon:BookOpen, value:count===null?"…":count.toString(), color:"var(--brand)", desc:"manage all on-chain content" },
          { href:"/admin/logs",               label:"Activity Logs",       icon:Flag,     value:"Live",                            color:"#059669",     desc:"all chain events"           },
        ].map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration:"none" }}>
            <div className="card card-hover" style={{ padding:"18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}><c.icon size={15} style={{ color:c.color }}/><ArrowUpRight size={12} style={{ color:"var(--text-4)" }}/></div>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:26, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-2)", marginTop:6 }}>{c.label}</div>
              <div style={{ fontSize:11, color:"var(--text-4)", marginTop:2 }}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
