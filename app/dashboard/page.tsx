
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, DollarSign, Clock, CheckCircle2, ArrowRight, PenLine, History, Wallet, RefreshCw } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useAccount } from "wagmi";
import { fetchReadingHistory, type Article } from "../../lib/chain";

type HistoryItem = Article & { pricePaid: string; txHash: string; blockNumber: number };

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const shortAddress = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";
  const usdcBalance = "—";
  const provider = null;
  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!isConnected || !address) return;
    setRefreshing(true);
    const h = await fetchReadingHistory(address, provider||undefined);
    setHistory(h); setLoading(false); setRefreshing(false);
  }

  useEffect(() => { if (isConnected) load(); else setLoading(false); }, [isConnected, address, provider]);

  if (!isConnected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <ConnectGate title="Your Reading Dashboard" body="Connect your wallet to see your reading history, USDC spent, and on-chain read receipts." icon={BookOpen} />
    </div>
  );

  const totalSpent = history.reduce((s,h) => s + parseFloat(h.pricePaid||"0"), 0);
  const totalTime  = history.reduce((s,h) => s + h.readTime, 0);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"76px 16px 60px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>Reading Dashboard</h1>
            <p style={{ color:"var(--text-4)", fontSize:12 }}>{shortAddress} · your on-chain reading record</p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={load} disabled={refreshing} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              <RefreshCw size={14} className={refreshing?"spin":""}/>
            </button>
            <Link href="/creator" className="btn btn-ghost btn-sm"><PenLine size={13}/>Creator Studio</Link>
            <Link href="/explore"  className="btn btn-primary btn-sm" style={{ fontWeight:700 }}>Browse Articles</Link>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
          {[
            { label:"Articles Read",  value: loading?"…":history.length.toString(),              color:"var(--brand)" },
            { label:"USDC Spent",     value: loading?"…":`$${totalSpent.toFixed(4)}`,            color:"#d97706"      },
            { label:"Reading Time",   value: loading?"…":`${totalTime}m`,                        color:"#0284c7"      },
            { label:"USDC Balance",   value: `$${usdcBalance}`,                                  color:"#059669"      },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding:"16px" }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,24px)", fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11, color:"var(--text-3)", fontWeight:600, marginTop:5 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:10, marginBottom:28 }}>
          {[
            { href:"/reading-history", icon:History, label:"Reading History",  sub:"All read receipts" },
            { href:"/wallet",          icon:Wallet,  label:"My Wallet",        sub:"USDC & transactions" },
            { href:"/explore",         icon:BookOpen,label:"Explore",          sub:"Discover articles" },
            { href:"/creator",         icon:PenLine, label:"Creator Studio",   sub:"Publish & earn" },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ textDecoration:"none" }}>
              <div className="card card-hover" style={{ padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:30,height:30,borderRadius:8,background:"var(--bg-alt)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <l.icon size={14} style={{ color:"var(--brand)" }}/>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:1 }}>{l.label}</div>
                  <div style={{ fontSize:11, color:"var(--text-4)" }}>{l.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent reads */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)" }}>Recent Reads</h2>
          <Link href="/reading-history" style={{ fontSize:12, color:"var(--brand)", fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>View all <ArrowRight size={12}/></Link>
        </div>

        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:64, borderRadius:14 }}/>)}</div>
        ) : history.length === 0 ? (
          <div className="card" style={{ padding:"40px 20px", textAlign:"center" }}>
            <BookOpen size={32} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:8 }}>No articles read yet</p>
            <Link href="/explore" className="btn btn-primary btn-sm">Browse Articles</Link>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {history.slice(0,5).map((h,i) => (
              <Link key={i} href={`/article/${h.id}`} style={{ textDecoration:"none" }}>
                <div className="card card-hover" style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(5,150,105,.08)",border:"1px solid rgba(5,150,105,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <CheckCircle2 size={15} style={{ color:"#059669" }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.title}</div>
                    <div style={{ fontSize:11, color:"var(--text-4)", display:"flex", gap:8, marginTop:1 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={9}/>{h.readTime}m</span>
                      <span>${parseFloat(h.pricePaid).toFixed(4)} USDC paid</span>
                    </div>
                  </div>
                  <ArrowRight size={13} style={{ color:"var(--text-4)", flexShrink:0 }}/>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
