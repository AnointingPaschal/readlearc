"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, CheckCircle2, Ban, Star, Trash2, Edit3, Save, X, Eye, ChevronDown, ChevronUp, AlertCircle, Brain, Zap } from "lucide-react";
import Link from "next/link";

type S="pending"|"approved"|"rejected"|"featured";
const SC:Record<S,{label:string;c:string;bg:string}> = {
  pending:{label:"Pending",c:"#d97706",bg:"rgba(217,119,6,.09)"},
  approved:{label:"Approved",c:"#059669",bg:"rgba(5,150,105,.09)"},
  featured:{label:"Featured",c:"#ca8a04",bg:"rgba(234,179,8,.09)"},
  rejected:{label:"Rejected",c:"#dc2626",bg:"rgba(220,38,38,.09)"},
};
const REC:Record<string,{label:string;c:string}> = {
  approve:{label:"APPROVE",c:"#059669"},review:{label:"REVIEW",c:"#d97706"},reject:{label:"REJECT",c:"#dc2626"},
};

function ScoreRing({score,label,invert=false}:{score:number;label:string;invert?:boolean}) {
  const r=22; const circ=2*Math.PI*r; const dash=(score/100)*circ;
  const color=invert?(score>60?"#dc2626":score>35?"#d97706":"#059669"):(score>60?"#059669":score>35?"#d97706":"#dc2626");
  return (
    <div style={{textAlign:"center",flexShrink:0}}>
      <svg width={60} height={60} viewBox="0 0 60 60">
        <circle cx={30} cy={30} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
        <circle cx={30} cy={30} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 30 30)" style={{transition:"stroke-dasharray .5s ease"}}/>
        <text x={30} y={35} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} fontFamily="Outfit,sans-serif">{score}</text>
      </svg>
      <div style={{fontSize:9,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".06em",marginTop:2,lineHeight:1.2}}>{label}</div>
    </div>
  );
}

interface Article{id:string;title:string;blurb:string;price:string;category:string;readTime:number;isResearch:boolean;authorAddress:string;authorShort:string;status:S;featured:boolean;reads:number;paidCount:number;timestamp:number;}

export default function ModerationPage() {
  const [arts,setArts]=useState<Article[]>([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState<"all"|S>("all");
  const [search,setSearch]=useState("");
  const [editing,setEditing]=useState<string|null>(null);
  const [eData,setEData]=useState<any>({});
  const [content,setContent]=useState<Record<string,string>>({});
  const [expanded,setExpanded]=useState<string|null>(null);
  const [busy,setBusy]=useState("");
  const [analyses,setAnalyses]=useState<Record<string,any|null>>({});
  const [analyzing,setAnalyzing]=useState<Record<string,boolean>>({});
  const [allRunning,setAllRunning]=useState(false);
  const [allProg,setAllProg]=useState({done:0,total:0,cur:""});
  const stopRef=useRef(false);
  const [aiCfg,setAiCfg]=useState({model:"",keySet:false});
  const [cfgErr,setCfgErr]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    const p=new URLSearchParams();
    if(filter!=="all")p.set("status",filter);
    if(search)p.set("q",search);
    const r=await fetch(`/api/admin/articles?${p}`);
    const d=await r.json();
    setArts(Array.isArray(d)?d:[]);
    setLoading(false);
  },[filter,search]);

  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    fetch("/api/openrouter/models").then(r=>r.json()).then(d=>{
      setAiCfg({model:d.activeModel||"",keySet:!!d.key});
      if(!d.key)setCfgErr("No OpenRouter key — go to Admin → AI → OpenRouter AI");
      else if(!d.activeModel)setCfgErr("No active model — go to Admin → AI → OpenRouter AI");
      else setCfgErr("");
    });
  },[]);

  useEffect(()=>{
    if(!arts.length)return;
    const unloaded=arts.filter(a=>analyses[a.id]===undefined);
    if(!unloaded.length)return;
    const marks:Record<string,null>={};
    for(const a of unloaded)marks[a.id]=null;
    setAnalyses(prev=>({...prev,...marks}));
    Promise.all(unloaded.map(async a=>{
      const r=await fetch(`/api/admin/analyze/${a.id}`);
      const d=await r.json();
      return{id:a.id,data:d};
    })).then(results=>{
      const u:Record<string,any>={};
      for(const r of results)u[r.id]=r.data;
      setAnalyses(prev=>({...prev,...u}));
    });
  },[arts]);

  async function runOne(id:string){
    setAnalyzing(prev=>({...prev,[id]:true}));
    const r=await fetch(`/api/admin/analyze/${id}`,{method:"POST"});
    const d=await r.json();
    if(!r.ok){setCfgErr(d.error||"Analysis failed");}
    else{
      setAnalyses(prev=>({...prev,[id]:d.analysis||null}));
      if(d.autoApproved)setArts(prev=>prev.map(a=>a.id===id?{...a,status:"approved" as S}:a));
    }
    setAnalyzing(prev=>({...prev,[id]:false}));
  }

  async function analyzeAll(){
    if(!aiCfg.keySet||!aiCfg.model){setCfgErr("Configure key + model first.");return;}
    stopRef.current=false;
    setAllRunning(true);
    const todo=arts.filter(a=>!analyses[a.id]);
    setAllProg({done:0,total:todo.length,cur:"Starting…"});
    for(let i=0;i<todo.length;i++){
      if(stopRef.current)break;
      const a=todo[i];
      setAllProg({done:i,total:todo.length,cur:a.title.slice(0,50)});
      setAnalyzing(prev=>({...prev,[a.id]:true}));
      try{
        const r=await fetch(`/api/admin/analyze/${a.id}`,{method:"POST"});
        const d=await r.json();
        if(r.ok){
          setAnalyses(prev=>({...prev,[a.id]:d.analysis||null}));
          if(d.autoApproved)setArts(prev=>prev.map(x=>x.id===a.id?{...x,status:"approved" as S}:x));
        }
      }catch{}
      setAnalyzing(prev=>({...prev,[a.id]:false}));
      await new Promise(res=>setTimeout(res,800));
    }
    setAllProg(p=>({...p,done:p.total,cur:"Complete!"}));
    setTimeout(()=>{setAllRunning(false);setAllProg({done:0,total:0,cur:""});},2500);
    stopRef.current=false;
  }

  async function patch(id:string,body:any){
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    setArts(prev=>prev.map(a=>a.id===id?{...a,...body}:a));
    setBusy("");
  }
  async function del(id:string){
    if(!confirm("Delete permanently?"))return;
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`,{method:"DELETE"});
    setArts(prev=>prev.filter(a=>a.id!==id));
    setBusy("");
  }
  async function loadContent(id:string){
    if(!content[id]){const r=await fetch(`/api/articles/${id}?admin=1`);const d=await r.json();setContent(c=>({...c,[id]:d.content||""}));}
    setExpanded(prev=>prev===id?null:id);
  }

  const filtered=arts.filter(a=>{
    if(filter!=="all"&&a.status!==filter)return false;
    if(search&&!a.title.toLowerCase().includes(search.toLowerCase())&&!a.authorAddress.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const counts:Record<string,number>={all:arts.length};
  arts.forEach(a=>{counts[a.status]=(counts[a.status]||0)+1;});
  const analyzed=Object.values(analyses).filter(v=>v&&"quality_score" in v).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Content Moderation</h1>
          <p style={{fontSize:12,color:"var(--text-4)",marginTop:2}}>{arts.length} articles · {analyzed} analyzed{aiCfg.keySet&&aiCfg.model&&<span style={{color:"var(--accent)"}}> · {aiCfg.model}</span>}</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={load} disabled={loading} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)"}}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
          {allRunning?(
            <button onClick={()=>{stopRef.current=true;setAllRunning(false);}} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",background:"rgba(220,38,38,.1)",border:"1.5px solid rgba(220,38,38,.3)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:700,color:"#dc2626"}}>
              <X size={12}/>Stop ({allProg.done}/{allProg.total})
            </button>
          ):(
            <button onClick={analyzeAll} disabled={!aiCfg.keySet||!aiCfg.model} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:700,color:"var(--brand)"}}>
              <Brain size={12}/>Analyze All ({arts.filter(a=>!analyses[a.id]).length} pending)
            </button>
          )}
        </div>
      </div>

      {cfgErr&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8}}>
        <AlertCircle size={14} style={{flexShrink:0,marginTop:1}}/>{cfgErr} <Link href="/admin/ai/providers" style={{color:"var(--brand)",fontWeight:700,textDecoration:"none"}}>Fix →</Link>
      </div>}

      {allRunning&&allProg.total>0&&(
        <div style={{padding:"11px 14px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-md)",display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:11,height:11,border:"2px solid var(--brand-border)",borderTopColor:"var(--brand)",borderRadius:"50%",flexShrink:0}} className="spin"/>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--brand)"}}>Analyzing {allProg.done+1} of {allProg.total}</span>
              <span style={{fontSize:11,color:"var(--text-4)"}}>{Math.round((allProg.done/allProg.total)*100)}%</span>
            </div>
            <div style={{height:4,background:"var(--border)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${(allProg.done/allProg.total)*100}%`,background:"var(--brand)",transition:"width .3s",borderRadius:99}}/></div>
            <div style={{fontSize:10,color:"var(--text-4)",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{allProg.cur}</div>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(["all","pending","approved","featured","rejected"] as const).map(f=>{
          const cfg=SC[f as S]||{c:"var(--brand)",bg:"var(--brand-muted)"};
          return <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,cursor:"pointer",border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`,background:filter===f?cfg.bg:"transparent",color:filter===f?cfg.c:"var(--text-3)",transition:"all .15s"}}>
            {f==="all"?"All":cfg.label} ({counts[f]||0})
          </button>;
        })}
      </div>

      <div style={{position:"relative"}}>
        <Search size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search title or author…" className="admin-input" style={{paddingLeft:34}}/>
      </div>

      {loading?[1,2,3].map(i=><div key={i} className="skeleton" style={{height:100,borderRadius:"var(--r-lg)"}}/>):
       !filtered.length?<div className="card" style={{padding:"48px",textAlign:"center",color:"var(--text-4)",fontSize:14}}>{arts.length===0?"No articles yet.":"No articles match this filter."}</div>:
       filtered.map(a=>{
         const cfg=SC[a.status]||SC.pending;
         const analy=analyses[a.id];
         const isAna=!!analyzing[a.id];
         const isE=editing===a.id;
         const isX=expanded===a.id;
         return (
           <div key={a.id} className="card" style={{overflow:"hidden",borderLeft:`3px solid ${cfg.c}`,padding:0}}>
             {isE?(
               <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:9}}>
                 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                   <span style={{fontSize:12,fontWeight:700,color:"var(--brand)"}}>Editing #{a.id}</span>
                   <div style={{display:"flex",gap:6}}>
                     <button onClick={async()=>{await patch(a.id,eData);setEditing(null);setEData({});}} className="btn btn-primary btn-xs"><Save size={10}/>Save</button>
                     <button onClick={()=>{setEditing(null);setEData({});}} className="btn btn-ghost btn-xs"><X size={10}/>Cancel</button>
                   </div>
                 </div>
                 <input defaultValue={a.title} onChange={e=>setEData((d:any)=>({...d,title:e.target.value}))} className="admin-input" placeholder="Title"/>
                 <textarea defaultValue={a.blurb} rows={2} onChange={e=>setEData((d:any)=>({...d,blurb:e.target.value}))} className="admin-input" placeholder="Blurb"/>
                 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                   <input defaultValue={a.price} type="number" step="0.001" onChange={e=>setEData((d:any)=>({...d,price:e.target.value}))} className="admin-input" placeholder="Price USDC"/>
                   <input defaultValue={a.category} onChange={e=>setEData((d:any)=>({...d,category:e.target.value}))} className="admin-input" placeholder="Category"/>
                 </div>
                 <textarea defaultValue={content[a.id]||""} rows={6} onChange={e=>setEData((d:any)=>({...d,content:e.target.value}))} className="admin-input" style={{fontFamily:"JetBrains Mono,monospace",fontSize:11}}/>
               </div>
             ):(
               <>
                 <div style={{padding:"14px 16px"}}>
                   <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                     <div style={{flex:1,minWidth:200}}>
                       <div style={{display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center"}}>
                         <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:"var(--r-f)",background:cfg.bg,color:cfg.c}}>{cfg.label}</span>
                         {a.featured&&<span className="badge badge-star" style={{fontSize:9}}>Featured</span>}
                         {a.isResearch&&<span className="badge badge-blue" style={{fontSize:9}}>Research</span>}
                         <span className="badge badge-neutral" style={{fontSize:9}}>{a.category}</span>
                         <span style={{fontSize:9,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace"}}>#{a.id}</span>
                       </div>
                       <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:4,lineHeight:1.3}}>{a.title}</h3>
                       <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.blurb}</p>
                       <div style={{display:"flex",gap:10,fontSize:10,color:"var(--text-4)",flexWrap:"wrap"}}>
                         <span style={{fontFamily:"JetBrains Mono,monospace"}}>{a.authorShort}</span>
                         <span>${a.price}</span>
                         <span>{a.reads} reads · {a.paidCount} paid</span>
                         <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                       <div style={{display:"flex",gap:5}}>
                         <Link href={`/article/${a.id}`} target="_blank" style={{display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",fontSize:10,fontWeight:600,color:"var(--text-3)",textDecoration:"none"}}><Eye size={9}/>View</Link>
                         <button onClick={()=>{setEditing(a.id);loadContent(a.id);}} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer"}}><Edit3 size={9}/>Edit</button>
                       </div>
                       <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                         {a.status!=="approved"&&<button onClick={()=>patch(a.id,{status:"approved",featured:false})} disabled={!!busy} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 7px",borderRadius:"var(--r)",border:"1px solid rgba(5,150,105,.3)",background:"rgba(5,150,105,.08)",fontSize:10,fontWeight:700,color:"#059669",cursor:"pointer"}}><CheckCircle2 size={9}/>Approve</button>}
                         {a.status!=="featured"&&<button onClick={()=>patch(a.id,{status:"featured",featured:true})} disabled={!!busy} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 7px",borderRadius:"var(--r)",border:"1px solid rgba(234,179,8,.3)",background:"rgba(234,179,8,.08)",fontSize:10,fontWeight:700,color:"#ca8a04",cursor:"pointer"}}><Star size={9}/>Feature</button>}
                         {a.status!=="rejected"&&<button onClick={()=>patch(a.id,{status:"rejected"})} disabled={!!busy} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 7px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.08)",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer"}}><Ban size={9}/>Reject</button>}
                         <button onClick={()=>del(a.id)} disabled={!!busy} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 7px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.2)",background:"transparent",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer"}}><Trash2 size={9}/>Del</button>
                       </div>
                     </div>
                   </div>

                   {/* AI Analysis */}
                   <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)"}}>
                     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:analy&&"quality_score" in analy?12:0}}>
                       <div style={{display:"flex",alignItems:"center",gap:6}}>
                         <Brain size={12} style={{color:"var(--brand)"}}/>
                         <span style={{fontSize:11,fontWeight:700,color:"var(--text-3)",fontFamily:"Outfit,sans-serif"}}>AI Analysis</span>
                         {analy?.recommendation&&(
                           <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:"var(--r-f)",background:`${(REC[analy.recommendation]?.c||"#d97706")}18`,color:REC[analy.recommendation]?.c||"#d97706",border:`1px solid ${(REC[analy.recommendation]?.c||"#d97706")}40`}}>
                             {REC[analy.recommendation]?.label||analy.recommendation.toUpperCase()}
                           </span>
                         )}
                       </div>
                       {isAna?(
                         <span style={{fontSize:10,color:"var(--brand)",display:"flex",alignItems:"center",gap:4}}>
                           <div className="spin" style={{width:10,height:10,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%"}}/>Analyzing…
                         </span>
                       ):(
                         <button onClick={()=>runOne(a.id)} disabled={!aiCfg.keySet||!aiCfg.model} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:"var(--r-f)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer"}}>
                           <Zap size={9}/>{analy&&"quality_score" in analy?"Re-analyze":"Run AI Check"}
                         </button>
                       )}
                     </div>

                     {analy&&typeof analy==="object"&&"quality_score" in analy&&(
                       <div style={{display:"flex",gap:12,justifyContent:"space-around",flexWrap:"wrap"}}>
                         <ScoreRing score={analy.quality_score}     label="Quality"      invert={false}/>
                         <ScoreRing score={analy.originality_score} label="Originality"  invert={false}/>
                         <ScoreRing score={analy.ai_score}          label="AI-Generated" invert={true}/>
                         <ScoreRing score={analy.plagiarism_score}  label="Plagiarism"   invert={true}/>
                       </div>
                     )}
                   </div>
                 </div>

                 <div style={{borderTop:"1px solid var(--border)",padding:"6px 16px"}}>
                   <button onClick={()=>loadContent(a.id)} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:600,color:"var(--text-4)",padding:"2px 0"}}>
                     {isX?<ChevronUp size={11}/>:<ChevronDown size={11}/>}{isX?"Hide content":"View content"}
                   </button>
                   {isX&&content[a.id]&&(
                     <pre style={{marginTop:8,padding:"10px 12px",background:"var(--bg-alt)",borderRadius:"var(--r)",fontSize:11,color:"var(--text-3)",lineHeight:1.6,maxHeight:250,overflow:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"JetBrains Mono,monospace"}}>
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
