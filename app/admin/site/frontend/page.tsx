"use client";
import { useState, useEffect, useRef } from "react";
import { Save, CheckCircle2, Upload, X, Image as ImageIcon } from "lucide-react";

function ImageUpload({ label, desc, value, onChange }: { label:string; desc:string; value:string; onChange:(v:string)=>void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const canvas = document.createElement("canvas");
    const img    = new window.Image();
    const reader = new FileReader();
    reader.onload = ev => {
      img.onload = () => {
        const MAX = 1400;
        let { width: w, height: h } = img;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>{label}</label>
      <p style={{ fontSize:11,color:"var(--text-4)",marginBottom:8,lineHeight:1.5 }}>{desc}</p>
      {value ? (
        <div style={{ position:"relative",marginBottom:8 }}>
          <img src={value} alt="preview" style={{ width:"100%",height:100,objectFit:"cover",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",display:"block" }}/>
          <button onClick={()=>onChange("")} style={{ position:"absolute",top:6,right:6,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,.6)",border:"none",cursor:"pointer",color:"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <X size={12}/>
          </button>
        </div>
      ) : (
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>inputRef.current?.click()}
          style={{ border:`2px dashed ${dragging?"var(--brand)":"var(--border)"}`,borderRadius:"var(--r-lg)",padding:"28px 16px",textAlign:"center",cursor:"pointer",background:dragging?"var(--brand-muted)":"var(--bg-alt)",transition:"all .15s" }}>
          <ImageIcon size={24} style={{ color:"var(--text-4)",marginBottom:8 }}/>
          <p style={{ fontSize:12,fontWeight:600,color:"var(--text-3)",marginBottom:3 }}>Drop image here or click to upload</p>
          <p style={{ fontSize:10,color:"var(--text-4)" }}>JPG, PNG, WebP — auto-compressed to 1400px</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleFile(e.target.files?.[0])}/>
    </div>
  );
}

const FIELDS = [
  { key:"hero_image",   label:"Hero Background Image", desc:"Full-width image behind the hero section. Leave empty for gradient." },
  { key:"site_banner",  label:"Site Banner",           desc:"Optional banner shown below the hero. Good for promotions or announcements." },
];
const TEXT_FIELDS = [
  { key:"hero_title", label:"Hero Title",    placeholder:"Your headline text" },
  { key:"hero_sub",   label:"Hero Subtitle", placeholder:"Supporting tagline" },
  { key:"hero_cta",   label:"CTA Label",     placeholder:"Explore Articles"   },
];

export default function FrontendSettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  function get(k: string) { return settings[k] ?? ""; }
  function set(k: string, v: string) { setSettings(p => ({...p,[k]:v})); }

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    setSettings(d || {});
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setSaved(false);
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings) });
    setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Frontend Settings</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Control the public-facing homepage hero, banner images and text</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ gap:6, flexShrink:0 }}>
          {saved ? <><CheckCircle2 size={12}/>Saved!</> : saving ? "Saving…" : <><Save size={12}/>Save All</>}
        </button>
      </div>

      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:160, borderRadius:"var(--r-lg)" }}/>)
      ) : (<>

        {/* Image uploads */}
        <div className="card" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:18 }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)", marginBottom:2 }}>Images</h2>
          {FIELDS.map(f => (
            <ImageUpload key={f.key} label={f.label} desc={f.desc} value={get(f.key)} onChange={v => set(f.key, v)}/>
          ))}
        </div>

        {/* Text content */}
        <div className="card" style={{ padding:"20px" }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)", marginBottom:14 }}>Hero Text</h2>
          <p style={{ fontSize:11, color:"var(--text-4)", marginBottom:14, lineHeight:1.6 }}>
            Leave all blank to hide text overlay — shows image only.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {TEXT_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize:10, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5, fontFamily:"Outfit,sans-serif" }}>{f.label}</label>
                <input value={get(f.key)} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className="admin-input"/>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {get("hero_image") && (
          <div className="card" style={{ padding:"14px" }}>
            <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:10 }}>Hero Preview</h3>
            <div style={{ position:"relative", height:180, borderRadius:"var(--r-lg)", overflow:"hidden" }}>
              <img src={get("hero_image")} alt="hero preview" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              {(get("hero_title") || get("hero_sub")) && (
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"14px" }}>
                  {get("hero_title") && <div style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:900, color:"white", marginBottom:4 }}>{get("hero_title")}</div>}
                  {get("hero_sub")   && <div style={{ fontSize:11, color:"rgba(255,255,255,.8)", lineHeight:1.5 }}>{get("hero_sub")}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
