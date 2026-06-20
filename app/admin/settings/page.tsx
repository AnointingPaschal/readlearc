"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, DollarSign, Percent, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface Settings {
  article_default_price:  string;
  research_default_price: string;
  min_price:              string;
  max_price:              string;
  writer_pct:             string;
  platform_pct:           string;
  referrer_pct:           string;
}

const FIELDS = [
  { key:"article_default_price",  label:"Default Article Price",  desc:"Default price shown on the Write page for articles", unit:"USDC", type:"price" },
  { key:"research_default_price", label:"Default Research Price",  desc:"Default price for research papers",                  unit:"USDC", type:"price" },
  { key:"min_price",              label:"Minimum Price",           desc:"Minimum allowed price for any content",              unit:"USDC", type:"price" },
  { key:"max_price",              label:"Maximum Price",           desc:"Maximum allowed price for any content",              unit:"USDC", type:"price" },
  { key:"writer_pct",             label:"Writer Payout %",         desc:"Percentage of payment going to the writer",         unit:"%",    type:"pct"   },
  { key:"platform_pct",           label:"Platform Fee %",          desc:"Percentage kept by the platform",                   unit:"%",    type:"pct"   },
  { key:"referrer_pct",           label:"Referrer Fee %",          desc:"Percentage given to the referrer (if any)",         unit:"%",    type:"pct"   },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    setSettings(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    // Validate percentages sum to 100
    const w = parseFloat(settings.writer_pct || "85");
    const p = parseFloat(settings.platform_pct || "10");
    const ref = parseFloat(settings.referrer_pct || "5");
    if (Math.abs(w + p + ref - 100) > 0.01) {
      setError(`Percentages must sum to 100%. Current sum: ${(w+p+ref).toFixed(1)}%`);
      setSaving(false); return;
    }
    const r = await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify(settings),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  const w = parseFloat(settings.writer_pct||"85");
  const p = parseFloat(settings.platform_pct||"10");
  const ref = parseFloat(settings.referrer_pct||"5");
  const pctSum = w + p + ref;
  const pctOk  = Math.abs(pctSum - 100) < 0.01;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Payment Settings</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Configure default prices and fee splits for all content</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Reload
          </button>
          <button onClick={save} disabled={saving||loading||!pctOk} className="btn btn-primary" style={{ gap:6 }}>
            {saving ? <><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>
            : saved  ? <><CheckCircle2 size={13}/>Saved!</>
            : <><Save size={13}/>Save Settings</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding:"11px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",display:"flex",gap:8,fontSize:13,color:"#dc2626" }}>
          <AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>{error}
        </div>
      )}

      {/* Pricing */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:18 }}>
          <DollarSign size={15} style={{ color:"var(--accent)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)" }}>Default Prices</h2>
        </div>
        <div style={{ display:"grid", gap:14 }}>
          {FIELDS.filter(f => f.type === "price").map(f => (
            <div key={f.key}>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>
                {f.label}
              </label>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ display:"flex",alignItems:"center",gap:4,flex:1,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"9px 12px" }}
                  onFocus={(e:any)=>(e.currentTarget as any).style.borderColor="var(--brand)"}
                  onBlur={(e:any)=>(e.currentTarget as any).style.borderColor="var(--border)"}>
                  <span style={{ fontWeight:700,color:"var(--text-4)",fontSize:14 }}>$</span>
                  <input
                    type="number" step="0.001" min="0.001"
                    value={settings[f.key as keyof Settings] || ""}
                    onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:18,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif",width:"100%" }}
                    disabled={loading}
                  />
                  <span style={{ fontSize:11,fontWeight:600,color:"var(--text-4)" }}>USDC</span>
                </div>
              </div>
              <p style={{ fontSize:11,color:"var(--text-4)",marginTop:4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee splits */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Percent size={15} style={{ color:"var(--brand)" }}/>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)" }}>Payment Split</h2>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color: pctOk ? "var(--accent)" : "#dc2626", fontFamily:"Outfit,sans-serif" }}>
            Total: {pctSum.toFixed(1)}% {pctOk ? "✓" : "≠ 100%"}
          </span>
        </div>

        {/* Visual split bar */}
        <div style={{ height:12, borderRadius:"var(--r-f)", overflow:"hidden", display:"flex", marginBottom:20, gap:1 }}>
          <div style={{ flex:w, background:"var(--accent)" }} title={`Writer ${w}%`}/>
          <div style={{ flex:p, background:"var(--brand)" }} title={`Platform ${p}%`}/>
          <div style={{ flex:ref, background:"#0284c7" }} title={`Referrer ${ref}%`}/>
        </div>
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          {[{label:"Writer",c:"var(--accent)",v:w},{label:"Platform",c:"var(--brand)",v:p},{label:"Referrer",c:"#0284c7",v:ref}].map(item=>(
            <div key={item.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
              <div style={{ width:10,height:10,borderRadius:3,background:item.c }}/>
              <span style={{ fontSize:11,color:"var(--text-3)",fontWeight:600 }}>{item.label}: {item.v.toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gap:12 }}>
          {FIELDS.filter(f => f.type === "pct").map(f => (
            <div key={f.key}>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>
                {f.label}
              </label>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <input
                  type="range" min="0" max="100" step="1"
                  value={parseFloat(settings[f.key as keyof Settings]||"0")}
                  onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ flex:1, accentColor:"var(--brand)", cursor:"pointer" }}
                  disabled={loading}
                />
                <div style={{ display:"flex",alignItems:"center",gap:3,width:70,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"6px 8px" }}>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={settings[f.key as keyof Settings] || ""}
                    onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width:"100%",border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif",textAlign:"right" }}
                    disabled={loading}
                  />
                  <span style={{ fontSize:11,fontWeight:700,color:"var(--text-4)",flexShrink:0 }}>%</span>
                </div>
              </div>
              <p style={{ fontSize:10,color:"var(--text-4)",marginTop:3 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop:16,padding:"10px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r)",display:"flex",gap:8,fontSize:11,color:"var(--text-3)" }}>
          <Info size={12} style={{ flexShrink:0,marginTop:1 }}/>
          Settings affect the UI defaults. Smart contract splits require redeployment.
        </div>
      </div>
    </div>
  );
}
