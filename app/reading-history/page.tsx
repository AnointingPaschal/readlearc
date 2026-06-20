
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, ExternalLink, Search, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useAccount } from "wagmi";
import { fetchReadingHistory, EXPLORER_URL, type Article } from "../../lib/chain";

type Item = Article & { pricePaid: string; txHash: string; blockNumber: number };

export default function ReadingHistoryPage() {
  const { address, isConnected } = useAccount();
  const provider = null;
  const [history,   setHistory]   = useState<Item[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [refreshing,setRefreshing]= useState(false);

  async function load() {
    if (!isConnected || !address) return;
    setRefreshing(true);
    const h = await fetchReadingHistory(address, provider||undefined);
    setHistory(h); setLoading(false); setRefreshing(false);
  }
  useEffect(() => { if (isConnected) load(); else setLoading(false); }, [isConnected, address, provider]);

  if (!isConnected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <ConnectGate title="Reading History" body="Connect your wallet to see every article you've unlocked with permanent on-chain read receipts." icon={BookOpen}/>
    </div>
  );

  const filtered = history.filter(h => !search || h.title.toLowerCase().includes(search.toLowerCase()) || h.category.toLowerCase().includes(search.toLowerCase()));
  const totalSpent = history.reduce((s,h)=>s+parseFloat(h.pricePaid||"0"),0);
  const totalTime  = history.reduce((s,h)=>s+h.readTime,0);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"76px 16px 60px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:3 }}>Reading History</h1>
            <p style={{ color:"var(--text-4)", fontSize:12 }}>Permanent on-chain proof of every article unlocked</p>
          </div>
          <button onClick={load} disabled={refreshing} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
            <RefreshCw size={14} className={refreshing?"spin":""}/>
          </button>
        </div>

        {!loading && history.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:20 }}>
            {[
              { label:"Articles Read",   value:history.length.toString(), color:"var(--brand)" },
              { label:"USDC Spent",      value:`$${totalSpent.toFixed(4)}`, color:"#d97706"    },
              { label:"Reading Time",    value:`${totalTime}m`,           color:"#0284c7"       },
              { label:"On-chain Proofs", value:history.length.toString(), color:"#059669"       },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding:"14px" }}>
                <div style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:"var(--text-4)", fontWeight:600, marginTop:4, textTransform:"uppercase", letterSpacing:".05em" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div style={{ position:"relative", marginBottom:16 }}>
            <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input type="text" placeholder="Search reads…" value={search} onChange={e=>setSearch(e.target.value)} className="input input-search" style={{ fontSize:13 }}/>
          </div>
        )}

        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:90, borderRadius:14 }}/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding:"56px 24px", textAlign:"center" }}>
            <BookOpen size={34} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>{history.length===0?"No articles read yet":"No matches"}</p>
            {history.length===0 && <Link href="/explore" className="btn btn-primary btn-sm">Browse Articles</Link>}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {filtered.map((item,i) => (
              <div key={`${item.txHash}-${i}`} className="card" style={{ padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:34,height:34,borderRadius:"50%",background:"rgba(5,150,105,.08)",border:"1px solid rgba(5,150,105,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>
                    <CheckCircle2 size={16} style={{ color:"#059669" }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:6 }}>
                      <Link href={`/article/${item.id}`} style={{ fontSize:14, fontWeight:700, color:"var(--text)", textDecoration:"none", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden", lineHeight:1.35 }}>{item.title}</Link>
                      <div style={{ flexShrink:0, textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-2)" }}>-${parseFloat(item.pricePaid).toFixed(4)}</div>
                        <div style={{ fontSize:10, color:"var(--text-4)" }}>USDC</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:6 }}>
                      <span className="badge badge-brand" style={{ textTransform:"capitalize", fontSize:9 }}>{item.category}</span>
                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)" }}><Clock size={10}/>{item.readTime}m</span>
                      <Link href={`/profile/${item.authorAddress}`} style={{ fontSize:11, color:"var(--brand)", textDecoration:"none", fontFamily:"JetBrains Mono,monospace" }}>{item.authorShort}</Link>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <CheckCircle2 size={10} style={{ color:"#059669", flexShrink:0 }}/>
                      <a href={`${EXPLORER_URL}/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none", display:"flex", alignItems:"center", gap:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.txHash} <ExternalLink size={9} style={{ flexShrink:0 }}/>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:24, padding:"12px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", fontSize:11, color:"var(--text-4)", textAlign:"center" }}>
          All read receipts are permanently recorded on <strong style={{ color:"var(--brand)" }}>Arc blockchain</strong>. Your reading history is verifiable, portable, and owned by you.
        </div>
      </div>
    </div>
  );
}
