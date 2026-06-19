"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CheckCircle2, Ban, Eye, RefreshCw, ExternalLink, Search, Star, ShieldCheck, Bot, Filter, AlertTriangle, Download, Upload } from "lucide-react";
import Link from "next/link";
import { getStatus, setStatus, getMod, importConfig, exportConfig, type ModStatus } from "../../../../lib/moderation";
import { readContract, CONTRACT_ADDRESS, EXPLORER_URL } from "../../../../lib/chain";

const STATUS_CFG = {
  live:     { label:"Live",     c:"#059669", bg:"rgba(5,150,105,.08)",   b:"rgba(5,150,105,.22)"   },
  featured: { label:"Featured", c:"#ca8a04", bg:"rgba(234,179,8,.08)",   b:"rgba(234,179,8,.22)"   },
  review:   { label:"Review",   c:"#6b7280", bg:"var(--bg-alt)",         b:"var(--border)"          },
  removed:  { label:"Removed",  c:"#dc2626", bg:"rgba(220,38,38,.08)",   b:"rgba(220,38,38,.22)"   },
};

export default function ModerationPage() {
  const [articles,  setArticles]  = useState<any[]>([]);
  const [statuses,  setStatuses]  = useState<Record<string,ModStatus>>({});
  const [aiResults, setAiResults] = useState<Record<string,any>>({});
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"ALL"|ModStatus>("ALL");
  const [acting,    setActing]    = useState("");
  const [analyzing, setAnalyzing] = useState("");
  const [aiReady,   setAiReady]   = useState(false);

  const loadStatuses = useCallback(() => {
    setStatuses(getMod());
  }, []);

  async function loadArticles() {
    setLoading(true);
    if (!CONTRACT_ADDRESS) { setLoading(false); return; }
    try {
      const c     = readContract();
      const count = Number(await c.articleCount());
      const arts  = [];
      for (let i = count; i >= Math.max(1, count-99); i--) {
        try {
          const m = await c.getArticleMetadata(i);
          if (m.id.toString()!=="0") arts.push({
            id:m.id.toString(), title:m.title, blurb:m.blurb, category:m.category,
            price:ethers.formatUnits(m.price,6), reads:Number(m.reads),
            author:m.author, timestamp:Number(m.timestamp),
          });
        } catch {}
      }
      setArticles(arts);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    loadStatuses();
    loadArticles();
    fetch("/api/openrouter/models").then(r=>r.json()).then(d=>setAiReady(!!(d.key&&d.activeModel&&d.autoApprove))).catch(()=>{});
  },[]);

  function applyStatus(id: string, status: ModStatus) {
    setActing(id);
    setStatus(id, status); // writes to localStorage + API
    setStatuses(getMod());  // read back immediately
    setTimeout(()=>setActing(""),300);
  }

  async function analyzeWithAI(article: any) {
    setAnalyzing(article.id);
    try {
      const res    = await fetch("/api/openrouter/moderate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({articleId:article.id,title:article.title,blurb:article.blurb,content:article.blurb})});
      const result = await res.json();
      if(result.error){alert("AI error: "+result.error);return;}
      setAiResults(r=>({...r,[article.id]:result}));
      if(result.decision){
        const s: ModStatus = result.decision==="APPROVE"?"live":result.decision==="REJECT"?"removed":"review";
        applyStatus(article.id, s);
      }
    }catch(e:any){alert(e.message);}
    finally{setAnalyzing("");}
  }

  function exportCfg(){
    const blob = new Blob([exportConfig()],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download="readlearc-moderation.json"; a.click();
  }

  function importCfg(){
    const input = document.createElement("input"); input.type="file"; input.accept=".json";
    input.onchange=()=>{
      const file = input.files?.[0]; if(!file) return;
      file.text().then(t=>{importConfig(t);loadStatuses();});
    };
    input.click();
  }

  function gs(id:string): ModStatus { return statuses[id]||"live"; }

  const filtered = articles.filter(a=>{
    const ms = !search||a.title.toLowerCase().includes(search.toLowerCase())||a.author.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="ALL"||gs(a.id)===filter;
    return ms&&mf;
  });

  const counts = {ALL:articles.length,live:0,featured:0,review:0,removed:0} as Record<string,number>;
  for(const a of articles){const s=gs(a.id);counts[s]=(counts[s]||0)+1;}

  const PageHeader = () => (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-0.02em"}}>Content Moderation</h1>
        <p style={{color:"var(--text-4)",fontSize:12,marginTop:3}}>
          {articles.length} on-chain articles · removals apply immediately in this browser
          {aiReady&&<span style={{marginLeft:8,color:"var(--accent)",fontWeight:600}}>· AI auto-approve ON</span>}
        </p>
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        <button onClick={importCfg} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:11,fontWeight:600,color:"var(--text-3)"}}>
          <Upload size={12}/>Import
        </button>
        <button onClick={exportCfg} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:11,fontWeight:600,color:"var(--text-3)"}}>
          <Download size={12}/>Export
        </button>
        <button onClick={loadArticles} disabled={loading} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)"}}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader/>

      {/* Status info box */}
      <div style={{padding:"11px 14px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r)",display:"flex",gap:9,alignItems:"flex-start"}}>
        <AlertTriangle size={13} style={{color:"var(--brand)",flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.65}}>
          <strong style={{color:"var(--brand)"}}>How moderation works:</strong> Status changes save instantly to your browser (localStorage) and apply to this browser immediately. Use <strong>Export</strong> to save a backup, and <strong>Import</strong> to restore on another device. For true cross-browser moderation, connect a database (see docs).
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(["ALL","live","featured","review","removed"] as const).map(f=>{
          const cfg = STATUS_CFG[f as ModStatus]||{label:"All",c:"var(--brand)",bg:"var(--brand-muted)",b:"var(--brand-border)"};
          return <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s",border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`,background:filter===f?cfg.bg:"transparent",color:filter===f?cfg.c:"var(--text-3)"}}>
            {f==="ALL"?"All Articles":cfg.label} <span style={{fontSize:10,opacity:.65}}>({counts[f]??counts.ALL})</span>
          </button>;
        })}
      </div>

      <div style={{position:"relative"}}>
        <Search size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title or author…" className="admin-input" style={{paddingLeft:34,fontSize:13}}/>
      </div>

      {/* Articles */}
      {loading ? <div>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:100,borderRadius:"var(--r-lg)",marginBottom:10}}/>)}</div>
      : filtered.length===0 ? (
        <div className="card" style={{padding:"48px 20px",textAlign:"center"}}>
          <ShieldCheck size={32} style={{color:"var(--text-4)",marginBottom:12}}/>
          <p style={{fontSize:14,fontWeight:600,color:"var(--text-3)"}}>{articles.length===0?"No articles on-chain yet":"No articles match this filter"}</p>
        </div>
      ) : filtered.map(a=>{
        const status = gs(a.id);
        const cfg    = STATUS_CFG[status];
        const ai     = aiResults[a.id];
        return (
          <div key={a.id} className="card" style={{padding:"15px 18px",borderLeft:`3px solid ${cfg.c}`}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:"var(--r-f)",background:cfg.bg,color:cfg.c,border:`1px solid ${cfg.b}`,fontFamily:"Outfit,sans-serif"}}>{cfg.label}</span>
                  <span className="badge badge-neutral" style={{textTransform:"capitalize",fontSize:9}}>{a.category}</span>
                  <span style={{fontSize:9,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace"}}>#{a.id}</span>
                  {ai&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:"var(--r-f)",background:ai.decision==="APPROVE"?"var(--accent-muted)":ai.decision==="REJECT"?"rgba(220,38,38,.08)":"rgba(217,119,6,.08)",color:ai.decision==="APPROVE"?"var(--accent)":ai.decision==="REJECT"?"#dc2626":"#d97706"}}>AI:{ai.decision} {ai.confidence}%</span>}
                </div>
                <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:5,lineHeight:1.3}}>{a.title}</h3>
                <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.blurb}</p>
                <div style={{display:"flex",gap:12,fontSize:10,color:"var(--text-4)",flexWrap:"wrap"}}>
                  <Link href={`/profile/${a.author}`} style={{color:"var(--brand)",textDecoration:"none",fontFamily:"JetBrains Mono,monospace"}}>{a.author.slice(0,10)}…</Link>
                  <span>${a.price}</span><span>{a.reads} reads</span>
                  <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                </div>
                {ai?.summary&&<div style={{marginTop:6,fontSize:11,color:"var(--text-3)",lineHeight:1.55}}><strong>AI:</strong> {ai.summary}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                <Link href={`/article/${a.id}`} target="_blank" style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",fontSize:10,fontWeight:600,color:"var(--text-3)",textDecoration:"none"}}>
                  <Eye size={10}/>View Live
                </Link>
                {status!=="featured"&&<button onClick={()=>applyStatus(a.id,"featured")} disabled={!!acting} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${STATUS_CFG.featured.b}`,background:STATUS_CFG.featured.bg,fontSize:10,fontWeight:700,color:STATUS_CFG.featured.c,cursor:"pointer",opacity:acting===a.id?.5:1}}>
                  <Star size={10}/>Feature
                </button>}
                {status!=="live"&&<button onClick={()=>applyStatus(a.id,"live")} disabled={!!acting} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${STATUS_CFG.live.b}`,background:STATUS_CFG.live.bg,fontSize:10,fontWeight:700,color:STATUS_CFG.live.c,cursor:"pointer",opacity:acting===a.id?.5:1}}>
                  <CheckCircle2 size={10}/>Approve
                </button>}
                {status!=="review"&&<button onClick={()=>applyStatus(a.id,"review")} disabled={!!acting} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${STATUS_CFG.review.b}`,background:STATUS_CFG.review.bg,fontSize:10,fontWeight:700,color:STATUS_CFG.review.c,cursor:"pointer",opacity:acting===a.id?.5:1}}>
                  <Filter size={10}/>Review
                </button>}
                {status!=="removed"&&<button onClick={()=>applyStatus(a.id,"removed")} disabled={!!acting} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${STATUS_CFG.removed.b}`,background:STATUS_CFG.removed.bg,fontSize:10,fontWeight:700,color:STATUS_CFG.removed.c,cursor:"pointer",opacity:acting===a.id?.5:1}}>
                  <Ban size={10}/>Remove
                </button>}
                <button onClick={()=>analyzeWithAI(a)} disabled={analyzing===a.id||!aiReady} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:aiReady?"pointer":"not-allowed",opacity:(analyzing===a.id||!aiReady)?.5:1}}>
                  {analyzing===a.id?<><div style={{width:9,height:9,border:"1.5px solid var(--brand)",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>Analyzing…</>:<><Bot size={10}/>Analyze</>}
                </button>
                <a href={`${EXPLORER_URL}/address/${a.author}`} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"transparent",fontSize:10,color:"var(--text-4)",textDecoration:"none"}}>
                  <ExternalLink size={9}/>Chain
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
