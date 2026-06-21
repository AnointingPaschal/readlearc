"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, CheckCircle2, Ban, Star, Trash2, Edit3, Save, X, Eye, ChevronDown, ChevronUp, AlertCircle, Brain, Zap, BarChart2 } from "lucide-react";
import Link from "next/link";

type S = "pending"|"approved"|"rejected"|"featured";
const SC: Record<S,{label:string;c:string;bg:string}> = {
  pending: { label:"Pending",  c:"#d97706", bg:"rgba(217,119,6,.09)"   },
  approved:{ label:"Approved", c:"#059669", bg:"rgba(5,150,105,.09)"   },
  featured:{ label:"Featured", c:"#ca8a04", bg:"rgba(234,179,8,.09)"   },
  rejected:{ label:"Rejected", c:"#dc2626", bg:"rgba(220,38,38,.09)"   },
};
const REC: Record<string,{label:string;c:string}> = {
  approve:{ label:"APPROVE", c:"#059669" },
  review: { label:"REVIEW",  c:"#d97706" },
  reject: { label:"REJECT",  c:"#dc2626" },
};

function ScoreBar({ score, invert=false }: { score:number; invert?:boolean }) {
  const color = invert
    ? (score>60?"#dc2626":score>35?"#d97706":"#059669")
    : (score>60?"#059669":score>35?"#d97706":"#dc2626");
  return (
    <div style={{ flex:1,height:5,background:"var(--border)",borderRadius:99,overflow:"hidden" }}>
      <div style={{ height:"100%",width:`${score}%`,background:color,borderRadius:99,transition:"width .4s" }}/>
    </div>
  );
}

interface Article {
  id:string; title:string; blurb:string; price:string; category:string;
  readTime:number; isResearch:boolean; authorAddress:string; authorShort:string;
  status:S; featured:boolean; reads:number; paidCount:number; timestamp:number;
}

export default function ModerationPage() {
  const [arts,      setArts]      = useState<Article[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all"|S>("all");
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState<string|null>(null);
  const [eData,     setEData]     = useState<any>({});
  const [content,   setContent]   = useState<Record<string,string>>({});
  const [expanded,  setExpanded]  = useState<string|null>(null);
  const [busy,      setBusy]      = useState("");
  const [analyses,  setAnalyses]  = useState<Record<string,any|null>>({});
  const [analyzing, setAnalyzing] = useState<Record<string,boolean>>({});
  const [analyzeAllRunning, setAnalyzeAllRunning] = useState(false);
  const [analyzeAllProgress, setAnalyzeAllProgress] = useState({ done:0, total:0, current:"" });
  const analyzeAllRef = useRef(false);
  const [aiConfig,  setAiConfig]  = useState<{model:string;keySet:boolean}>({ model:"", keySet:false });
  const [configError, setConfigError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter !== "all") p.set("status", filter);
    if (search) p.set("q", search);
    const r = await fetch(`/api/admin/articles?${p}`);
    const d = await r.json();
    setArts(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  // Load AI config status
  useEffect(() => {
    fetch("/api/openrouter/models").then(r=>r.json()).then(d => {
      setAiConfig({ model:d.activeModel||"", keySet:!!d.key });
      if (!d.key) setConfigError("No OpenRouter API key. Go to Admin → AI → OpenRouter AI to configure.");
      else if (!d.activeModel) setConfigError("No active model selected. Go to Admin → AI → OpenRouter AI to select a model.");
      else setConfigError("");
    });
  }, []);

  // Load existing analyses for visible articles
  useEffect(() => {
    if (!arts.length) return;
    const unloaded = arts.filter(a => analyses[a.id] === undefined);
    if (!unloaded.length) return;
    // Mark as loading
    const marks: Record<string,null> = {};
    for (const a of unloaded) marks[a.id] = null;
    setAnalyses(prev => ({ ...prev, ...marks }));
    // Fetch all
    Promise.all(unloaded.map(async a => {
      const r = await fetch(`/api/admin/analyze/${a.id}`);
      const d = await r.json();
      return { id:a.id, data:d };
    })).then(results => {
      const updates: Record<string,any> = {};
      for (const r of results) updates[r.id] = r.data;
      setAnalyses(prev => ({ ...prev, ...updates }));
    });
  }, [arts]);

  async function runAnalysis(id: string) {
    setAnalyzing(prev => ({ ...prev, [id]:true }));
    setConfigError("");
    const r = await fetch(`/api/admin/analyze/${id}`, { method:"POST" });
    const d = await r.json();
    if (!r.ok) {
      setConfigError(d.error || "Analysis failed");
      setAnalyzing(prev => ({ ...prev, [id]:false }));
      return;
    }
    setAnalyses(prev => ({ ...prev, [id]: d.analysis || null }));
    // If auto-approved, refresh the article status
    if (d.autoApproved) {
      setArts(prev => prev.map(a => a.id===id ? { ...a, status:"approved" } : a));
    }
    setAnalyzing(prev => ({ ...prev, [id]:false }));
  }

  // Analyze ALL articles one by one
  async function analyzeAll() {
    if (!aiConfig.keySet || !aiConfig.model) {
      setConfigError("Configure OpenRouter API key and active model first.");
      return;
    }
    setAnalyzeAllRunning(true);
    analyzeAllRef.current = true;
    const toAnalyze = arts.filter(a => !analyses[a.id]);
    setAnalyzeAllProgress({ done:0, total:toAnalyze.length, current:"Starting…" });

    for (let i = 0; i < toAnalyze.length; i++) {
      if (!analyzeAllRef.current) break;
      const a = toAnalyze[i];
      setAnalyzeAllProgress({ done:i, total:toAnalyze.length, current:a.title.slice(0,50) });
      setAnalyzing(prev => ({ ...prev, [a.id]:true }));
      try {
        const r = await fetch(`/api/admin/analyze/${a.id}`, { method:"POST" });
        const d = await r.json();
        if (r.ok) {
          setAnalyses(prev => ({ ...prev, [a.id]: d.analysis || null }));
          if (d.autoApproved) setArts(prev => prev.map(x => x.id===a.id ? { ...x, status:"approved" } : x));
        }
      } catch {}
      setAnalyzing(prev => ({ ...prev, [a.id]:false }));
      // Small delay to avoid rate limits
      await new Promise(res => setTimeout(res, 800));
    }

    setAnalyzeAllProgress({ done:toAnalyze.length, total:toAnalyze.length, current:"Done!" });
    setTimeout(() => { setAnalyzeAllRunning(false); setAnalyzeAllProgress({ done:0, total:0, current:"" }); }, 3000);
    analyzeAllRef.current = false;
  }

  function stopAnalyzeAll() { analyzeAllRef.current = false; setAnalyzeAllRunning(false); }

  async function patch(id:string, body:any) {
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`,{ method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body) });
    setArts(prev => prev.map(a => a.id===id ? {...a,...body} : a));
    setBusy("");
  }

  async function del(id:string) {
    if (!confirm("Delete permanently?")) return;
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`,{ method:"DELETE" });
    setArts(prev => prev.filter(a => a.id!==id));
    setBusy("");
  }

  async function loadContent(id:string) {
    if (!content[id]) {
      const r = await fetch(`/api/articles/${id}?admin=1`);
      const d = await r.json();
      setContent(c => ({ ...c, [id]:d.content||"" }));
    }
    setExpanded(prev => prev===id?null:id);
  }

  const filtered = arts.filter(a => {
    if (filter!=="all" && a.status!==filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.authorAddress.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string,number> = { all:arts.length };
  arts.forEach(a => { counts[a.status]=(counts[a.status]||0)+1; });

  const analyzed = Object.values(analyses).filter(v => v && typeof v === "object" && "quality_score" in v).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Content Moderation</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>
            {arts.length} articles · {analyzed} analyzed
            {aiConfig.keySet && aiConfig.model && <span style={{ color:"var(--accent)" }}> · AI: {aiConfig.model}</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
          {analyzeAllRunning ? (
            <button onClick={stopAnalyzeAll} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(220,38,38,.1)",border:"1.5px solid rgba(220,38,38,.3)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:700,color:"#dc2626" }}>
              <X size={12}/>Stop ({analyzeAllProgress.done}/{analyzeAllProgress.total})
            </button>
          ) : (
            <button onClick={analyzeAll} disabled={!aiConfig.keySet||!aiConfig.model} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:700,color:"var(--brand)" }}>
              <Brain size={12}/>Analyze All
            </button>
          )}
        </div>
      </div>

      {/* AI config error / progress */}
      {configError && (
        <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8,alignItems:"flex-start" }}>
          <AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>
          <span>{configError} <Link href="/admin/ai/providers" style={{ color:"var(--brand)",fontWeight:700,textDecoration:"none" }}>Go to AI Settings →</Link></span>
        </div>
      )}

      {analyzeAllRunning && analyzeAllProgress.total > 0 && (
        <div style={{ padding:"11px 14px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-md)",display:"flex",gap:12,alignItems:"center" }}>
          <div style={{ width:12,height:12,border:"2px solid var(--brand-border)",borderTopColor:"var(--brand)",borderRadius:"50%",flexShrink:0 }} className="spin"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"var(--brand)",marginBottom:3 }}>
              Analyzing {analyzeAllProgress.done+1} of {analyzeAllProgress.total}…
            </div>
            <div style={{ height:4,background:"var(--border)",borderRadius:99,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${(analyzeAllProgress.done/analyzeAllProgress.total)*100}%`,background:"var(--brand)",transition:"width .3s",borderRadius:99 }}/>
            </div>
            <div style={{ fontSize:10,color:"var(--text-4)",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{analyzeAllProgress.current}</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(["all","pending","approved","featured","rejected"] as const).map(f => {
          const cfg = SC[f as S] || { c:"var(--brand)", bg:"var(--brand-muted)" };
          return (
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,cursor:"pointer",border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`,background:filter===f?cfg.bg:"transparent",color:filter===f?cfg.c:"var(--text-3)",transition:"all .15s" }}>
              {f==="all"?"All":cfg.label} ({counts[f]||0})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search title or author…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      {/* Articles */}
      {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:100,borderRadius:"var(--r-lg)" }}/>) :
       !filtered.length ? (
        <div className="card" style={{ padding:"48px",textAlign:"center",color:"var(--text-4)",fontSize:14 }}>
          {arts.length===0?"No articles yet.":"No articles match this filter."}
        </div>
       ) : filtered.map(a => {
         const cfg   = SC[a.status]||SC.pending;
         const analy = analyses[a.id];
         const isAna = !!analyzing[a.id];
         const isE   = editing===a.id;
         const isX   = expanded===a.id;

         return (
           <div key={a.id} className="card" style={{ overflow:"hidden",borderLeft:`3px solid ${cfg.c}`,padding:0 }}>

             {isE ? (
               <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:9 }}>
                 <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                   <span style={{ fontSize:12,fontWeight:700,color:"var(--brand)" }}>Editing #{a.id}</span>
                   <div style={{ display:"flex",gap:6 }}>
                     <button onClick={async()=>{await patch(a.id,eData);setEditing(null);setEData({});}} className="btn btn-primary btn-xs"><Save size={10}/>Save</button>
                     <button onClick={()=>{setEditing(null);setEData({});}} className="btn btn-ghost btn-xs"><X size={10}/>Cancel</button>
                   </div>
                 </div>
                 <input defaultValue={a.title} onChange={e=>setEData((d:any)=>({...d,title:e.target.value}))} className="admin-input" placeholder="Title" style={{ fontFamily:"Outfit,sans-serif",fontWeight:700 }}/>
                 <textarea defaultValue={a.blurb} rows={2} onChange={e=>setEData((d:any)=>({...d,blurb:e.target.value}))} className="admin-input" placeholder="Blurb"/>
                 <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                   <input defaultValue={a.price} type="number" step="0.001" onChange={e=>setEData((d:any)=>({...d,price:e.target.value}))} className="admin-input" placeholder="Price USDC"/>
                   <input defaultValue={a.category} onChange={e=>setEData((d:any)=>({...d,category:e.target.value}))} className="admin-input" placeholder="Category"/>
                 </div>
                 <textarea defaultValue={content[a.id]||""} rows={6} onChange={e=>setEData((d:any)=>({...d,content:e.target.value}))} className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,lineHeight:1.6 }} placeholder="Full article content…"/>
               </div>
             ) : (
               <>
                 <div style={{ padding:"14px 16px" }}>
                   <div style={{ display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}>
                     {/* Left */}
                     <div style={{ flex:1,minWidth:200 }}>
                       <div style={{ display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center" }}>
                         <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:"var(--r-f)",background:cfg.bg,color:cfg.c }}>{cfg.label}</span>
                         {a.featured&&<span className="badge badge-star" style={{ fontSize:9 }}>Featured</span>}
                         {a.isResearch&&<span className="badge badge-blue" style={{ fontSize:9 }}>Research</span>}
                         <span className="badge badge-neutral" style={{ fontSize:9 }}>{a.category}</span>
                         <span style={{ fontSize:9,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace" }}>#{a.id}</span>
                       </div>
                       <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:4,lineHeight:1.3 }}>{a.title}</h3>
                       <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.blurb}</p>
                       <div style={{ display:"flex",gap:10,fontSize:10,color:"var(--text-4)",flexWrap:"wrap" }}>
                         <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{a.authorShort}</span>
                         <span>${a.price}</span>
                         <span>{a.reads} reads · {a.paidCount} paid</span>
                         <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                       </div>
                     </div>

                     {/* Actions */}
                     <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                       <div style={{ display:"flex",gap:5 }}>
                         <Link href={`/article/${a.id}`} target="_blank" style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",fontSize:10,fontWeight:600,color:"var(--text-3)",textDecoration:"none" }}><Eye size={9}/>View</Link>
                         <button onClick={()=>{setEditing(a.id);loadContent(a.id);}} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}><Edit3 size={9}/>Edit</button>
                       </div>
                       <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                         {a.status!=="approved"  && <button onClick={()=>patch(a.id,{status:"approved",featured:false})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(5,150,105,.3)",background:"rgba(5,150,105,.08)",fontSize:10,fontWeight:700,color:"#059669",cursor:"pointer" }}><CheckCircle2 size={9}/>Approve</button>}
                         {a.status!=="featured"  && <button onClick={()=>patch(a.id,{status:"featured",featured:true})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(234,179,8,.3)",background:"rgba(234,179,8,.08)",fontSize:10,fontWeight:700,color:"#ca8a04",cursor:"pointer" }}><Star size={9}/>Feature</button>}
                         {a.status!=="rejected"  && <button onClick={()=>patch(a.id,{status:"rejected"})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.08)",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer" }}><Ban size={9}/>Reject</button>}
                         <button onClick={()=>del(a.id)} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.2)",background:"transparent",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer" }}><Trash2 size={9}/>Del</button>
                       </div>
                     </div>
                   </div>

                   {/* AI Analysis panel */}
                   <div style={{ marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)" }}>
                     <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:analy?10:0 }}>
                       <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                         <Brain size={12} style={{ color:"var(--brand)" }}/>
                         <span style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",fontFamily:"Outfit,sans-serif" }}>AI Analysis</span>
                         {analy?.recommendation && (
                           <span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:"var(--r-f)",background:`${(REC[analy.recommendation]?.c||"#d97706")}15`,color:REC[analy.recommendation]?.c||"#d97706",border:`1px solid ${(REC[analy.recommendation]?.c||"#d97706")}40` }}>
                             {REC[analy.recommendation]?.label||analy.recommendation.toUpperCase()}
                           </span>
                         )}
                       </div>
                       {isAna ? (
                         <span style={{ fontSize:10,color:"var(--brand)",display:"flex",alignItems:"center",gap:4 }}>
                           <div className="spin" style={{ width:10,height:10,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%" }}/>Analyzing…
                         </span>
                       ) : (
                         <button onClick={()=>runAnalysis(a.id)} disabled={!aiConfig.keySet||!aiConfig.model} style={{ display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:"var(--r-f)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}>
                           <Zap size={9}/>{analy?"Re-analyze":"Run AI Check"}
                         </button>
                       )}
                     </div>

                     {analy && typeof analy === "object" && "quality_score" in analy && (
                       <div style={{ display:"grid",gap:5 }}>
                         {[
                           { label:"Quality",      score:analy.quality_score,     note:analy.quality_notes,     invert:false },
                           { label:"Originality",  score:analy.originality_score, note:analy.originality_notes, invert:false },
                           { label:"AI-Generated", score:analy.ai_score,          note:analy.ai_notes,          invert:true  },
                           { label:"Plagiarism",   score:analy.plagiarism_score,  note:analy.plagiarism_notes,  invert:true  },
                         ].map(m => (
                           <div key={m.label}>
                             <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:2 }}>
                               <span style={{ fontSize:10,fontWeight:600,color:"var(--text-4)",width:82,flexShrink:0 }}>{m.label}</span>
                               <ScoreBar score={m.score} invert={m.invert}/>
                               <span style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",width:34,flexShrink:0,textAlign:"right" }}>{m.score}%</span>
                             </div>
                             {m.note && <p style={{ fontSize:9,color:"var(--text-4)",marginLeft:89,lineHeight:1.5,marginBottom:2 }}>{m.note}</p>}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Content viewer */}
                 <div style={{ borderTop:"1px solid var(--border)",padding:"6px 16px" }}>
                   <button onClick={()=>loadContent(a.id)} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:600,color:"var(--text-4)",padding:"2px 0" }}>
                     {isX?<ChevronUp size={11}/>:<ChevronDown size={11}/>}{isX?"Hide content":"View content"}
                   </button>
                   {isX&&content[a.id]&&(
                     <pre style={{ marginTop:8,padding:"10px 12px",background:"var(--bg-alt)",borderRadius:"var(--r)",fontSize:11,color:"var(--text-3)",lineHeight:1.6,maxHeight:250,overflow:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"JetBrains Mono,monospace" }}>
                       {content[a.id]}
                     </pre>
                   )}
                 </div>
               </>
             )}
           </div>
         );
       })}
    </div>
  );
}
