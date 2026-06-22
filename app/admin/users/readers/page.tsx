"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Search, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ReadersPage() {
  const [readers, setReaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  async function load() {
    setLoading(true);
    // Pull from read_receipts — every paid article unlock
    const r = await fetch("/api/admin/readers").then(r=>r.json()).catch(()=>[]);
    setReaders(Array.isArray(r) ? r : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = readers.filter(r => !search || r.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Readers</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>{readers.length} readers who unlocked articles</p>
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
        <div style={{ padding:"11px 16px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 80px 80px 80px",gap:10,fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em" }}>
          <span>Reader</span><span style={{ textAlign:"right" }}>Articles</span><span style={{ textAlign:"right" }}>Spent</span><span style={{ textAlign:"right" }}>Explorer</span>
        </div>
        {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:52,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !filtered.length ? (
           <div style={{ padding:"40px",textAlign:"center" }}>
             <BookOpen size={28} style={{ color:"var(--text-4)",marginBottom:10 }}/>
             <p style={{ fontSize:14,color:"var(--text-3)" }}>No paid readers yet.</p>
             <p style={{ fontSize:11,color:"var(--text-4)",marginTop:4 }}>Readers appear here after they unlock articles with USDC.</p>
           </div>
         ) : filtered.map(r=>(
           <div key={r.address} style={{ padding:"11px 16px",borderBottom:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 80px 80px 80px",gap:10,alignItems:"center" }}>
             <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
               <div style={{ width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(r.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(r.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
               <div style={{ minWidth:0 }}>
                 <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.address.slice(0,10)}…{r.address.slice(-6)}</div>
                 <Link href={`/profile/${r.address}`} style={{ fontSize:10,color:"var(--brand)",textDecoration:"none" }}>View profile</Link>
               </div>
             </div>
             <div style={{ textAlign:"right",fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>{r.articles}</div>
             <div style={{ textAlign:"right",fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--accent)" }}>${r.spent.toFixed(4)}</div>
             <div style={{ textAlign:"right" }}>
               <a href={`https://testnet.arcscan.app/address/${r.address}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-4)",display:"inline-flex" }}><ExternalLink size={12}/></a>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}
