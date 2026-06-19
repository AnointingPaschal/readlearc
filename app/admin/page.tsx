
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { BookOpen, DollarSign, Users, Zap, TrendingUp, Shield, RefreshCw, ExternalLink, ArrowUpRight } from "lucide-react";
import { CONTRACT_ADDRESS, USDC_ADDRESS, EXPLORER_URL, IS_CONFIGURED, fetchAllEvents, readContract, fetchUsdcBalance } from "../../lib/chain";

export default function AdminDashboard() {
  const [stats,   setStats]   = useState({ articles:0, writers:0, readers:0, revenue:0, treasury:"0.00" });
  const [events,  setEvents]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      if (!CONTRACT_ADDRESS) return;
      const c = readContract();
      const count = await c.articleCount();
      const { pub, read, ver } = await fetchAllEvents();

      const writers  = new Set((pub  as any[]).map(e=>e.args.author));
      const readers  = new Set((read as any[]).map(e=>e.args.reader));
      const revenue  = (read as any[]).reduce((s,e)=>s+parseFloat(ethers.formatUnits(e.args.price,6)),0);

      let treasury = "0.00";
      try { const owner = await c.owner(); treasury = await fetchUsdcBalance(owner); } catch {}

      setStats({ articles:Number(count), writers:writers.size, readers:readers.size, revenue, treasury });

      const all: any[] = [
        ...(pub  as any[]).map(e=>({ type:"ARTICLE_PUBLISHED", color:"var(--brand)", detail:`"${e.args.title?.slice(0,50)}"`, block:e.blockNumber, hash:e.transactionHash })),
        ...(read as any[]).map(e=>({ type:"ARTICLE_READ",      color:"#059669",      detail:`Article #${e.args.id} · $${ethers.formatUnits(e.args.price,6)} USDC`, block:e.blockNumber, hash:e.transactionHash })),
        ...(ver  as any[]).map(e=>({ type:"WRITER_VERIFIED",   color:"#0284c7",      detail:`${e.args.writer?.slice(0,14)}… · ${e.args.status?"verified":"unverified"}`, block:e.blockNumber, hash:e.transactionHash })),
      ].sort((a,b)=>b.block-a.block).slice(0,12);
      setEvents(all);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const KPI = [
    { label:"Articles",     value:stats.articles,             color:"var(--brand)", icon:BookOpen   },
    { label:"Writers",      value:stats.writers,              color:"#0284c7",      icon:Users      },
    { label:"Readers",      value:stats.readers,              color:"#7c3aed",      icon:Users      },
    { label:"Total Reads",  value:(events.filter(e=>e.type==="ARTICLE_READ")).length, color:"#d97706", icon:TrendingUp },
    { label:"Revenue",      value:`$${stats.revenue.toFixed(2)}`, color:"#059669", icon:DollarSign },
    { label:"Treasury",     value:`$${stats.treasury}`,       color:"#059669",      icon:Zap        },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Dashboard</h1>
          <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>
            {IS_CONFIGURED ? "Live from Arc blockchain" : <span style={{ color:"#dc2626", fontWeight:600 }}>⚠ Contract not configured — set env vars in Vercel</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1.5px solid var(--border)", background:"var(--bg-alt)", borderRadius:"var(--rfull)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      <div className="admin-kpi-grid">
        {KPI.map(k => (
          <div key={k.label} className="card" style={{ padding:"16px" }}>
            <k.icon size={14} style={{ color:k.color, marginBottom:8 }}/>
            {loading ? <div className="skeleton" style={{ height:26, borderRadius:5, marginBottom:6 }}/> :
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>}
            <div style={{ fontSize:11, color:"var(--text-3)", fontWeight:600, marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {/* Live activity */}
        <div className="card" style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)", fontFamily:"Outfit,sans-serif" }}>Live Activity</h2>
            <Link href="/admin/logs" style={{ fontSize:11, color:"var(--brand)", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:2 }}>All logs <ArrowUpRight size={10}/></Link>
          </div>
          {loading ? [1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:40, borderRadius:7, marginBottom:7 }}/>) :
           events.length === 0 ? <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-4)", fontSize:13 }}>{IS_CONFIGURED?"No events yet":"Contract not configured"}</div> :
           events.map((ev,i) => (
            <div key={ev.hash+i} style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"8px 0", borderBottom:i<events.length-1?"1px solid var(--border)":"none", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:9, fontWeight:700, color:ev.color }}>{ev.type}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:"#059669", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.18)", padding:"1px 5px", borderRadius:3 }}>ON-CHAIN</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.detail}</div>
                <div style={{ fontSize:9, color:"var(--text-4)", marginTop:1 }}>Block #{ev.block}</div>
              </div>
              <a href={`${EXPLORER_URL}/tx/${ev.hash}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-4)", display:"flex", flexShrink:0 }}><ExternalLink size={11}/></a>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="card" style={{ padding:"18px 20px" }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)", fontFamily:"Outfit,sans-serif", marginBottom:14 }}>Quick Actions</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {[
              { href:"/admin/content/moderation",label:"Review all articles",     color:"var(--brand)" },
              { href:"/admin/users/writers",      label:"Verify writers",          color:"#0284c7"      },
              { href:"/admin/finance/fees",       label:"Check fee splits",        color:"#059669"      },
              { href:"/admin/security",           label:"Contract ownership",      color:"#7c3aed"      },
              { href:"/admin/finance/payouts",    label:"Treasury & payouts",      color:"#d97706"      },
              { href:"/admin/logs",               label:"On-chain event logs",     color:"var(--text-3)"},
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 12px", borderRadius:"var(--r)", background:"var(--bg-alt)", border:"1px solid var(--border)", textDecoration:"none", transition:"all .15s" }}
                onMouseEnter={e=>{(e.currentTarget as any).style.borderColor="var(--border-brand)";(e.currentTarget as any).style.background="var(--brand-muted)"}}
                onMouseLeave={e=>{(e.currentTarget as any).style.borderColor="var(--border)";(e.currentTarget as any).style.background="var(--bg-alt)"}}
              >
                <span style={{ width:8, height:8, borderRadius:"50%", background:l.color, flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:600, color:"var(--text-2)", flex:1 }}>{l.label}</span>
                <ArrowUpRight size={11} style={{ color:"var(--text-4)" }}/>
              </Link>
            ))}
          </div>
          <div style={{ marginTop:14, padding:"10px 12px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:IS_CONFIGURED?"#059669":"#dc2626" }}/>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-3)" }}>{IS_CONFIGURED?"Contract connected":"Contract not configured"}</span>
            </div>
            {CONTRACT_ADDRESS && <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, fontFamily:"JetBrains Mono,monospace", color:"var(--brand)", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>{CONTRACT_ADDRESS.slice(0,16)}… <ExternalLink size={9}/></a>}
          </div>
        </div>
      </div>
    </div>
  );
}
