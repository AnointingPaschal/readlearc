
"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Search, ExternalLink, RefreshCw, BookOpen } from "lucide-react";
import { EXPLORER_URL, fetchAllEvents, CONTRACT_ADDRESS } from "../../../../lib/chain";

export default function ReadersPage() {
  const [readers,  setReaders]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  async function load() {
    setLoading(true);
    try {
      const { read } = await fetchAllEvents();
      const readerMap = new Map<string, { address:string; reads:number; spent:number }>();
      for (const e of read as any[]) {
        const addr = e.args.reader;
        if (!readerMap.has(addr)) readerMap.set(addr, { address:addr, reads:0, spent:0 });
        const r = readerMap.get(addr)!;
        r.reads++; r.spent += parseFloat(ethers.formatUnits(e.args.price, 6));
      }
      setReaders(Array.from(readerMap.values()).sort((a,b)=>b.reads-a.reads));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  const filtered = readers.filter(r => !search || r.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Readers</h1>
          <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>{readers.length} unique readers on-chain</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1.5px solid var(--border)", background:"var(--bg-alt)", borderRadius:"var(--rfull)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>
      <div style={{ position:"relative" }}>
        <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
        <input type="text" placeholder="Search by address…" value={search} onChange={e=>setSearch(e.target.value)} className="input input-search" style={{ fontSize:13 }}/>
      </div>
      <div className="card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? <div style={{ padding:14 }}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:50, borderRadius:7, marginBottom:8 }}/>)}</div>
        : filtered.length === 0 ? <div style={{ padding:"40px 20px", textAlign:"center" }}><BookOpen size={28} style={{ color:"var(--text-4)", marginBottom:10 }}/><p style={{ fontSize:13, color:"var(--text-4)" }}>{readers.length===0?"No reads on-chain yet.":"No matches."}</p></div>
        : (<table className="admin-table">
          <thead><tr><th style={{ textAlign:"left" }}>Wallet</th><th style={{ textAlign:"right" }}>Articles Read</th><th style={{ textAlign:"right" }}>USDC Spent</th><th/></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.address}>
                <td><span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"var(--text-2)" }}>{r.address.slice(0,14)}…{r.address.slice(-4)}</span></td>
                <td style={{ textAlign:"right", fontWeight:700, color:"var(--brand)" }}>{r.reads}</td>
                <td style={{ textAlign:"right", fontWeight:700, color:"#059669" }}>${r.spent.toFixed(4)}</td>
                <td style={{ textAlign:"right" }}><a href={`${EXPLORER_URL}/address/${r.address}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--brand)", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end" }}><ExternalLink size={10}/>Chain</a></td>
              </tr>
            ))}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
