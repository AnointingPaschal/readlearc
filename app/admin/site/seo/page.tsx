"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Search } from "lucide-react";

export default function SEOPage() {
  const [s,      setS]      = useState<Record<string,string>>({});
  const [loading,setLoading]= useState(true);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  function get(k:string,fb="") { return s[k]??fb; }
  function set(k:string,v:string) { setS(p=>({...p,[k]:v})); }

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    setS(d||{}); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  }

  const fields = [
    { key:"seo_title",       label:"Default Page Title",   placeholder:"Readlearc — Pay per word. Own every read.", rows:1  },
    { key:"seo_description", label:"Default Meta Description",placeholder:"Pay-per-read publishing on Arc blockchain. Writers earn 85% in USDC instantly.", rows:2 },
    { key:"seo_keywords",    label:"Keywords (comma-separated)",placeholder:"web3 publishing, blockchain, usdc, arc network", rows:2 },
    { key:"og_image_url",    label:"Open Graph Image URL", placeholder:"https://yoursite.com/og-image.png", rows:1 },
    { key:"robots_txt",      label:"Robots.txt Content",   placeholder:"User-agent: *\nAllow: /\nDisallow: /admin/", rows:3 },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:600 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>SEO Settings</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>Meta tags, Open Graph, and search engine settings</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6 }}>
          {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?"Saving…":<><Save size={12}/>Save</>}
        </button>
      </div>

      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:16 }}>
          <Search size={14} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Search & Social</h2>
        </div>
        {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:48,borderRadius:"var(--r)",marginBottom:10 }}/>) :
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {fields.map(f=>(
            <div key={f.key}>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>{f.label}</label>
              {f.rows>1
                ? <textarea value={get(f.key)} onChange={e=>set(f.key,e.target.value)} rows={f.rows} placeholder={f.placeholder} className="admin-input" style={{ height:"auto",resize:"vertical" }}/>
                : <input value={get(f.key)} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} className="admin-input"/>
              }
            </div>
          ))}
        </div>}
      </div>

      {/* Preview */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Google Preview</h2>
        <div style={{ background:"white",border:"1px solid #dfe1e5",borderRadius:8,padding:"14px 16px" }}>
          <div style={{ fontSize:13,color:"#1a0dab",fontWeight:400,marginBottom:2,textDecoration:"underline",cursor:"pointer" }}>{get("seo_title","Readlearc — Pay per word. Own every read.")}</div>
          <div style={{ fontSize:11,color:"#006621",marginBottom:4 }}>readlearc.vercel.app</div>
          <div style={{ fontSize:12,color:"#545454",lineHeight:1.5 }}>{get("seo_description","Pay-per-read publishing on Arc blockchain.").slice(0,160)}</div>
        </div>
      </div>
    </div>
  );
}
