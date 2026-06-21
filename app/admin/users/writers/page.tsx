"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink, Search, TrendingUp, DollarSign, BookOpen } from "lucide-react";

export default function WritersPage() {
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  async function load() {
    setLoading(true);
    const [artRes, earnRes] = await Promise.all([
      fetch("/api/admin/articles?limit=200").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/earnings").then(r=>r.json()).catch(()=>({})),
    ]);
    const arts = Array.isArray(artRes) ? artRes : [];
    const byWriter: Record<string,any> = {};
    for (const a of arts) {
      const addr = a.authorAddress;
      if (!byWriter[addr]) byWriter[addr] = { address:addr, short:a.authorShort, articles:0, reads:0, pending:0 };
      byWriter[addr].articles++;
      byWriter[addr].reads += a.reads||0;
    }
    for (const e of (earnRes.byWriter||[])) {
      if (byWriter[e.address]) byWriter[e.address].pending = e.pending||0;
      else byWriter[e.address] = { address:e.address, short:e.address.slice(0,6)+"…"+e.address.slice(-4), articles:0, reads:0, pending:e.pending||0 };
    }
    setWriters(Object.values(byWriter).sort((a:any,b:any)=>b.articles-a.articles));
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  const filtered = writers.filter(w => !search || w.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Writers</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>{writers.length} total writers</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={12} className={loading?"spin":""}/>Refresh
        </button>
      </div>
      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by address…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>
      <div className="card" style={{ overflow:"hidden",padding:0 }}>
        <div style={{ padding:"12px 16px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:16,fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em" }}>
          <span>Writer</span><span>Articles</span><span>Reads</span><span>Pending</span>
        </div>
        {loading ? [1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:56,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !filtered.length ? <div style={{ padding:"40px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>No writers yet.</div> :
         filtered.map(w=>(
           <div key={w.address} style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:16,alignItems:"center" }}>
             <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
               <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(w.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(w.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
               <div style={{ minWidth:0 }}>
                 <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{w.short}</div>
                 <div style={{ display:"flex",gap:8,marginTop:3 }}>
                   <Link href={`/profile/${w.address}`} style={{ fontSize:10,color:"var(--brand)",textDecoration:"none" }}>Profile</Link>
                   <a href={`https://testnet.arcscan.app/address/${w.address}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:"var(--text-4)",textDecoration:"none",display:"flex",alignItems:"center",gap:2 }}>Explorer<ExternalLink size={8}/></a>
                 </div>
               </div>
             </div>
             <div style={{ textAlign:"right" }}>
               <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--brand)" }}>{w.articles}</div>
               <div style={{ fontSize:10,color:"var(--text-4)" }}>articles</div>
             </div>
             <div style={{ textAlign:"right" }}>
               <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--text)" }}>{w.reads.toLocaleString()}</div>
               <div style={{ fontSize:10,color:"var(--text-4)" }}>reads</div>
             </div>
             <div style={{ textAlign:"right" }}>
               <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--accent)" }}>${w.pending.toFixed(4)}</div>
               <div style={{ fontSize:10,color:"var(--text-4)" }}>pending</div>
             </div>
           </div>
         ))
        }
      </div>
    </div>
  );
}
