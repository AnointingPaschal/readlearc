"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, CheckCircle2, Eye, EyeOff, Brain, DollarSign, Percent, Info, AlertCircle, ExternalLink } from "lucide-react";

const AI_PROVIDERS = [
  { id:"openrouter", label:"OpenRouter", docsUrl:"https://openrouter.ai/keys", note:"300+ models · one key", models:[
    "anthropic/claude-haiku-4-5","anthropic/claude-sonnet-4-5","anthropic/claude-opus-4-5",
    "openai/gpt-4o-mini","openai/gpt-4o",
    "meta-llama/llama-3.1-8b-instruct:free","meta-llama/llama-3.3-70b-instruct",
    "google/gemini-flash-1.5","google/gemini-pro-1.5",
    "deepseek/deepseek-chat","mistralai/mixtral-8x7b-instruct",
    "x-ai/grok-beta",
  ]},
  { id:"anthropic", label:"Anthropic",   docsUrl:"https://console.anthropic.com", note:"", models:["claude-haiku-4-5-20251001","claude-sonnet-4-6","claude-opus-4-6"] },
  { id:"openai",    label:"OpenAI",      docsUrl:"https://platform.openai.com/api-keys", note:"", models:["gpt-4o-mini","gpt-4o","gpt-4-turbo","gpt-3.5-turbo"] },
  { id:"gemini",    label:"Gemini",      docsUrl:"https://aistudio.google.com/app/apikey", note:"Free tier", models:["gemini-1.5-flash","gemini-1.5-pro","gemini-2.0-flash"] },
  { id:"groq",      label:"Groq",        docsUrl:"https://console.groq.com/keys", note:"Free tier", models:["llama-3.1-8b-instant","llama-3.3-70b-versatile","mixtral-8x7b-32768"] },
  { id:"deepseek",  label:"DeepSeek",    docsUrl:"https://platform.deepseek.com", note:"Cheap", models:["deepseek-chat","deepseek-reasoner"] },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");
  const [showKey,  setShowKey]  = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testMsg,  setTestMsg]  = useState<{ok:boolean;msg:string}|null>(null);

  function get(key: string, fallback = "") { return settings[key] ?? fallback; }
  function set(key: string, value: string) { setSettings(prev => ({ ...prev, [key]: value })); }

  async function load() {
    setLoading(true); setError("");
    const r = await fetch("/api/admin/settings");
    if (!r.ok) { setError("Failed to load settings"); setLoading(false); return; }
    const d = await r.json();
    setSettings(d || {});
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // When provider changes, set first model for that provider
  function onProviderChange(pid: string) {
    const p = AI_PROVIDERS.find(x => x.id === pid);
    set("ai_provider", pid);
    if (p) set("ai_model", p.models[0]);
    setTestMsg(null);
  }

  async function save() {
    const w = parseFloat(get("writer_pct","85"));
    const p = parseFloat(get("platform_pct","10"));
    const ref = parseFloat(get("referrer_pct","5"));
    if (Math.abs(w+p+ref-100) > 0.1) { setError(`Fee splits must sum to 100% (currently ${(w+p+ref).toFixed(1)}%)`); return; }

    setSaving(true); setError(""); setSaved(false);
    const r = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(settings),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Save failed"); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  async function testAI() {
    setTesting(true); setTestMsg(null);
    // Save first so the test reads fresh values
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings) });
    const r = await fetch("/api/admin/ai-test");
    const d = await r.json();
    setTestMsg(d.ok ? { ok:true, msg:`✓ Connected · ${get("ai_provider")} / ${get("ai_model")}` } : { ok:false, msg: d.error });
    setTesting(false);
  }

  const currentProvider = AI_PROVIDERS.find(p => p.id === get("ai_provider","openrouter")) || AI_PROVIDERS[0];
  const w = parseFloat(get("writer_pct","85")), p = parseFloat(get("platform_pct","10")), ref = parseFloat(get("referrer_pct","5"));
  const pctSum = w+p+ref;
  const pctOk  = Math.abs(pctSum-100) < 0.1;

  if (loading) return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div className="skeleton" style={{ height:32,width:200,borderRadius:"var(--r)" }}/>
      {[180,240,200,160].map((h,i) => <div key={i} className="skeleton" style={{ height:h,borderRadius:"var(--r-lg)" }}/>)}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Settings</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>AI model, treasury wallet, prices and fee splits</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12}/>Reload
          </button>
          <button onClick={save} disabled={saving || !pctOk} className="btn btn-primary" style={{ gap:6 }}>
            {saving ? <><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>
            : saved  ? <><CheckCircle2 size={12}/>Saved!</>
            : <><Save size={12}/>Save All</>}
          </button>
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8 }}><AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>{error}</div>}

      {/* ── Treasury ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:14 }}>
          <DollarSign size={15} style={{ color:"var(--accent)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Treasury Wallet</h2>
        </div>
        <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>Wallet Address</label>
        <input
          value={get("treasury_address")}
          onChange={e => set("treasury_address", e.target.value)}
          placeholder="0x... — all payments collect here until monthly payout"
          className="admin-input"
          style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12 }}
        />
        <p style={{ fontSize:11,color:"var(--text-4)",marginTop:6,lineHeight:1.65 }}>
          All reader payments go to this wallet. Distribute to writers monthly from <strong>Earnings & Payouts</strong>. Leave empty to pay writers directly.
        </p>
      </div>

      {/* ── AI Model ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:16 }}>
          <Brain size={15} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>AI Content Analysis</h2>
        </div>

        {/* Provider */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:8,fontFamily:"Outfit,sans-serif" }}>Provider</label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7 }}>
            {AI_PROVIDERS.map(prov => (
              <button key={prov.id} onClick={() => onProviderChange(prov.id)}
                style={{ padding:"10px 8px",borderRadius:"var(--r)",border:`1.5px solid ${get("ai_provider","openrouter")===prov.id?"var(--brand)":"var(--border)"}`,background:get("ai_provider","openrouter")===prov.id?"var(--brand-muted)":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s" }}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:get("ai_provider","openrouter")===prov.id?"var(--brand)":"var(--text-2)",marginBottom:prov.note?2:0 }}>{prov.label}</div>
                {prov.note && <div style={{ fontSize:9,color:"var(--accent)",fontWeight:600 }}>{prov.note}</div>}
              </button>
            ))}
          </div>
          <a href={currentProvider.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3,marginTop:7 }}>
            Get {currentProvider.label} API key <ExternalLink size={9}/>
          </a>
        </div>

        {/* Model */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>Model</label>
          <select value={get("ai_model", currentProvider.models[0])} onChange={e => set("ai_model", e.target.value)}
            style={{ width:"100%",padding:"9px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,color:"var(--text)",outline:"none",cursor:"pointer",fontFamily:"JetBrains Mono,monospace" }}>
            {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* API Key */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>API Key</label>
          <div style={{ position:"relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={get("ai_api_key")}
              onChange={e => set("ai_api_key", e.target.value)}
              placeholder={`${currentProvider.label} API key`}
              className="admin-input"
              style={{ paddingRight:42, fontFamily:"JetBrains Mono,monospace", fontSize:12 }}
            />
            <button onClick={() => setShowKey(v => !v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}>
              {showKey ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          {get("ai_api_key") && <p style={{ fontSize:10,color:"var(--accent)",marginTop:4,fontWeight:600 }}>✓ API key set</p>}
        </div>

        {/* Test */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <button onClick={testAI} disabled={testing || !get("ai_api_key")} className="btn btn-secondary btn-sm">
            {testing ? <><div style={{ width:11,height:11,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%"}} className="spin"/>Testing…</> : "Test Connection"}
          </button>
          {testMsg && <span style={{ fontSize:12,fontWeight:600,color:testMsg.ok?"var(--accent)":"#dc2626" }}>{testMsg.msg}</span>}
        </div>
      </div>

      {/* ── Prices ── */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)",marginBottom:14 }}>Default Prices</h2>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[
            { key:"article_default_price",  label:"Article Default" },
            { key:"research_default_price", label:"Research Default" },
            { key:"min_price",              label:"Minimum Price"    },
            { key:"max_price",              label:"Maximum Price"    },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>{f.label}</label>
              <div style={{ display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"8px 10px" }}>
                <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                <input type="number" step="0.001" min="0" value={get(f.key,"0.020")} onChange={e => set(f.key, e.target.value)}
                  style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:16,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif" }}/>
                <span style={{ fontSize:10,color:"var(--text-4)",fontWeight:600 }}>USDC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fee Splits ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <Percent size={15} style={{ color:"var(--brand)" }}/>
            <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Payment Split</h2>
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:pctOk?"var(--accent)":"#dc2626" }}>
            {pctSum.toFixed(1)}% {pctOk?"✓":"≠ 100"}
          </span>
        </div>
        {/* Bar */}
        <div style={{ height:10,borderRadius:99,overflow:"hidden",display:"flex",gap:1,marginBottom:12 }}>
          {[[w,"var(--accent)"],[p,"var(--brand)"],[ref,"#0284c7"]].map(([v,c],i)=><div key={i} style={{ flex:Number(v),background:String(c),minWidth:v?2:0 }}/>)}
        </div>
        <div style={{ display:"flex",gap:12,marginBottom:16,flexWrap:"wrap" }}>
          {[["Writer",w,"var(--accent)"],["Platform",p,"var(--brand)"],["Referrer",ref,"#0284c7"]].map(([l,v,c])=>(
            <span key={String(l)} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11 }}>
              <span style={{ width:10,height:10,borderRadius:3,background:String(c),display:"inline-block" }}/>
              <span style={{ color:"var(--text-3)",fontWeight:600 }}>{l}: {Number(v).toFixed(1)}%</span>
            </span>
          ))}
        </div>
        {[
          { key:"writer_pct",   label:"Writer Payout %",  color:"var(--accent)" },
          { key:"platform_pct", label:"Platform Fee %",   color:"var(--brand)"  },
          { key:"referrer_pct", label:"Referrer Fee %",   color:"#0284c7"       },
        ].map(f => (
          <div key={f.key} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
            <span style={{ fontSize:12,fontWeight:600,color:"var(--text-3)",width:120,flexShrink:0 }}>{f.label}</span>
            <input type="range" min="0" max="100" step="1" value={parseFloat(get(f.key,"0"))} onChange={e=>set(f.key,e.target.value)} style={{ flex:1,accentColor:f.color,cursor:"pointer" }}/>
            <div style={{ display:"flex",alignItems:"center",gap:2,width:58,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"5px 8px" }}>
              <input type="number" min="0" max="100" step="0.1" value={get(f.key,"0")} onChange={e=>set(f.key,e.target.value)}
                style={{ width:"100%",border:"none",outline:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif",textAlign:"right" }}/>
              <span style={{ fontSize:11,fontWeight:700,color:"var(--text-4)",flexShrink:0 }}>%</span>
            </div>
          </div>
        ))}
        <div style={{ padding:"8px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r)",display:"flex",gap:6,fontSize:11,color:"var(--text-4)",marginTop:8 }}>
          <Info size={11} style={{ flexShrink:0,marginTop:1 }}/>These settings apply to new earnings records. Smart contract splits need redeployment to change on-chain.
        </div>
      </div>
    
      {/* ── Hero Slides ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:14 }}>
          <span style={{ fontSize:15 }}>🖼️</span>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Hero Slider</h2>
        </div>
        <p style={{ fontSize:12,color:"var(--text-4)",marginBottom:14,lineHeight:1.65 }}>Customize the homepage hero slides. Paste image URLs for backgrounds.</p>
        {[1,2,3].map(n=>(
          <div key={n} style={{ marginBottom:14,padding:"12px 14px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"var(--brand)",marginBottom:8,fontFamily:"Outfit,sans-serif",textTransform:"uppercase",letterSpacing:".08em" }}>Slide {n}</div>
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              <input value={get(`hero_slide_${n}_tag`)} onChange={e=>set(`hero_slide_${n}_tag`,e.target.value)} placeholder="Tag e.g. Academic Publishing · Web3" className="admin-input"/>
              <input value={get(`hero_slide_${n}_title`)} onChange={e=>set(`hero_slide_${n}_title`,e.target.value)} placeholder="Headline" className="admin-input"/>
              <textarea value={get(`hero_slide_${n}_sub`)} onChange={e=>set(`hero_slide_${n}_sub`,e.target.value)} placeholder="Subtitle text" rows={2} className="admin-input" style={{ height:"auto",resize:"none" }}/>
              <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:7,alignItems:"center" }}>
                <input value={get(`hero_slide_${n}_color`)} onChange={e=>set(`hero_slide_${n}_color`,e.target.value)} placeholder="Accent color #6d28d9" className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace" }}/>
                <input type="color" value={get(`hero_slide_${n}_color`)||"#6d28d9"} onChange={e=>set(`hero_slide_${n}_color`,e.target.value)} style={{ width:36,height:36,border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:3,cursor:"pointer" }}/>
              </div>
              <input value={get(`hero_slide_${n}_image`)} onChange={e=>set(`hero_slide_${n}_image`,e.target.value)} placeholder="Background image URL (optional, e.g. https://...)" className="admin-input"/>
              {get(`hero_slide_${n}_image`)&&<img src={get(`hero_slide_${n}_image`)} alt="preview" style={{ width:"100%",height:60,objectFit:"cover",borderRadius:"var(--r)",border:"1px solid var(--border)" }}/>}
            </div>
          </div>
        ))}
      </div>
    
      {/* ── Site Visuals ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:14 }}>
          <span style={{ fontSize:16 }}>🖼️</span>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Site Images</h2>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Hero Background Image URL</label>
            <input value={get("hero_image")} onChange={e=>set("hero_image",e.target.value)} placeholder="https://... (full-width hero banner)" className="admin-input"/>
            {get("hero_image")&&<img src={get("hero_image")} alt="" style={{ marginTop:6,width:"100%",height:80,objectFit:"cover",borderRadius:"var(--r)",border:"1px solid var(--border)" }}/>}
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Hero Title</label>
            <input value={get("hero_title")} onChange={e=>set("hero_title",e.target.value)} placeholder="Your headline text" className="admin-input"/>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Hero Subtitle</label>
            <textarea value={get("hero_sub")} onChange={e=>set("hero_sub",e.target.value)} rows={2} placeholder="Hero subtitle / tagline" className="admin-input" style={{ height:"auto",resize:"none" }}/>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>CTA Button Label</label>
            <input value={get("hero_cta")} onChange={e=>set("hero_cta",e.target.value)} placeholder="Explore Articles" className="admin-input"/>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Site Banner Image URL</label>
            <input value={get("site_banner")} onChange={e=>set("site_banner",e.target.value)} placeholder="https://... (banner shown below hero)" className="admin-input"/>
            {get("site_banner")&&<img src={get("site_banner")} alt="" style={{ marginTop:6,width:"100%",height:60,objectFit:"cover",borderRadius:"var(--r)",border:"1px solid var(--border)" }}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
