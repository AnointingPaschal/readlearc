"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Zap } from "lucide-react";
import { useBrand } from "../../../../lib/brand";

export default function SiteBrandingPage() {
  const { brand, setBrand } = useBrand();
  const [local,  setLocal]  = useState({ ...brand });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(()=>{ setLocal({...brand}); },[brand]);

  function update(key:string,v:string) {
    setLocal(p=>({...p,[key]:v}));
    setBrand({[key]:v} as any);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/brand",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(local)});
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  }

  const COLORS = [
    { key:"brand_color",  label:"Brand / Primary",   desc:"Buttons, links, accents"       },
    { key:"bg_color",     label:"Background",         desc:"Page background"               },
    { key:"text_color",   label:"Text",               desc:"Main text color"               },
    { key:"accent_color", label:"Accent",             desc:"Success, earnings, highlights" },
    { key:"card_color",   label:"Card Background",    desc:"Cards and panels"              },
    { key:"border_color", label:"Border",             desc:"Dividers and outlines"         },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:600 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Site Branding</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>Logo text and color scheme. Changes preview instantly.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6 }}>
          {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?"Saving…":<><Save size={12}/>Save</>}
        </button>
      </div>

      {/* Logo */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          <Zap size={14} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Logo & Identity</h2>
        </div>
        <div style={{ display:"grid",gap:10 }}>
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

      {/* Colors */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:16 }}>Colors <span style={{ fontSize:11,color:"var(--text-4)",fontWeight:400 }}>— live preview</span></h2>
        <div style={{ display:"grid",gap:14 }}>
          {COLORS.map(c=>(
            <div key={c.key} style={{ display:"flex",alignItems:"center",gap:14 }}>
              <input type="color" value={(local as any)[c.key]||"#000"} onChange={e=>update(c.key,e.target.value)}
                style={{ width:46,height:46,border:"2px solid var(--border)",borderRadius:"var(--r)",padding:3,cursor:"pointer",flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:2 }}>{c.label}</div>
                <div style={{ fontSize:11,color:"var(--text-4)" }}>{c.desc}</div>
              </div>
              <input value={(local as any)[c.key]||""} onChange={e=>update(c.key,e.target.value)} maxLength={7}
                style={{ width:78,padding:"6px 8px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:11,fontFamily:"JetBrains Mono,monospace",color:"var(--text)",outline:"none",fontWeight:700 }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
