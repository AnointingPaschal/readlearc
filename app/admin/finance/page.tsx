
"use client";
import Link from "next/link";
import { ArrowUpRight, Percent, CreditCard, FileCode } from "lucide-react";
export default function FinancePage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Finance</h1>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
        {[{ href:"/admin/finance/fees",label:"Fee Splits",icon:Percent,desc:"Live on-chain fee config" },
          { href:"/admin/finance/payouts",label:"Payouts",icon:CreditCard,desc:"Treasury & USDC" },
          { href:"/admin/finance/contracts",label:"Contracts",icon:FileCode,desc:"Deployed addresses" }].map(l => (
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
