"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Info, RefreshCw } from "lucide-react";

export default function FeesConfigPage() {
  const [s,       setS]       = useState({ writer_pct:"85", platform_pct:"10", referrer_pct:"5" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    setS({ writer_pct:d.writer_pct||"85", platform_pct:d.platform_pct||"10", referrer_pct:d.referrer_pct||"5" });
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function save() {
    const sum = parseFloat(s.writer_pct)+parseFloat(s.platform_pct)+parseFloat(s.referrer_pct);
    if(Math.abs(sum-100)>0.1){ setError(`Must sum to 100% (currently ${sum.toFixed(1)}%)`); return; }
    setSaving(true); setError("");
    await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  }

  const w=parseFloat(s.writer_pct||"0"), p=parseFloat(s.platform_pct||"0"), ref=parseFloat(s.referrer_pct||"0");
  const sum = w+p+ref; const ok = Math.abs(sum-100)<0.1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:560 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Fee Splits</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Configure how payments are split between writers, platform, and referrers</p>
        </div>
        <button onClick={save} disabled={saving||!ok} className="btn btn-primary" style={{ gap:6 }}>
          {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?<><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={12}/>Save</>}
        </button>
      </div>

      {error && <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626" }}>{error}</div>}

      <div className="card" style={{ padding:"22px" }}>
        {/* Visual bar */}
        <div style={{ height:14,borderRadius:99,overflow:"hidden",display:"flex",marginBottom:20 }}>
          {[[w,"var(--accent)"],[p,"var(--brand)"],[ref,"#0284c7"]].map(([v,c],i)=>(
            <div key={i} style={{ flex:Number(v),background:String(c),transition:"flex .3s" }}/>
          ))}
        </div>
        <div style={{ display:"flex",gap:16,marginBottom:24,flexWrap:"wrap" }}>
          {[["Writer",w,"var(--accent)"],["Platform",p,"var(--brand)"],["Referrer",ref,"#0284c7"]].map(([l,v,c])=>(
            <div key={String(l)} style={{ display:"flex",alignItems:"center",gap:6 }}>
              <div style={{ width:12,height:12,borderRadius:3,background:String(c) }}/>
              <span style={{ fontSize:12,fontWeight:700,color:"var(--text-3)" }}>{l}: {Number(v).toFixed(1)}%</span>
            </div>
          ))}
          <span style={{ marginLeft:"auto",fontSize:12,fontWeight:700,color:ok?"var(--accent)":"#dc2626" }}>Total: {sum.toFixed(1)}%</span>
        </div>

        {[
          { key:"writer_pct",   label:"Writer Payout",  desc:"Goes directly to the article author", color:"var(--accent)" },
          { key:"platform_pct", label:"Platform Fee",   desc:"Readlearc platform fee",              color:"var(--brand)"  },
          { key:"referrer_pct", label:"Referrer Bonus", desc:"Bonus to whoever referred the reader",color:"#0284c7"       },
        ].map(f=>(
          <div key={f.key} style={{ marginBottom:18 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ fontSize:13,fontWeight:700,color:"var(--text)" }}>{f.label}</span>
              <div style={{ display:"flex",alignItems:"center",gap:4,width:70,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"5px 9px" }}>
                <input type="number" min="0" max="100" step="0.5" value={(s as any)[f.key]} onChange={e=>setS(prev=>({...prev,[f.key]:e.target.value}))}
                  style={{ width:"100%",border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:f.color,textAlign:"right",fontFamily:"Outfit,sans-serif" }}/>
                <span style={{ fontSize:12,fontWeight:700,color:"var(--text-4)",flexShrink:0 }}>%</span>
              </div>
            </div>
            <input type="range" min="0" max="100" step="0.5" value={parseFloat((s as any)[f.key]||"0")} onChange={e=>setS(prev=>({...prev,[f.key]:e.target.value}))} style={{ width:"100%",accentColor:f.color }}/>
            <p style={{ fontSize:11,color:"var(--text-4)",marginTop:3 }}>{f.desc}</p>
          </div>
        ))}

        <div style={{ padding:"9px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r)",display:"flex",gap:6,fontSize:11,color:"var(--text-4)" }}>
          <Info size={11} style={{ flexShrink:0,marginTop:1 }}/>These settings apply to earnings tracking. Smart contract splits need redeployment.
        </div>
      </div>
    </div>
  );
}
