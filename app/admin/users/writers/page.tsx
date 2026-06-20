
"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Search, UserCheck, UserX, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL, readContract, fetchAllEvents } from "../../../../lib/chain";
import { useAuth } from "../../../../lib/auth";

export default function WritersPage() {
  const { signer, isAuth } = useAuth();
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [actioning, setActioning] = useState("");

  async function load() {
    setLoading(true);
    try {
      if (!CONTRACT_ADDRESS) return;
      const c = readContract();
      const { pub, ver } = await fetchAllEvents();
      const authorMap = new Map<string, { address:string; articles:number; verified:boolean; latestTitle:string }>();
      for (const e of pub as any[]) {
        const addr = e.args.author;
        if (!authorMap.has(addr)) authorMap.set(addr, { address:addr, articles:0, verified:false, latestTitle:"" });
        const w = authorMap.get(addr)!;
        w.articles++; w.latestTitle = e.args.title;
      }
      for (const e of ver as any[]) {
        const addr = e.args.writer;
        if (authorMap.has(addr)) authorMap.get(addr)!.verified = e.args.status;
        else if (e.args.status) authorMap.set(addr, { address:addr, articles:0, verified:true, latestTitle:"" });
      }
      // Fetch current verified status from chain
      for (const [addr, w] of authorMap) {
        try { w.verified = await c.verifiedWriters(addr); } catch {}
      }
      setWriters(Array.from(authorMap.values()).sort((a,b)=>Number(b.verified)-Number(a.verified)));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggleVerify(address: string, currentStatus: boolean) {
    if (!signer || !CONTRACT_ADDRESS) return;
    setActioning(address);
    try {
      const c  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await c.setVerifiedWriter(address, !currentStatus);
      await tx.wait();
      setWriters(ws => ws.map(w => w.address===address ? {...w, verified:!currentStatus} : w));
    } catch(e: any) { alert(e.reason||e.message); }
    finally { setActioning(""); }
  }

  const filtered = writers.filter(w => !search || w.address.toLowerCase().includes(search.toLowerCase()) || w.latestTitle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Writers</h1>
          <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>{writers.length} writers found on-chain</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1.5px solid var(--border)", background:"var(--bg-alt)", borderRadius:"var(--rfull)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>
      {!isAuth && <div style={{ padding:"10px 14px", background:"rgba(217,119,6,.06)", border:"1px solid rgba(217,119,6,.2)", borderRadius:"var(--r)", fontSize:12, color:"#d97706", fontWeight:600 }}>Connect owner wallet to verify writers</div>}
      <div style={{ position:"relative" }}>
        <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
        <input type="text" placeholder="Search by address or article title…" value={search} onChange={e=>setSearch(e.target.value)} className="input input-search" style={{ fontSize:13 }}/>
      </div>
      <div className="card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? <div style={{ padding:14 }}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:56, borderRadius:8, marginBottom:8 }}/>)}</div>
        : filtered.length === 0 ? <div style={{ padding:"40px 20px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>{writers.length===0?"No writers yet — articles must be published first.":"No matches."}</div>
        : (<table className="admin-table">
          <thead><tr><th style={{ textAlign:"left" }}>Writer</th><th style={{ textAlign:"left" }}>Articles</th><th style={{ textAlign:"left" }}>Status</th><th/></tr></thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.address}>
                <td>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"var(--text-2)" }}>{w.address.slice(0,12)}…{w.address.slice(-6)}</div>
                  {w.latestTitle && <div style={{ fontSize:11, color:"var(--text-4)", marginTop:2, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{w.latestTitle}"</div>}
                </td>
                <td style={{ fontWeight:700, color:"var(--text-2)" }}>{w.articles}</td>
                <td>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:"var(--rfull)", fontSize:10, fontWeight:700, background:w.verified?"rgba(5,150,105,.08)":"var(--bg-alt)", border:`1px solid ${w.verified?"rgba(5,150,105,.2)":"var(--border)"}`, color:w.verified?"#059669":"var(--text-4)" }}>
                    {w.verified?<><CheckCircle2 size={10}/>Verified</>:<>Standard</>}
                  </span>
                </td>
                <td style={{ textAlign:"right" }}>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button onClick={() => toggleVerify(w.address, w.verified)} disabled={!isAuth||!!actioning} style={{ padding:"5px 11px", borderRadius:"var(--rfull)", border:`1px solid ${w.verified?"rgba(220,38,38,.3)":"rgba(5,150,105,.3)"}`, background:w.verified?"rgba(220,38,38,.06)":"rgba(5,150,105,.06)", color:w.verified?"#dc2626":"#059669", fontSize:11, fontWeight:700, cursor:"pointer", opacity:actioning===w.address?.5:1, display:"flex", alignItems:"center", gap:4 }}>
                      {actioning===w.address ? <div style={{ width:10,height:10,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/> : w.verified ? <><UserX size={10}/>Unverify</> : <><UserCheck size={10}/>Verify</>}
                    </button>
                    <a href={`${EXPLORER_URL}/address/${w.address}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--brand)", textDecoration:"none", fontWeight:600, padding:"5px 8px" }}><ExternalLink size={10}/>Chain</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
