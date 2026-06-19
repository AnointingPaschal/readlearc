"use client";
import { useState, useEffect } from "react";
import { Save, CheckCircle2, Eye, EyeOff, Bot, Trash2, Plus, RefreshCw, Sparkles, AlertTriangle, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";

const POPULAR_MODELS = [
  { id:"anthropic/claude-sonnet-4-5",   name:"Claude Sonnet 4.5",        provider:"Anthropic",  ctx:"200k", best:"Best all-around"         },
  { id:"openai/gpt-4o",                  name:"GPT-4o",                    provider:"OpenAI",    ctx:"128k", best:"Multimodal"              },
  { id:"google/gemini-2.0-flash-001",    name:"Gemini 2.0 Flash",          provider:"Google",    ctx:"1M",   best:"Fast & cheap"            },
  { id:"meta-llama/llama-3.3-70b-instruct",name:"Llama 3.3 70B",          provider:"Meta",      ctx:"128k", best:"Open source"             },
  { id:"mistralai/mistral-nemo",         name:"Mistral Nemo",              provider:"Mistral",   ctx:"128k", best:"Efficient"               },
  { id:"deepseek/deepseek-r1",           name:"DeepSeek R1",               provider:"DeepSeek",  ctx:"64k",  best:"Reasoning"               },
];

interface AIState {
  key: string;
  models: Array<{ id:string; name:string; provider:string; ctx?:string; custom?:boolean }>;
  activeModel: string;
  autoApprove: boolean;
}

export default function OpenRouterPage() {
  const [state,     setState]     = useState<AIState>({ key:"", models:[], activeModel:"", autoApprove:false });
  const [showKey,   setShowKey]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [testing,   setTesting]   = useState(false);
  const [testResult,setTestResult]= useState("");
  const [addingCustom,setAddingCustom]=useState(false);
  const [customId,  setCustomId]  = useState("");
  const [customName,setCustomName]= useState("");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/openrouter/models").then(r=>r.json()).then(d => {
      setState({ key:d.key||"", models:d.models||[], activeModel:d.activeModel||"", autoApprove:d.autoApprove||false });
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/openrouter/models", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(state),
    });
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),2500);
  }

  async function testConnection() {
    if (!state.key) return;
    setTesting(true); setTestResult("");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers:{ "Authorization": "Bearer " + state.key },
      });
      if (res.ok) { const d = await res.json(); setTestResult(`✓ Connected · ${d.data?.length||"?"} models available`); }
      else setTestResult("✗ Invalid API key");
    } catch { setTestResult("✗ Connection failed"); }
    setTesting(false);
  }

  function togglePopularModel(m: typeof POPULAR_MODELS[0]) {
    const exists = state.models.find(x=>x.id===m.id);
    setState(s => ({
      ...s,
      models: exists ? s.models.filter(x=>x.id!==m.id) : [...s.models, m],
      activeModel: !s.activeModel && !exists ? m.id : s.activeModel,
    }));
  }

  function addCustomModel() {
    if (!customId || !customName) return;
    setState(s => ({ ...s, models:[...s.models, { id:customId, name:customName, provider:"Custom", custom:true }] }));
    setCustomId(""); setCustomName(""); setAddingCustom(false);
  }

  function removeModel(id: string) {
    setState(s => ({ ...s, models:s.models.filter(m=>m.id!==id), activeModel:s.activeModel===id?"":s.activeModel }));
  }

  function setActive(id: string) { setState(s=>({...s, activeModel:id})); }
  function toggleAutoApprove() { setState(s=>({...s, autoApprove:!s.autoApprove})); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:680 }}>
      <div>
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>AI Moderation · OpenRouter</h1>
        <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>Configure AI-powered article review. OpenRouter gives access to 300+ models.</p>
      </div>

      {loading ? <div className="skeleton" style={{ height:180, borderRadius:16 }}/> : (<>

      {/* API Key */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <Bot size={15} style={{ color:"var(--brand)" }}/>
          <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>OpenRouter API Key</h2>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", fontSize:12, color:"var(--brand)", textDecoration:"none", fontWeight:600 }}>Get key →</a>
        </div>
        <div style={{ position:"relative", marginBottom:10 }}>
          <input type={showKey?"text":"password"} placeholder="sk-or-v1-…" value={state.key} onChange={e=>setState(s=>({...s,key:e.target.value}))}
            className="input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, paddingRight:44 }}/>
          <button onClick={()=>setShowKey(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex" }}>
            {showKey?<EyeOff size={14}/>:<Eye size={14}/>}
          </button>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={testConnection} disabled={!state.key||testing} className="btn btn-ghost btn-sm">
            {testing?<><div style={{ width:11,height:11,border:"1.5px solid currentColor",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>Testing…</>:<>Test connection</>}
          </button>
          {testResult && <span style={{ fontSize:11, fontWeight:600, color:testResult.startsWith("✓")?"#059669":"#dc2626" }}>{testResult}</span>}
        </div>
      </div>

      {/* Auto-approve */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <Sparkles size={14} style={{ color:"var(--brand)" }}/>
              <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Auto-Approve</h2>
              <span className={state.autoApprove?"badge badge-green":"badge badge-neutral"} style={{ fontSize:9 }}>{state.autoApprove?"ENABLED":"DISABLED"}</span>
            </div>
            <p style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.65 }}>When enabled, newly published articles are automatically analyzed by AI. Genuine, human-written, non-plagiarized articles get approved instantly. AI-generated or spammy content gets flagged or rejected.</p>
          </div>
          <button onClick={toggleAutoApprove} style={{ background:"none", border:"none", cursor:"pointer", color:state.autoApprove?"var(--accent)":"var(--text-4)", padding:0, flexShrink:0 }}>
            {state.autoApprove?<ToggleRight size={36}/>:<ToggleLeft size={36}/>}
          </button>
        </div>
        {state.autoApprove && !state.activeModel && (
          <div style={{ marginTop:12, padding:"9px 12px", background:"rgba(217,119,6,.06)", border:"1px solid rgba(217,119,6,.18)", borderRadius:"var(--r)", display:"flex", gap:7, alignItems:"flex-start" }}>
            <AlertTriangle size={12} style={{ color:"#d97706", flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:11, color:"#d97706" }}>Select an active model below for auto-approve to work.</span>
          </div>
        )}
        {state.autoApprove && state.activeModel && (
          <div style={{ marginTop:12, padding:"9px 12px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.18)", borderRadius:"var(--r)", display:"flex", gap:7, alignItems:"flex-start" }}>
            <CheckCircle2 size={12} style={{ color:"#059669", flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:11, color:"#059669" }}>Active: {state.models.find(m=>m.id===state.activeModel)?.name||state.activeModel} · Will analyze new articles on publish.</span>
          </div>
        )}
      </div>

      {/* Model selector */}
      <div className="card" style={{ padding:"20px" }}>
        <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:14 }}>Quick-add Popular Models</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8, marginBottom:14 }}>
          {POPULAR_MODELS.map(m => {
            const added = state.models.some(x=>x.id===m.id);
            return (
              <button key={m.id} onClick={()=>togglePopularModel(m)} style={{ padding:"10px 12px", borderRadius:"var(--r)", border:`1.5px solid ${added?"var(--brand)":"var(--border)"}`, background:added?"var(--brand-muted)":"var(--bg-alt)", cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                <div style={{ fontSize:12, fontWeight:700, color:added?"var(--brand)":"var(--text-2)", marginBottom:2 }}>{m.name}</div>
                <div style={{ fontSize:10, color:"var(--text-4)", marginBottom:3 }}>{m.provider} · {m.ctx}</div>
                <div style={{ fontSize:9, color:added?"var(--brand)":"var(--text-4)", fontWeight:600 }}>{added?"✓ Added":m.best}</div>
              </button>
            );
          })}
        </div>

        {/* Custom model */}
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
          <button onClick={()=>setAddingCustom(v=>!v)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--brand)" }}>
            {addingCustom?<ChevronUp size={14}/>:<Plus size={14}/>}{addingCustom?"Cancel":"Add custom model ID"}
          </button>
          {addingCustom && (
            <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, alignItems:"end" }}>
              <div><label style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", display:"block", marginBottom:4 }}>Model ID</label>
                <input type="text" placeholder="provider/model-id" value={customId} onChange={e=>setCustomId(e.target.value)} className="input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11 }}/></div>
              <div><label style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", display:"block", marginBottom:4 }}>Display Name</label>
                <input type="text" placeholder="My Custom Model" value={customName} onChange={e=>setCustomName(e.target.value)} className="input" style={{ fontSize:12 }}/></div>
              <button onClick={addCustomModel} disabled={!customId||!customName} className="btn btn-primary btn-sm"><Plus size={12}/>Add</button>
            </div>
          )}
        </div>
      </div>

      {/* Active model list */}
      {state.models.length > 0 && (
        <div className="card" style={{ padding:"20px" }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:14 }}>Your Models · Select Active</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {state.models.map(m => (
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderRadius:"var(--r)", border:`1.5px solid ${state.activeModel===m.id?"var(--brand)":"var(--border)"}`, background:state.activeModel===m.id?"var(--brand-muted)":"var(--bg-alt)", transition:"all .15s", cursor:"pointer" }}
                onClick={()=>setActive(m.id)}>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${state.activeModel===m.id?"var(--brand)":"var(--border-mid)"}`, background:state.activeModel===m.id?"var(--brand)":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {state.activeModel===m.id && <div style={{ width:6,height:6,borderRadius:"50%",background:"white" }}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:state.activeModel===m.id?"var(--brand)":"var(--text-2)" }}>{m.name}</div>
                  <div style={{ fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.id}</div>
                </div>
                {state.activeModel===m.id && <span style={{ fontSize:10, fontWeight:700, color:"var(--brand)", background:"var(--bg-card)", border:"1px solid var(--border-brand)", padding:"2px 7px", borderRadius:"var(--rfull)", flexShrink:0 }}>ACTIVE</span>}
                <button onClick={e=>{e.stopPropagation();removeModel(m.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", padding:4, flexShrink:0 }} title="Remove">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ fontWeight:700, minWidth:140 }}>
          {saved?<><CheckCircle2 size={14}/>Saved!</>:saving?<><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={13}/>Save Configuration</>}
        </button>
      </div>

      <div style={{ padding:"12px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", fontSize:11, color:"var(--text-4)", lineHeight:1.65 }}>
        <strong style={{ color:"var(--text-3)" }}>For production:</strong> Store OpenRouter key in Vercel env var <code style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10 }}>OPENROUTER_API_KEY</code> and read it server-side. Current setup stores in server memory (resets on redeploy).
      </div>
      </>)}
    </div>
  );
}
