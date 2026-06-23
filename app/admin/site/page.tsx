"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Globe, ToggleLeft, ToggleRight, Upload, X, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";

function LogoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handle(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const canvas = document.createElement("canvas");
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = ev => {
      img.onload = () => {
        const MAX = 400; let { width: w, height: h } = img;
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/png"));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="card" style={{ padding:"16px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
        <ImageIcon size={14} style={{ color:"var(--brand)" }}/>
        <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:800, color:"var(--text)" }}>Site Logo</h3>
      </div>
      <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:12 }}>Displayed in the navbar sitewide. PNG, SVG or WebP with transparent background works best.</p>
      {value ? (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ padding:10, background:"var(--bg-alt)", borderRadius:"var(--r)", border:"1px solid var(--border)" }}>
            <img src={value} alt="logo preview" style={{ height:44, width:"auto", maxWidth:180, display:"block", objectFit:"contain" }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button onClick={() => onChange("")}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"rgba(220,38,38,.08)", border:"1px solid rgba(220,38,38,.2)", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"#dc2626" }}>
              <X size={12}/> Remove Logo
            </button>
            <label style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"var(--brand-muted)", border:"1px solid var(--brand-border)", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"var(--brand)" }}>
              <Upload size={12}/> Replace
              <input type="file" accept="image/*,image/svg+xml" style={{ display:"none" }} onChange={e => handle(e.target.files?.[0])}/>
            </label>
          </div>
        </div>
      ) : (
        <label
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
          style={{ display:"block", border:"2px dashed var(--border)", borderRadius:"var(--r-lg)", padding:"24px", textAlign:"center", cursor:"pointer", background:"var(--bg-alt)", transition:"border-color .15s" }}>
          <Upload size={24} style={{ color:"var(--text-4)", marginBottom:8 }}/>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-3)", marginBottom:4 }}>Drop logo here or click to upload</div>
          <div style={{ fontSize:11, color:"var(--text-4)" }}>PNG, SVG or WebP — max height 400px</div>
          <input ref={ref} type="file" accept="image/*,image/svg+xml" style={{ display:"none" }} onChange={e => handle(e.target.files?.[0])}/>
        </label>
      )}
    </div>
  );
}

const FIELDS = [
  { key:"site_name",         label:"Site Name",         placeholder:"Readlearc",                        type:"text"   },
  { key:"site_tagline",      label:"Tagline",           placeholder:"Pay per word. Own every read.",     type:"text"   },
  { key:"site_description",  label:"Meta Description",  placeholder:"Pay-per-read publishing on Arc…",  type:"textarea"},
  { key:"site_url",          label:"Site URL",          placeholder:"https://readlearc.vercel.app",     type:"text"   },
  { key:"support_email",     label:"Support Email",     placeholder:"support@readlearc.com",            type:"email"  },
  { key:"twitter_handle",    label:"Twitter / X Handle",placeholder:"@readlearc",                       type:"text"   },
];

const TOGGLES = [
  { key:"maintenance_mode", label:"Maintenance Mode",   desc:"Disable public access while you work on the site" },
  { key:"allow_signups",    label:"Allow New Wallets",  desc:"Let new users create wallets on the platform"      },
  { key:"require_approval", label:"Require Approval",   desc:"All articles need admin approval before going live" },
];

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  function get(key:string,fb="") { return settings[key]??fb; }
  function set(key:string,v:string) { setSettings(p=>({...p,[key]:v})); }

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    setSettings(d||{});
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(settings)});
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),3000);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:600 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Site Settings</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>General site configuration and feature toggles</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6 }}>
          {saved?<><CheckCircle2 size={12}/>Saved!</>:saving?<><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={12}/>Save</>}
        </button>
      </div>

      {loading ? [1,2].map(i=><div key={i} className="skeleton" style={{ height:180,borderRadius:"var(--r-lg)" }}/>) : (<>
      <LogoUpload
        value={get("brand_logo")}
        onChange={v => { set("brand_logo", v); fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({brand_logo:v})}).catch(()=>{}); }}
      />
      {/* Text fields */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:16 }}>
          <Globe size={14} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>General</h2>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {FIELDS.map(f=>(
            <div key={f.key}>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>{f.label}</label>
              {f.type==="textarea"
                ? <textarea value={get(f.key)} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} rows={2} className="admin-input" style={{ height:"auto",resize:"none" }}/>
                : <input type={f.type} value={get(f.key)} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} className="admin-input"/>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:16 }}>Feature Toggles</h2>
        {TOGGLES.map(t=>(
          <div key={t.key} style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,paddingBottom:14,marginBottom:14,borderBottom:"1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:3 }}>{t.label}</div>
              <div style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.55 }}>{t.desc}</div>
            </div>
            <button onClick={()=>set(t.key, get(t.key)==="true"?"false":"true")} style={{ background:"none",border:"none",cursor:"pointer",color:get(t.key)==="true"?"var(--accent)":"var(--text-4)",padding:0,flexShrink:0 }}>
              {get(t.key)==="true"?<ToggleRight size={34}/>:<ToggleLeft size={34}/>}
            </button>
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}
