
"use client";
import Link from "next/link";
import { ArrowUpRight, PenTool, UserCheck } from "lucide-react";
export default function UsersPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Users</h1>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
        {[{ href:"/admin/users/writers", label:"Writers", icon:PenTool, desc:"Verify writers on-chain" },
          { href:"/admin/users/readers", label:"Readers", icon:UserCheck, desc:"All reader activity" }].map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration:"none" }}>
            <div className="card card-hover" style={{ padding:"18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}><l.icon size={15} style={{ color:"var(--brand)" }}/><ArrowUpRight size={12} style={{ color:"var(--text-4)" }}/></div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{l.label}</div>
              <div style={{ fontSize:12, color:"var(--text-4)", marginTop:3 }}>{l.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
