"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, CheckCircle2, Ban, Star, Trash2, Edit3, Save, X, Eye, ChevronDown, ChevronUp, AlertCircle, Brain, Shield, Zap, BarChart2, Clock } from "lucide-react";
import Link from "next/link";

type S = "pending"|"approved"|"rejected"|"featured";
const SC:Record<S,{label:string;c:string;bg:string}> = {
  pending: { label:"Pending",  c:"#d97706", bg:"rgba(217,119,6,.09)" },
  approved:{ label:"Approved", c:"#059669", bg:"rgba(5,150,105,.09)"  },
  featured:{ label:"Featured", c:"#ca8a04", bg:"rgba(234,179,8,.09)"  },
  rejected:{ label:"Rejected", c:"#dc2626", bg:"rgba(220,38,38,.09)"  },
};

const REC_COLOR = { approve:"var(--accent)", reject:"#dc2626", review:"#d97706" };

function ScoreBar({ score, color }: { score:number; color:string }) {
  return (
    <div style={{ flex:1, height:5, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${score}%`, background:color, borderRadius:99, transition:"width .4s" }}/>
    </div>
  );
}

function AnalysisBadge({ analysis, loading, onAnalyze }: { analysis:any; loading:boolean; onAnalyze:()=>void }) {
  if (loading) return (
    <button disabled style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-f)",fontSize:10,color:"var(--brand)",cursor:"wait" }}>
      <div className="spin" style={{ width:10,height:10,border:"1.5px solid var(--brand)",borderTopColor:"transparent",borderRadius:"50%" }}/>Analyzing…
    </button>
  );
  if (!analysis) return (
    <button onClick={onAnalyze} style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r-f)",fontSize:10,color:"var(--text-3)",cursor:"pointer",fontWeight:600 }}>
      <Brain size={10}/>Run AI Check
    </button>
  );
  const rec = analysis.recommendation || "review";
  const col = (REC_COLOR as any)[rec] || "#d97706";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:`${col}10`,border:`1px solid ${col}30`,borderRadius:"var(--r-f)",fontSize:10,fontWeight:700,color:col }}>
      <Brain size={10}/>{rec.toUpperCase()}
    </div>
  );
}

interface A { id:string;title:string;blurb:string;price:string;category:string;readTime:number;isResearch:boolean;authorAddress:string;authorShort:string;status:S;featured:boolean;reads:number;paidCount:number;timestamp:number; }

export default function ModerationPage() {
  const [arts,      setArts]      = useState<A[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all"|S>("all");
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState<string|null>(null);
  const [eData,     setEData]     = useState<any>({});
  const [content,   setContent]   = useState<Record<string,string>>({});
  const [expanded,  setExpanded]  = useState<string|null>(null);
  const [busy,      setBusy]      = useState("");
  const [analyses,  setAnalyses]  = useState<Record<string,any>>({});
  const [analyzing, setAnalyzing] = useState<Record<string,boolean>>({});

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

  // Load existing analyses for visible articles
  useEffect(() => {
    if (!arts.length) return;
    arts.forEach(async a => {
      if (analyses[a.id] !== undefined) return;
      const r = await fetch(`/api/admin/analyze/${a.id}`);
      const d = await r.json();
      if (d) setAnalyses(prev => ({ ...prev, [a.id]: d }));
      else   setAnalyses(prev => ({ ...prev, [a.id]: null }));
    });
  }, [arts]);

  async function runAnalysis(id: string) {
    setAnalyzing(prev => ({ ...prev, [id]:true }));
    const r = await fetch(`/api/admin/analyze/${id}`, { method:"POST" });
    const d = await r.json();
    setAnalyses(prev => ({ ...prev, [id]: d.analysis || null }));
    setAnalyzing(prev => ({ ...prev, [id]:false }));
  }

  async function patch(id:string, body:any) {
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    setArts(prev => prev.map(a => a.id===id ? {...a,...body} : a));
    setBusy("");
  }

  async function del(id:string) {
    if (!confirm("Delete permanently?")) return;
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`, { method:"DELETE" });
    setArts(prev => prev.filter(a => a.id!==id));
    setBusy("");
  }

  async function loadContent(id:string) {
    if (!content[id]) {
      const r = await fetch(`/api/articles/${id}?admin=1`);
      const d = await r.json();
      setContent(c => ({ ...c, [id]: d.content||"" }));
    }
    setExpanded(expanded===id ? null : id);
  }

  const filtered = arts.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.authorAddress.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string,number> = { all:arts.length };
  arts.forEach(a => { counts[a.status] = (counts[a.status]||0)+1; });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Content Moderation</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{arts.length} articles · AI analysis powered by Claude</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={12} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(["all","pending","approved","featured","rejected"] as const).map(f => {
          const cfg = SC[f as S] || { c:"var(--brand)", bg:"var(--brand-muted)" };
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,cursor:"pointer",border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`,background:filter===f?cfg.bg:"transparent",color:filter===f?cfg.c:"var(--text-3)",transition:"all .15s" }}>
              {f==="all"?"All":cfg.label} ({counts[f]||0})
            </button>
          );
        })}
      </div>

      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search title or author…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:100,borderRadius:"var(--r-lg)" }}/>) :
       !filtered.length ? (
        <div className="card" style={{ padding:"48px",textAlign:"center",color:"var(--text-4)",fontSize:14 }}>
          {arts.length===0 ? "No articles yet." : "No articles match this filter."}
        </div>
       ) : filtered.map(a => {
         const cfg = SC[a.status] || SC.pending;
         const analysis = analyses[a.id];
         const isAnalyzing = !!analyzing[a.id];
         const isE = editing===a.id;
         const isX = expanded===a.id;

         return (
           <div key={a.id} className="card" style={{ overflow:"hidden", borderLeft:`3px solid ${cfg.c}`, padding:0 }}>

             {isE ? (
               <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:9 }}>
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
                   <input defaultValue={a.price} type="number" step="0.001" onChange={e=>setEData((d:any)=>({...d,price:e.target.value}))} className="admin-input" placeholder="Price"/>
                   <input defaultValue={a.category} onChange={e=>setEData((d:any)=>({...d,category:e.target.value}))} className="admin-input" placeholder="Category"/>
                 </div>
                 <textarea defaultValue={content[a.id]||""} rows={6} onChange={e=>setEData((d:any)=>({...d,content:e.target.value}))} className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,lineHeight:1.6 }} placeholder="Full article content…"/>
               </div>
             ) : (
               <>
                 <div style={{ padding:"14px 16px" }}>
                   <div style={{ display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}>
                     {/* Left: article info */}
                     <div style={{ flex:1,minWidth:200 }}>
                       <div style={{ display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center" }}>
                         <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:"var(--r-f)",background:cfg.bg,color:cfg.c }}>{cfg.label}</span>
                         {a.featured && <span className="badge badge-star">Featured</span>}
                         {a.isResearch && <span className="badge badge-blue">Research</span>}
                         <span className="badge badge-neutral">{a.category}</span>
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

                     {/* Right: actions */}
                     <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                       <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                         <Link href={`/article/${a.id}`} target="_blank" style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",fontSize:10,fontWeight:600,color:"var(--text-3)",textDecoration:"none" }}><Eye size={9}/>View</Link>
                         <button onClick={()=>{setEditing(a.id);loadContent(a.id);}} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}><Edit3 size={9}/>Edit</button>
                       </div>
                       <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                         {a.status!=="approved"  && <button onClick={()=>patch(a.id,{status:"approved",featured:false})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(5,150,105,.3)",background:"rgba(5,150,105,.08)",fontSize:10,fontWeight:700,color:"#059669",cursor:"pointer" }}><CheckCircle2 size={9}/>Approve</button>}
                         {a.status!=="featured"  && <button onClick={()=>patch(a.id,{status:"featured",featured:true})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(234,179,8,.3)",background:"rgba(234,179,8,.08)",fontSize:10,fontWeight:700,color:"#ca8a04",cursor:"pointer" }}><Star size={9}/>Feature</button>}
                         {a.status!=="rejected"  && <button onClick={()=>patch(a.id,{status:"rejected"})} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.08)",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer" }}><Ban size={9}/>Reject</button>}
                         <button onClick={()=>del(a.id)} disabled={!!busy} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.2)",background:"transparent",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer" }}><Trash2 size={9}/>Delete</button>
                       </div>
                     </div>
                   </div>

                   {/* AI Analysis panel */}
                   <div style={{ marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)" }}>
                     <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:analysis?10:0 }}>
                       <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                         <Brain size={12} style={{ color:"var(--brand)" }}/>
                         <span style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",fontFamily:"Outfit,sans-serif" }}>AI Content Analysis</span>
                       </div>
                       <AnalysisBadge analysis={analysis} loading={isAnalyzing} onAnalyze={()=>runAnalysis(a.id)}/>
                     </div>
                     {analysis && (
                       <div style={{ display:"grid",gap:6 }}>
                         {[
                           { label:"Quality",     score:analysis.quality_score,     color:"var(--accent)", note:analysis.quality_notes,     invert:false },
                           { label:"Originality", score:analysis.originality_score, color:"#0284c7",       note:analysis.originality_notes, invert:false },
                           { label:"AI-Generated",score:analysis.ai_score,          color:"#d97706",       note:analysis.ai_notes,          invert:true  },
                           { label:"Plagiarism",  score:analysis.plagiarism_score,  color:"#dc2626",       note:analysis.plagiarism_notes,  invert:true  },
                         ].map(m => (
                           <div key={m.label}>
                             <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                               <span style={{ fontSize:10,fontWeight:600,color:"var(--text-4)",width:90,flexShrink:0 }}>{m.label}</span>
                               <ScoreBar score={m.score} color={m.invert?(m.score>60?m.color:"var(--accent)"):(m.score>60?"var(--accent)":m.color)}/>
                               <span style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",width:36,flexShrink:0,textAlign:"right" }}>{m.score}%</span>
                             </div>
                             {m.note && <p style={{ fontSize:10,color:"var(--text-4)",marginLeft:98,lineHeight:1.5 }}>{m.note}</p>}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Content preview */}
                 <div style={{ borderTop:"1px solid var(--border)",padding:"7px 16px" }}>
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
       })
      }
    </div>
  );
}
