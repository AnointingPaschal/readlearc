"use client";
import { useState, useEffect } from "react";
import { DollarSign, Users, RefreshCw, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { ethers } from "ethers";
import { USDC_ADDR, USDC_ABI } from "../../../lib/internal-wallet";

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";

interface WE { address:string; amount:number; username?:string; displayName?:string; }

export default function AdminEarningsPage() {
  const { signer, isAuth, requireAuth } = useAuth();
  const [stats,     setStats]     = useState({ totalPending:0, totalPaid:0, byWriter:[] as any[] });
  const [pending,   setPending]   = useState<WE[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState<Record<string,boolean>>({});
  const [paid,      setPaid]      = useState<Record<string,string>>({});
  const [errors,    setErrors]    = useState<Record<string,string>>({});
  const [payingAll, setPayingAll] = useState(false);
  const [period,    setPeriod]    = useState(new Date().toISOString().slice(0,7));

  async function load() {
    setLoading(true);
    const [e,p] = await Promise.all([
      fetch("/api/admin/earnings").then(r=>r.json()).catch(()=>({})),
      fetch("/api/admin/payout").then(r=>r.json()).catch(()=>[]),
    ]);
    setStats({ totalPending: e.totalPending||0, totalPaid: e.totalPaid||0, byWriter: e.byWriter||[] });
    setPending(Array.isArray(p) ? p : []);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  async function payWriter(w: WE) {
    if (!signer) { requireAuth(); return; }
    setPaying(p=>({...p,[w.address]:true})); setErrors(e=>({...e,[w.address]:""}));
    try {
      const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
      const amt  = ethers.parseUnits(w.amount.toFixed(6), 6);
      const tx   = await usdc.transfer(ethers.getAddress(w.address), amt);
      await tx.wait();
      await fetch("/api/admin/payout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({writerAddress:w.address,txHash:tx.hash,period,adminAddress:signer.address})});
      setPaid(p=>({...p,[w.address]:tx.hash}));
      load();
    } catch(e:any) { setErrors(p=>({...p,[w.address]:e.message?.slice(0,80)||"Failed"})); }
    setPaying(p=>({...p,[w.address]:false}));
  }

  async function payAll() {
    if (!signer) { requireAuth(); return; }
    setPayingAll(true);
    for (const w of pending) if (w.amount>0) await payWriter(w);
    setPayingAll(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Earnings & Payouts</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>All reader payments collect in treasury. Distribute monthly below.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
          {!isAuth && <button onClick={()=>requireAuth()} className="btn btn-primary btn-sm">Unlock Wallet to Pay</button>}
        </div>
      </div>

      {!TREASURY_ADDRESS && (
        <div style={{ padding:"11px 14px",background:"rgba(217,119,6,.07)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",fontSize:12,color:"#d97706",display:"flex",gap:8 }}>
          <AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>
          Add <code>NEXT_PUBLIC_TREASURY_ADDRESS</code> to Vercel env vars to route payments to treasury.
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
        {[
          { label:"Pending",     v:`$${stats.totalPending.toFixed(4)}`,  c:"#d97706",       icon:Clock          },
          { label:"Total Paid",  v:`$${stats.totalPaid.toFixed(4)}`,     c:"var(--accent)", icon:CheckCircle2   },
          { label:"Writers Owed",v:String(pending.length),               c:"var(--brand)",  icon:Users          },
          { label:"Treasury",    v:TREASURY_ADDRESS?"✓ Set":"✗ Missing", c:TREASURY_ADDRESS?"var(--accent)":"#dc2626", icon:DollarSign },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:6 }}>
              <s.icon size={13} style={{ color:s.c }}/>
              <span style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"Outfit,sans-serif" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Period + Pay All */}
      <div className="card" style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
        <div>
          <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:4,fontFamily:"Outfit,sans-serif" }}>Payout Period</label>
          <input type="month" value={period} onChange={e=>setPeriod(e.target.value)} style={{ padding:"7px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,color:"var(--text)",outline:"none" }}/>
        </div>
        <div style={{ flex:1 }}/>
        <button onClick={payAll} disabled={payingAll||!pending.length||!isAuth} className="btn btn-primary" style={{ fontWeight:700 }}>
          {payingAll ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Paying…</> : <><Send size={14}/>Pay All ${stats.totalPending.toFixed(4)}</>}
        </button>
      </div>

      {/* Pending payouts */}
      <div className="card" style={{ overflow:"hidden",padding:0 }}>
        <div style={{ padding:"13px 16px",borderBottom:"1px solid var(--border)",background:"var(--bg-alt)" }}>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Pending Payouts</h3>
        </div>
        {loading ? [1,2].map(i=><div key={i} className="skeleton" style={{ height:56,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !pending.length ? <div style={{ padding:"36px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>All writers have been paid!</div> :
         pending.map(w=>(
           <div key={w.address} style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
             <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(w.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(w.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
             <div style={{ flex:1,minWidth:130 }}>
               <div style={{ fontSize:13,fontWeight:700,color:"var(--text)" }}>{w.displayName||w.username||"Anonymous"}</div>
               <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{w.address.slice(0,14)}…</div>
             </div>
             <div style={{ fontFamily:"Outfit,sans-serif",fontSize:17,fontWeight:900,color:"var(--accent)",flexShrink:0 }}>${w.amount.toFixed(4)}</div>
             <div style={{ flexShrink:0 }}>
               {paid[w.address] ? (
                 <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"var(--accent)" }}><CheckCircle2 size={12}/>Paid!</span>
               ) : (
                 <button onClick={()=>payWriter(w)} disabled={!!paying[w.address]||!isAuth} className="btn btn-primary btn-sm">
                   {paying[w.address] ? <><div style={{ width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</> : <><Send size={11}/>Pay</>}
                 </button>
               )}
             </div>
             {errors[w.address] && <div style={{ width:"100%",fontSize:11,color:"#dc2626" }}>{errors[w.address]}</div>}
           </div>
         ))
        }
      </div>

      {/* All-time by writer */}
      {stats.byWriter.length > 0 && (
        <div className="card" style={{ overflow:"hidden",padding:0 }}>
          <div style={{ padding:"13px 16px",borderBottom:"1px solid var(--border)",background:"var(--bg-alt)" }}>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>All-Time Earnings</h3>
          </div>
          {stats.byWriter.map((w:any)=>(
            <div key={w.address} style={{ padding:"11px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(w.address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(w.address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
              <div style={{ flex:1,fontSize:12,fontWeight:700,color:"var(--text)" }}>{w.username||w.address.slice(0,12)+"…"}</div>
              <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                {[{l:"Pending",v:w.pending,c:"#d97706"},{l:"Paid",v:w.paid,c:"var(--accent)"},{l:"Total",v:w.total,c:"var(--text)"}].map(s=>(
                  <div key={s.l} style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9,color:"var(--text-4)",textTransform:"uppercase" }}>{s.l}</div>
                    <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:s.c }}>${s.v.toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
