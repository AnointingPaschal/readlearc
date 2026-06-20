"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, CheckCircle2, RotateCcw } from "lucide-react";
import { useBrand } from "../../../../lib/brand";

const DEFAULTS = {
  brand_color:"#6d28d9", bg_color:"#f9f8f7", text_color:"#18181b",
  accent_color:"#059669", card_color:"#ffffff", border_color:"#e5e3e1",
  brand_name:"Readlearc", brand_tagline:"Pay per word. Own every read.",
};

const PRESETS = [
  { name:"Purple (Default)", brand_color:"#6d28d9", bg_color:"#f9f8f7", text_color:"#18181b", accent_color:"#059669", card_color:"#ffffff", border_color:"#e5e3e1" },
  { name:"Paper & Ink",      brand_color:"#1a1a1a", bg_color:"#faf7f2", text_color:"#1a1a1a", accent_color:"#c2773a", card_color:"#fffef9", border_color:"#e8e4dc" },
  { name:"Midnight Blue",    brand_color:"#1e40af", bg_color:"#0f172a", text_color:"#f1f5f9", accent_color:"#10b981", card_color:"#1e293b", border_color:"#334155" },
  { name:"Forest Green",     brand_color:"#166534", bg_color:"#f0fdf4", text_color:"#14532d", accent_color:"#ca8a04", card_color:"#ffffff", border_color:"#bbf7d0" },
  { name:"Crimson",          brand_color:"#991b1b", bg_color:"#fff7f7", text_color:"#18181b", accent_color:"#1d4ed8", card_color:"#ffffff", border_color:"#fecaca" },
  { name:"Ocean",            brand_color:"#0369a1", bg_color:"#f0f9ff", text_color:"#0c4a6e", accent_color:"#0891b2", card_color:"#ffffff", border_color:"#bae6fd" },
];

const FIELDS = [
  { key:"brand_color",   label:"Brand / Primary Color",  desc:"Main accent color — buttons, links, highlights"  },
  { key:"bg_color",      label:"Background Color",        desc:"Page background color"                          },
  { key:"text_color",    label:"Text Color",              desc:"Main text color"                                 },
  { key:"accent_color",  label:"Accent Color",            desc:"Secondary accent — success states, earnings"    },
  { key:"card_color",    label:"Card / Panel Color",      desc:"Background of cards and panels"                 },
  { key:"border_color",  label:"Border Color",            desc:"Dividers, card borders, input borders"          },
] as const;

export default function BrandingPage() {
  const { brand, setBrand } = useBrand();
  const [local,    setLocal]    = useState({ ...brand, brand_name: brand.brand_name, brand_tagline: brand.brand_tagline });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { setLocal({ ...brand, brand_name:brand.brand_name, brand_tagline:brand.brand_tagline }); }, [brand]);

  function update(key: string, value: string) {
    setLocal(prev => ({ ...prev, [key]:value }));
    setBrand({ [key]:value } as any); // live preview
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    const { name:_, ...colors } = preset;
    setLocal(prev => ({ ...prev, ...colors }));
    setBrand(colors as any);
  }

  function reset() { applyPreset(PRESETS[0]); }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await fetch("/api/brand", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(local),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setBrand(local as any);
    setSaved(true); setTimeout(()=>setSaved(false),3000);
    setSaving(false);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:640 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Brand & Colors</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>Changes apply instantly as a live preview</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={reset} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RotateCcw size={12}/>Reset
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6 }}>
            {saving?<><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:saved?<><CheckCircle2 size={12}/>Saved!</>:<><Save size={12}/>Save Brand</>}
          </button>
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:12,color:"#dc2626" }}>{error}</div>}

      {/* Presets */}
      <div className="card" style={{ padding:"18px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12 }}>Color Presets</h3>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8 }}>
          {PRESETS.map(p=>(
            <button key={p.name} onClick={()=>applyPreset(p)} style={{ padding:"10px 8px",borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",textAlign:"center",transition:"all .15s" }}
              onMouseEnter={e=>{(e.currentTarget as any).style.borderColor=p.brand_color;}}
              onMouseLeave={e=>{(e.currentTarget as any).style.borderColor="var(--border)";}}>
              <div style={{ display:"flex",justifyContent:"center",gap:4,marginBottom:6 }}>
                <div style={{ width:14,height:14,borderRadius:"50%",background:p.brand_color }}/>
                <div style={{ width:14,height:14,borderRadius:"50%",background:p.bg_color,border:"1px solid #ccc" }}/>
                <div style={{ width:14,height:14,borderRadius:"50%",background:p.accent_color }}/>
              </div>
              <div style={{ fontSize:11,fontWeight:600,color:"var(--text-2)" }}>{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Brand identity */}
      <div className="card" style={{ padding:"18px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Brand Identity</h3>
        <div style={{ display:"grid",gap:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Brand Name</label>
            <input value={(local as any).brand_name||""} onChange={e=>update("brand_name",e.target.value)} className="admin-input" placeholder="Readlearc"/>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Tagline</label>
            <input value={(local as any).brand_tagline||""} onChange={e=>update("brand_tagline",e.target.value)} className="admin-input" placeholder="Pay per word. Own every read."/>
          </div>
        </div>
      </div>

      {/* Color pickers */}
      <div className="card" style={{ padding:"18px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Colors</h3>
        <div style={{ display:"grid",gap:14 }}>
          {FIELDS.map(f=>(
            <div key={f.key} style={{ display:"flex",alignItems:"center",gap:14 }}>
              <input type="color" value={(local as any)[f.key]||"#000000"} onChange={e=>update(f.key,e.target.value)}
                style={{ width:48,height:48,border:"2px solid var(--border)",borderRadius:"var(--r)",padding:3,cursor:"pointer",flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:2 }}>{f.label}</div>
                <div style={{ fontSize:11,color:"var(--text-4)" }}>{f.desc}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"6px 10px",flexShrink:0 }}>
                <div style={{ width:14,height:14,borderRadius:4,background:(local as any)[f.key]||"transparent",border:"1px solid var(--border)" }}/>
                <input value={(local as any)[f.key]||""} onChange={e=>update(f.key,e.target.value)} maxLength={7}
                  style={{ width:72,border:"none",outline:"none",background:"transparent",fontSize:12,fontFamily:"JetBrains Mono,monospace",color:"var(--text)",fontWeight:700 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding:"18px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12 }}>Preview</h3>
        <div style={{ background:"var(--bg)",padding:"16px",borderRadius:"var(--r-lg)",border:"1px solid var(--border)" }}>
          <div style={{ display:"flex",gap:8,marginBottom:10 }}>
            <span style={{ padding:"4px 10px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,color:"var(--brand)" }}>Research</span>
            <span style={{ padding:"4px 10px",background:"var(--accent-muted)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,color:"var(--accent)" }}>$0.050 USDC</span>
          </div>
          <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",marginBottom:6 }}>On-Chain Content Monetization</h4>
          <p style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.6,marginBottom:12 }}>Traditional paywalls extract 30–70% from creators. This research examines better models.</p>
          <div style={{ display:"flex",gap:8 }}>
            <button className="btn btn-primary btn-sm">Read Article</button>
            <button className="btn btn-secondary btn-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
