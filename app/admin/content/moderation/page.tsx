"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CheckCircle2, Ban, Eye, RefreshCw, ExternalLink, Search, Star, ShieldCheck, Bot, Filter, AlertCircle } from "lucide-react";
import Link from "next/link";
import { READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER, getReadProvider } from "../../../../lib/web3";

type Status = "live" | "review" | "removed" | "featured";

const STATUS = {
  live:     { label:"Live",     color:"#059669", bg:"rgba(5,150,105,.08)",  border:"rgba(5,150,105,.2)"  },
  featured: { label:"Featured", color:"#d97706", bg:"rgba(253,186,7,.08)",  border:"rgba(253,186,7,.2)"  },
  review:   { label:"Review",   color:"#6b7280", bg:"var(--bg-alt)",        border:"var(--border)"       },
  removed:  { label:"Removed",  color:"#dc2626", bg:"rgba(220,38,38,.08)",  border:"rgba(220,38,38,.2)"  },
};

export default function ModerationPage() {
  const [articles,   setArticles]   = useState<any[]>([]);
  const [statuses,   setStatuses]   = useState<Record<string, Status>>({});
  const [aiResults,  setAiResults]  = useState<Record<string, any>>({});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("ALL");
  const [actioning,  setActioning]  = useState("");
  const [analyzing,  setAnalyzing]  = useState("");
  const [aiReady,    setAiReady]    = useState(false);

  async function fetchArticles() {
    setLoading(true);
    try {
      if (!READLEARC_ADDRESS) return;
      const prov = getReadProvider();
      const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
      const count = Number(await c.articleCount());
      const arts: any[] = [];
      for (let i = count; i >= Math.max(1, count - 99); i--) {
        try {
          const m = await c.getArticleMetadata(i);
          if (m.id.toString() !== "0") arts.push({
            id: m.id.toString(), title:m.title, blurb:m.blurb, category:m.category,
            price: ethers.formatUnits(m.price,6), reads:Number(m.reads),
            author:m.author, timestamp:Number(m.timestamp),
          });
        } catch {}
      }
      setArticles(arts);

      // Load statuses from API
      const res = await fetch("/api/moderation?action=all");
      const all = await res.json();
      const s: Record<string,Status> = {};
      for (const [id, data] of Object.entries(all as Record<string,any>)) s[id] = data.status;
      setStatuses(s);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchArticles();
    fetch("/api/openrouter/models").then(r=>r.json()).then(d => setAiReady(!!(d.key && d.activeModel && d.autoApprove)));
  }, []);

  async function setStatus(id: string, status: Status) {
    setActioning(id);
    await fetch("/api/moderation", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ articleId:id, status }),
    });
    setStatuses(s => ({ ...s, [id]: status }));
    setTimeout(()=>setActioning(""),400);
  }

  async function analyzeWithAI(article: any) {
    setAnalyzing(article.id);
    try {
      const full = await fetch(`/api/openrouter/moderate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ articleId:article.id, title:article.title, blurb:article.blurb, content:article.blurb }),
      });
      const result = await full.json();
      if (result.error) { alert("AI error: " + result.error); return; }
      setAiResults(r => ({ ...r, [article.id]: result }));
      if (result.decision) {
        const status: Status = result.decision==="APPROVE"?"live":result.decision==="REJECT"?"removed":"review";
        await setStatus(article.id, status);
      }
    } catch(e: any) { alert(e.message); }
    finally { setAnalyzing(""); }
  }

  function getStatus(id: string): Status { return statuses[id] || "live"; }

  const filtered = articles.filter(a => {
    const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="ALL" || getStatus(a.id)===filter;
    return ms && mf;
  });

  const counts = { ALL:articles.length, live:0, featured:0, review:0, removed:0 };
  for (const a of articles) { const s = getStatus(a.id); if (s in counts) (counts as any)[s]++; }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Content Moderation</h1>
          <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>{articles.length} articles on-chain · removals reflected immediately on site</p>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          {aiReady && <span style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--rfull)", fontSize:11, fontWeight:700, color:"#059669" }}><Bot size={11}/>AI Auto-approve ON</span>}
          <button onClick={fetchArticles} disabled={loading} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", border:"1.5px solid var(--border)", background:"var(--bg-alt)", borderRadius:"var(--rfull)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(["ALL","live","featured","review","removed"] as const).map(f => {
          const s = STATUS[f as Status] || { label:"All", color:"var(--brand)", bg:"var(--brand-muted)", border:"var(--border-brand)" };
          return (
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px", borderRadius:"var(--rfull)", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .15s",
              border:`1.5px solid ${filter===f?s.color:"var(--border)"}`,
              background:filter===f?s.bg:"transparent",
              color:filter===f?s.color:"var(--text-3)" }}>
              {f==="ALL"?"All Articles":s.label}
              <span style={{ marginLeft:5, fontSize:10, opacity:.7 }}>({(counts as any)[f]??counts.ALL})</span>
            </button>
          );
        })}
      </div>

      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles…" className="input input-search" style={{ fontSize:13 }}/>
      </div>

      {loading ? <div>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:100, borderRadius:16, marginBottom:10 }}/>)}</div>
      : filtered.length===0 ? (
        <div className="card" style={{ padding:"48px 20px", textAlign:"center" }}>
          <ShieldCheck size={32} style={{ color:"var(--text-4)", marginBottom:12 }}/>
          <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)" }}>{articles.length===0?"No articles published yet":"No articles match this filter"}</p>
        </div>
      ) : filtered.map(a => {
        const status = getStatus(a.id);
        const s      = STATUS[status];
        const ai     = aiResults[a.id];
        const isActioning = actioning===a.id;
        const isAnalyzing = analyzing===a.id;

        return (
          <div key={a.id} className="card" style={{ padding:"16px 18px", borderLeft:`3px solid ${s.color}` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:"flex", gap:7, marginBottom:7, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:"var(--rfull)", background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{s.label}</span>
                  <span className="badge badge-neutral" style={{ fontSize:9, textTransform:"capitalize" }}>{a.category}</span>
                  <span style={{ fontSize:9, fontFamily:"JetBrains Mono,monospace", color:"var(--text-4)" }}>#{a.id}</span>
                  {ai && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:"var(--rfull)", background:ai.decision==="APPROVE"?"rgba(5,150,105,.08)":ai.decision==="REJECT"?"rgba(220,38,38,.08)":"rgba(217,119,6,.08)", color:ai.decision==="APPROVE"?"#059669":ai.decision==="REJECT"?"#dc2626":"#d97706", border:`1px solid ${ai.decision==="APPROVE"?"rgba(5,150,105,.2)":ai.decision==="REJECT"?"rgba(220,38,38,.2)":"rgba(217,119,6,.2)"}` }}>AI: {ai.decision} ({ai.confidence}%)</span>}
                </div>
                <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:5, lineHeight:1.3 }}>{a.title}</h3>
                <p style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.5, marginBottom:7, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                <div style={{ display:"flex", gap:12, fontSize:10, color:"var(--text-4)", flexWrap:"wrap" }}>
                  <Link href={`/profile/${a.author}`} style={{ color:"var(--brand)", textDecoration:"none", fontFamily:"JetBrains Mono,monospace" }}>{a.author.slice(0,10)}…</Link>
                  <span>${a.price} USDC</span>
                  <span>{a.reads} reads</span>
                  <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                </div>
                {ai?.reasons && <div style={{ marginTop:7, fontSize:10, color:"var(--text-3)", lineHeight:1.6 }}><strong>AI says:</strong> {ai.summary} · <span style={{ color:ai.aiGenerated?"#dc2626":"#059669" }}>{ai.aiGenerated?"AI-generated":"Human-written"}</span></div>}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                <Link href={`/article/${a.id}`} target="_blank" style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid var(--border)", background:"var(--bg-alt)", fontSize:10, fontWeight:600, color:"var(--text-3)", textDecoration:"none" }}>
                  <Eye size={10}/>View
                </Link>

                {status!=="featured" && <button onClick={()=>setStatus(a.id,"featured")} disabled={isActioning} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid rgba(253,186,7,.3)", background:"rgba(253,186,7,.06)", fontSize:10, fontWeight:700, color:"#d97706", cursor:"pointer", opacity:isActioning?.5:1 }}>
                  <Star size={10}/>Feature
                </button>}
                {status!=="live" && <button onClick={()=>setStatus(a.id,"live")} disabled={isActioning} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid rgba(5,150,105,.3)", background:"rgba(5,150,105,.06)", fontSize:10, fontWeight:700, color:"#059669", cursor:"pointer", opacity:isActioning?.5:1 }}>
                  <CheckCircle2 size={10}/>Approve
                </button>}
                {status!=="review" && <button onClick={()=>setStatus(a.id,"review")} disabled={isActioning} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid rgba(107,114,128,.3)", background:"rgba(107,114,128,.06)", fontSize:10, fontWeight:700, color:"#6b7280", cursor:"pointer", opacity:isActioning?.5:1 }}>
                  <Filter size={10}/>Review
                </button>}
                {status!=="removed" && <button onClick={()=>setStatus(a.id,"removed")} disabled={isActioning} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid rgba(220,38,38,.3)", background:"rgba(220,38,38,.06)", fontSize:10, fontWeight:700, color:"#dc2626", cursor:"pointer", opacity:isActioning?.5:1 }}>
                  <Ban size={10}/>Remove
                </button>}

                <button onClick={()=>analyzeWithAI(a)} disabled={isAnalyzing||!aiReady} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid var(--border-brand)", background:"var(--brand-muted)", fontSize:10, fontWeight:700, color:"var(--brand)", cursor:aiReady?"pointer":"not-allowed", opacity:(isAnalyzing||!aiReady)?.5:1 }}>
                  {isAnalyzing?<><div style={{ width:9,height:9,border:"1.5px solid var(--brand)",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>Analyzing…</>:<><Bot size={10}/>Analyze AI</>}
                </button>

                <a href={`${ARC_EXPLORER}/tx/${a.id}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r2)", border:"1px solid var(--border)", background:"transparent", fontSize:10, color:"var(--text-4)", textDecoration:"none" }}>
                  <ExternalLink size={9}/>On-chain
                </a>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:11, color:"var(--text-4)", padding:"10px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", lineHeight:1.6 }}>
        <strong style={{ color:"var(--text-3)" }}>Article removal:</strong> Removed articles display a "Content Removed" page to readers. Content remains on-chain (immutable) but is blocked at the frontend. Status resets on server restart — for permanent moderation, set up a database.
      </div>
    </div>
  );
}
