"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Search, ExternalLink } from "lucide-react";

export default function ReadersPage() {
  const [readers, setReaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/earnings").then(r=>r.json()).catch(()=>({}));
    // Get unique readers from earnings (they paid)
    const readerMap: Record<string,any> = {};
    for (const row of r.rows||[]) {
      const addr = row.reader_address;
      if (!readerMap[addr]) readerMap[addr] = { address:addr, spent:0, articles:0 };
      readerMap[addr].spent    += parseFloat(row.gross_amount||0);
      readerMap[addr].articles += 1;
    }
    setReaders(Object.values(readerMap).sort((a:any,b:any)=>b.spent-a.spent));
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = readers.filter(r => !search || r.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Readers</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>{readers.length} readers who paid for articles</p>
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
        {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:56,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !filtered.length ? <div style={{ padding:"40px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>No paid readers yet.</div> :
         filtered.map(r=>(
           <div key={r.address} style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:14 }}>
             <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(r.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(r.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
             <div style={{ flex:1,minWidth:0 }}>
               <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:600,color:"var(--text)" }}>{r.address.slice(0,14)}…{r.address.slice(-6)}</div>
               <div style={{ fontSize:10,color:"var(--text-4)",marginTop:1 }}>{r.articles} article{r.articles!==1?"s":""} unlocked</div>
             </div>
             <div style={{ textAlign:"right",flexShrink:0 }}>
               <div style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--accent)" }}>${r.spent.toFixed(4)}</div>
               <div style={{ fontSize:10,color:"var(--text-4)" }}>total spent</div>
             </div>
             <a href={`https://testnet.arcscan.app/address/${r.address}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-4)",display:"flex",flexShrink:0 }}><ExternalLink size={12}/></a>
           </div>
         ))
        }
      </div>
    </div>
  );
}
