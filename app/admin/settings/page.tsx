"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, CheckCircle2, Eye, EyeOff, Brain, DollarSign, Percent, Info, AlertCircle, ExternalLink } from "lucide-react";

// ── AI Providers ─────────────────────────────────────────────────
const AI_PROVIDERS = [
  { id:"anthropic", label:"Anthropic",  models:["claude-haiku-4-5-20251001","claude-sonnet-4-6","claude-opus-4-6"],    docsUrl:"https://console.anthropic.com",       freeNote:"" },
  { id:"openai",    label:"OpenAI",     models:["gpt-4o-mini","gpt-4o","gpt-4-turbo","gpt-3.5-turbo"],                docsUrl:"https://platform.openai.com/api-keys", freeNote:"" },
  { id:"gemini",    label:"Google Gemini", models:["gemini-1.5-flash","gemini-1.5-pro","gemini-2.0-flash"],            docsUrl:"https://aistudio.google.com/app/apikey", freeNote:"Free tier available" },
  { id:"groq",      label:"Groq",       models:["llama-3.1-8b-instant","llama-3.3-70b-versatile","mixtral-8x7b-32768"], docsUrl:"https://console.groq.com/keys",        freeNote:"Free tier available" },
  { id:"deepseek",  label:"DeepSeek",   models:["deepseek-chat","deepseek-reasoner"],                                  docsUrl:"https://platform.deepseek.com",        freeNote:"Very affordable" },
];

const FEE_FIELDS = [
  { key:"writer_pct",   label:"Writer Payout %",  desc:"Writer's share of each payment", color:"var(--accent)" },
  { key:"platform_pct", label:"Platform Fee %",   desc:"Platform's share",                color:"var(--brand)" },
  { key:"referrer_pct", label:"Referrer Fee %",   desc:"Referrer bonus",                  color:"#0284c7"       },
] as const;

export default function AdminSettingsPage() {
  // Pricing
  const [articlePrice,   setArticlePrice]   = useState("0.020");
  const [researchPrice,  setResearchPrice]  = useState("0.050");
  const [minPrice,       setMinPrice]       = useState("0.001");
  const [maxPrice,       setMaxPrice]       = useState("10.00");
  const [writerPct,      setWriterPct]      = useState("85");
  const [platformPct,    setPlatformPct]    = useState("10");
  const [referrerPct,    setReferrerPct]    = useState("5");
  // Treasury
  const [treasury,       setTreasury]       = useState("");
  // AI
  const [aiProvider,     setAiProvider]     = useState("anthropic");
  const [aiModel,        setAiModel]        = useState("claude-haiku-4-5-20251001");
  const [aiApiKey,       setAiApiKey]       = useState("");
  const [showKey,        setShowKey]        = useState(false);
  const [testResult,     setTestResult]     = useState<{ok:boolean;msg:string}|null>(null);
  const [testing,        setTesting]        = useState(false);
  // UI
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings");
    const d = await r.json();
    if (d.article_default_price)  setArticlePrice(d.article_default_price);
    if (d.research_default_price) setResearchPrice(d.research_default_price);
    if (d.min_price)              setMinPrice(d.min_price);
    if (d.max_price)              setMaxPrice(d.max_price);
    if (d.writer_pct)             setWriterPct(d.writer_pct);
    if (d.platform_pct)           setPlatformPct(d.platform_pct);
    if (d.referrer_pct)           setReferrerPct(d.referrer_pct);
    if (d.treasury_address)       setTreasury(d.treasury_address);
    if (d.ai_provider)            setAiProvider(d.ai_provider);
    if (d.ai_model)               setAiModel(d.ai_model);
    if (d.ai_api_key)             setAiApiKey(d.ai_api_key);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  // When provider changes, set default model
  function handleProviderChange(pid: string) {
    setAiProvider(pid);
    const provider = AI_PROVIDERS.find(p=>p.id===pid);
    if (provider) setAiModel(provider.models[0]);
    setTestResult(null);
  }

  async function testConnection() {
    setTesting(true); setTestResult(null);
    try {
      // Save first, then test by running a tiny analysis
      await save(true);
      const r = await fetch("/api/admin/ai-test");
      const d = await r.json();
      setTestResult(d.ok ? { ok:true, msg:`✓ Connected to ${aiProvider} · ${aiModel}` } : { ok:false, msg:d.error||"Connection failed" });
    } catch(e:any) { setTestResult({ ok:false, msg:e.message }); }
    setTesting(false);
  }

  async function save(silent=false) {
    if (!silent) { setSaving(true); setError(""); setSaved(false); }
    const pctSum = parseFloat(writerPct)+parseFloat(platformPct)+parseFloat(referrerPct);
    if (Math.abs(pctSum-100)>0.01 && !silent) { setError(`Percentages must sum to 100% (currently ${pctSum.toFixed(1)}%)`); setSaving(false); return; }

    const r = await fetch("/api/admin/settings", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        article_default_price:  articlePrice,
        research_default_price: researchPrice,
        min_price:              minPrice,
        max_price:              maxPrice,
        writer_pct:             writerPct,
        platform_pct:           platformPct,
        referrer_pct:           referrerPct,
        treasury_address:       treasury,
        ai_provider:            aiProvider,
        ai_model:               aiModel,
        ai_api_key:             aiApiKey,
      }),
    });
    const d = await r.json();
    if (!silent) {
      if (!r.ok) setError(d.error||"Save failed");
      else { setSaved(true); setTimeout(()=>setSaved(false),3000); }
      setSaving(false);
    }
  }

  const pctSum = parseFloat(writerPct||"0")+parseFloat(platformPct||"0")+parseFloat(referrerPct||"0");
  const pctOk  = Math.abs(pctSum-100)<0.01;
  const currentProvider = AI_PROVIDERS.find(p=>p.id===aiProvider);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Settings</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Pricing, treasury wallet, AI model and fee splits</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>load()} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Reload
          </button>
          <button onClick={()=>save(false)} disabled={saving||loading||!pctOk} className="btn btn-primary" style={{ gap:6 }}>
            {saving?<><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:saved?<><CheckCircle2 size={12}/>Saved!</>:<><Save size={12}/>Save All</>}
          </button>
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8 }}><AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>{error}</div>}

      {/* ── Treasury Wallet ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:16 }}>
          <DollarSign size={15} style={{ color:"var(--accent)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Treasury Wallet</h2>
        </div>
        <div>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>Treasury Address</label>
          <input value={treasury} onChange={e=>setTreasury(e.target.value)} className="admin-input"
            style={{ fontFamily:"JetBrains Mono,monospace",fontSize:13 }}
            placeholder="0x... admin wallet that receives all payments"/>
          <p style={{ fontSize:11,color:"var(--text-4)",marginTop:5,lineHeight:1.65 }}>
            All reader payments are sent to this wallet. You distribute earnings to writers monthly from the <strong>Earnings & Payouts</strong> page.
            Leave blank to pay writers directly (no treasury).
          </p>
        </div>
      </div>

      {/* ── AI Model ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:16 }}>
          <Brain size={15} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>AI Content Analysis Model</h2>
        </div>

        {/* Provider picker */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:8,fontFamily:"Outfit,sans-serif" }}>AI Provider</label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8 }}>
            {AI_PROVIDERS.map(p=>(
              <button key={p.id} onClick={()=>handleProviderChange(p.id)}
                style={{ padding:"10px 8px",borderRadius:"var(--r)",border:`1.5px solid ${aiProvider===p.id?"var(--brand)":"var(--border)"}`,background:aiProvider===p.id?"var(--brand-muted)":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s" }}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:aiProvider===p.id?"var(--brand)":"var(--text-2)",marginBottom:2 }}>{p.label}</div>
                {p.freeNote && <div style={{ fontSize:9,color:"var(--accent)",fontWeight:600 }}>{p.freeNote}</div>}
              </button>
            ))}
          </div>
          {currentProvider && (
            <div style={{ marginTop:8,display:"flex",alignItems:"center",gap:6 }}>
              <a href={currentProvider.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3 }}>
                Get API key <ExternalLink size={10}/>
              </a>
              {currentProvider.freeNote && <span style={{ fontSize:11,color:"var(--accent)" }}>· {currentProvider.freeNote}</span>}
            </div>
          )}
        </div>

        {/* Model picker */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>Model</label>
          <select value={aiModel} onChange={e=>setAiModel(e.target.value)}
            style={{ width:"100%",padding:"9px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,color:"var(--text)",outline:"none",cursor:"pointer" }}>
            {currentProvider?.models.map(m=>(
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API key */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif" }}>API Key</label>
          <div style={{ position:"relative" }}>
            <input type={showKey?"text":"password"} value={aiApiKey} onChange={e=>setAiApiKey(e.target.value)}
              className="admin-input" placeholder={`${currentProvider?.label} API key…`}
              style={{ paddingRight:42,fontFamily:"JetBrains Mono,monospace",fontSize:12 }}/>
            <button onClick={()=>setShowKey(v=>!v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}>
              {showKey?<EyeOff size={14}/>:<Eye size={14}/>}
            </button>
          </div>
          <p style={{ fontSize:10,color:"var(--text-4)",marginTop:4 }}>Stored securely in Supabase. Used only for article analysis.</p>
        </div>

        {/* Test connection */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <button onClick={testConnection} disabled={testing||!aiApiKey} className="btn btn-secondary btn-sm">
            {testing?<><div style={{ width:11,height:11,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%"}} className="spin"/>Testing…</>:"Test Connection"}
          </button>
          {testResult && (
            <span style={{ fontSize:12,fontWeight:600,color:testResult.ok?"var(--accent)":"#dc2626" }}>
              {testResult.msg}
            </span>
          )}
        </div>
      </div>

      {/* ── Default Prices ── */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)",marginBottom:16 }}>Default Prices</h2>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[
            { label:"Default Article Price", v:articlePrice, set:setArticlePrice },
            { label:"Default Research Price", v:researchPrice, set:setResearchPrice },
            { label:"Minimum Price", v:minPrice, set:setMinPrice },
            { label:"Maximum Price", v:maxPrice, set:setMaxPrice },
          ].map(f=>(
            <div key={f.label}>
              <label style={{ fontSize:10,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>{f.label}</label>
              <div style={{ display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"8px 10px" }}>
                <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                <input type="number" step="0.001" min="0" value={f.v} onChange={e=>f.set(e.target.value)}
                  style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:16,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif" }}/>
                <span style={{ fontSize:10,color:"var(--text-4)",fontWeight:600 }}>USDC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fee Split ── */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <Percent size={15} style={{ color:"var(--brand)" }}/>
            <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)" }}>Payment Split</h2>
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:pctOk?"var(--accent)":"#dc2626" }}>
            Total: {pctSum.toFixed(1)}% {pctOk?"✓":"≠ 100"}
          </span>
        </div>
        {/* Visual bar */}
        <div style={{ height:10,borderRadius:99,overflow:"hidden",display:"flex",gap:1,marginBottom:16 }}>
          {[["var(--accent)",parseFloat(writerPct||"0")],["var(--brand)",parseFloat(platformPct||"0")],["#0284c7",parseFloat(referrerPct||"0")]].map(([c,v],i)=>(
            <div key={i} style={{ flex:v as number,background:c as string }}/>
          ))}
        </div>
        <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
          {[{l:"Writer",c:"var(--accent)",v:writerPct},{l:"Platform",c:"var(--brand)",v:platformPct},{l:"Referrer",c:"#0284c7",v:referrerPct}].map(s=>(
            <span key={s.l} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11 }}>
              <span style={{ width:10,height:10,borderRadius:3,background:s.c,display:"inline-block" }}/>
              <span style={{ color:"var(--text-3)",fontWeight:600 }}>{s.l}: {s.v}%</span>
            </span>
          ))}
        </div>
        <div style={{ display:"grid",gap:10 }}>
          {[
            { label:"Writer Payout %",  v:writerPct,   set:setWriterPct,   c:"var(--accent)" },
            { label:"Platform Fee %",   v:platformPct, set:setPlatformPct, c:"var(--brand)"  },
            { label:"Referrer Fee %",   v:referrerPct, set:setReferrerPct, c:"#0284c7"       },
          ].map(f=>(
            <div key={f.label} style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:12,fontWeight:600,color:"var(--text-3)",width:130,flexShrink:0 }}>{f.label}</span>
              <input type="range" min="0" max="100" step="1" value={parseFloat(f.v||"0")} onChange={e=>f.set(e.target.value)} style={{ flex:1,accentColor:f.c,cursor:"pointer" }}/>
              <div style={{ display:"flex",alignItems:"center",gap:3,width:60,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"5px 8px" }}>
                <input type="number" min="0" max="100" step="0.1" value={f.v} onChange={e=>f.set(e.target.value)}
                  style={{ width:"100%",border:"none",outline:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif",textAlign:"right" }}/>
                <span style={{ fontSize:11,fontWeight:700,color:"var(--text-4)",flexShrink:0 }}>%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12,padding:"9px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r)",display:"flex",gap:7,fontSize:11,color:"var(--text-4)" }}>
          <Info size={12} style={{ flexShrink:0,marginTop:1 }}/>
          Settings apply to new payments. Smart contract splits require redeployment.
        </div>
      </div>
    </div>
  );
}
