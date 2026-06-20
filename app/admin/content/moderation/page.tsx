"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Ban, Eye, RefreshCw, Search, Star, Trash2, Edit3, X, Save, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type Status = "pending"|"approved"|"rejected"|"featured";
const STATUS_CFG: Record<Status,{label:string;c:string;bg:string;b:string}> = {
  pending:  { label:"Pending",  c:"#d97706", bg:"rgba(217,119,6,.08)",  b:"rgba(217,119,6,.22)"  },
  approved: { label:"Approved", c:"#059669", bg:"rgba(5,150,105,.08)",  b:"rgba(5,150,105,.22)"  },
  featured: { label:"Featured", c:"#ca8a04", bg:"rgba(234,179,8,.08)",  b:"rgba(234,179,8,.22)"  },
  rejected: { label:"Rejected", c:"#dc2626", bg:"rgba(220,38,38,.08)",  b:"rgba(220,38,38,.22)"  },
};

interface Article {
  id:string; title:string; blurb:string; price:string; category:string;
  readTime:number; isResearch:boolean; authorAddress:string; authorShort:string;
  status:Status; featured:boolean; reads:number; paidCount:number; timestamp:number;
}

export default function ModerationPage() {
  const [articles, setArticles]  = useState<Article[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [search,   setSearch]    = useState("");
  const [filter,   setFilter]    = useState<"all"|Status>("all");
  const [acting,   setActing]    = useState("");
  const [editing,  setEditing]   = useState<string|null>(null);
  const [editData, setEditData]  = useState<any>({});
  const [expanded, setExpanded]  = useState<string|null>(null);
  const [fullContent, setFullContent] = useState<Record<string,string>>({});
  const [dbError,  setDbError]   = useState("");

  const load = useCallback(async (f=filter, s=search) => {
    setLoading(true); setDbError("");
    try {
      const p = new URLSearchParams({ limit:"200" });
      if (f !== "all") p.set("status", f);
      if (s) p.set("q", s);
      const res = await fetch(`/api/admin/articles?${p}`);
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      setArticles(await res.json());
    } catch(e:any) { setDbError(e.message); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(()=>{ load(); },[]);

  async function applyStatus(id:string, status:Status, featured?:boolean) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status, ...(featured!==undefined&&{featured}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setArticles(prev => prev.map(a => a.id===id ? {...a, status, featured:featured??a.featured} : a));
    } catch(e:any) { alert("Error: "+e.message); }
    finally { setActing(""); }
  }

  async function deleteArticle(id:string) {
    if (!confirm("Permanently delete this article and all its comments/reactions?")) return;
    setActing(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method:"DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setArticles(prev => prev.filter(a => a.id!==id));
    } catch(e:any) { alert("Error: "+e.message); }
    finally { setActing(""); }
  }

  async function saveEdit(id:string) {
    setActing(id);
    try {
      const payload: any = {};
      if (editData.title    !== undefined) payload.title    = editData.title;
      if (editData.blurb    !== undefined) payload.blurb    = editData.blurb;
      if (editData.price    !== undefined) payload.price    = parseFloat(editData.price);
      if (editData.category !== undefined) payload.category = editData.category;
      if (editData.content  !== undefined) payload.content  = editData.content;

      const res = await fetch(`/api/admin/articles/${id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setArticles(prev => prev.map(a => a.id===id ? {...a, ...payload, price:String(payload.price??a.price)} : a));
      if (editData.content) setFullContent(c => ({...c, [id]: editData.content}));
      setEditing(null); setEditData({});
    } catch(e:any) { alert("Error: "+e.message); }
    finally { setActing(""); }
  }

  async function loadContent(id:string) {
    if (fullContent[id]) { setExpanded(expanded===id?null:id); return; }
    try {
      const res = await fetch(`/api/articles/${id}?admin=1`);
      const data = await res.json();
      setFullContent(c => ({...c, [id]: data.content || ""}));
      setExpanded(id);
    } catch {}
  }

  const counts: Record<string,number> = { all: articles.length };
  for(const a of articles) counts[a.status] = (counts[a.status]||0)+1;

  const filtered = articles.filter(a => {
    const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.authorAddress.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || a.status===filter;
    return ms && mf;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Content Moderation</h1>
          <p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>{articles.length} articles in database</p>
        </div>
        <button onClick={()=>load(filter,search)} disabled={loading} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1.5px solid var(--border)", background:"var(--bg-alt)", borderRadius:"var(--r-f)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      {dbError && (
        <div style={{ padding:"12px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r-md)", display:"flex", gap:8 }}>
          <AlertCircle size={14} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/>
          <span style={{ fontSize:12, color:"#dc2626" }}>{dbError} — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.</span>
        </div>
      )}

      {/* Status filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(["all","pending","approved","featured","rejected"] as const).map(f => {
          const cfg = STATUS_CFG[f as Status] || { label:"All", c:"var(--brand)", bg:"var(--brand-muted)", b:"var(--brand-border)" };
          return (
            <button key={f} onClick={()=>{ setFilter(f); load(f,search); }}
              style={{ padding:"5px 12px", borderRadius:"var(--r-f)", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .15s",
                border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`, background:filter===f?cfg.bg:"transparent", color:filter===f?cfg.c:"var(--text-3)" }}>
              {f==="all"?"All":cfg.label} <span style={{ fontSize:10, opacity:.65 }}>({counts[f]||0})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
        <input value={search} onChange={e=>{setSearch(e.target.value); load(filter,e.target.value);}}
          placeholder="Search by title or author address…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      {/* Articles list */}
      {loading
        ? <div>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:100, borderRadius:"var(--r-lg)", marginBottom:10 }}/>)}</div>
        : filtered.length===0
        ? <div className="card" style={{ padding:"48px 20px", textAlign:"center" }}>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)" }}>
              {dbError ? "Cannot load — check database connection" : articles.length===0 ? "No articles yet. Writers submit via the Write page." : "No articles match this filter."}
            </p>
          </div>
        : filtered.map(a => {
            const s   = STATUS_CFG[a.status] || STATUS_CFG.pending;
            const isE = editing === a.id;
            const isX = expanded === a.id;
            return (
              <div key={a.id} className="card" style={{ padding:0, overflow:"hidden", borderLeft:`3px solid ${s.c}` }}>

                {isE ? (
                  /* ── Edit form ── */
                  <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--brand)" }}>Editing article #{a.id}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>saveEdit(a.id)} disabled={!!acting} className="btn btn-primary btn-xs">
                          {acting===a.id?<><div style={{ width:9,height:9,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={10}/>Save</>}
                        </button>
                        <button onClick={()=>{setEditing(null);setEditData({});}} className="btn btn-ghost btn-xs"><X size={10}/>Cancel</button>
                      </div>
                    </div>
                    <input defaultValue={a.title} placeholder="Title" onChange={e=>setEditData((d:any)=>({...d,title:e.target.value}))} className="admin-input"/>
                    <textarea defaultValue={a.blurb} placeholder="Blurb" rows={2} onChange={e=>setEditData((d:any)=>({...d,blurb:e.target.value}))} className="admin-input"/>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <input defaultValue={a.price} type="number" step="0.001" placeholder="Price USDC" onChange={e=>setEditData((d:any)=>({...d,price:e.target.value}))} className="admin-input"/>
                      <input defaultValue={a.category} placeholder="Category" onChange={e=>setEditData((d:any)=>({...d,category:e.target.value}))} className="admin-input"/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5, fontFamily:"Outfit,sans-serif" }}>
                        Full Content (optional — leave blank to keep existing)
                      </label>
                      <textarea defaultValue={fullContent[a.id]||""} placeholder="Article content (markdown)…" rows={8} onChange={e=>setEditData((d:any)=>({...d,content:e.target.value}))}
                        className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, lineHeight:1.7 }}/>
                    </div>
                  </div>
                ) : (
                  /* ── Article row ── */
                  <div>
                    <div style={{ padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:"flex", gap:5, marginBottom:7, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:"var(--r-f)", background:s.bg, color:s.c, border:`1px solid ${s.b}`, fontFamily:"Outfit,sans-serif" }}>{s.label}</span>
                          {a.featured  && <span className="badge badge-star">Featured</span>}
                          {a.isResearch && <span className="badge badge-blue">Research</span>}
                          <span className="badge badge-neutral" style={{ textTransform:"capitalize" }}>{a.category}</span>
                          <span style={{ fontSize:9, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace" }}>#{a.id}</span>
                        </div>
                        <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4, lineHeight:1.3 }}>{a.title}</h3>
                        <p style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.5, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                        <div style={{ display:"flex", gap:12, fontSize:10, color:"var(--text-4)", flexWrap:"wrap" }}>
                          <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{a.authorShort}</span>
                          <span>${a.price} USDC</span>
                          <span>{a.reads} reads · {a.paidCount} paid</span>
                          <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                        <Link href={`/article/${a.id}`} target="_blank" style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:"1px solid var(--border)", background:"var(--bg-alt)", fontSize:10, fontWeight:600, color:"var(--text-3)", textDecoration:"none" }}>
                          <Eye size={10}/>Preview
                        </Link>
                        <button onClick={()=>{ setEditing(a.id); setEditData({}); loadContent(a.id); }}
                          style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:"1px solid var(--brand-border)", background:"var(--brand-muted)", fontSize:10, fontWeight:700, color:"var(--brand)", cursor:"pointer" }}>
                          <Edit3 size={10}/>Edit
                        </button>
                        {a.status!=="featured" && (
                          <button onClick={()=>applyStatus(a.id,"featured",true)} disabled={!!acting}
                            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:`1px solid ${STATUS_CFG.featured.b}`, background:STATUS_CFG.featured.bg, fontSize:10, fontWeight:700, color:STATUS_CFG.featured.c, cursor:"pointer", opacity:acting===a.id?.5:1 }}>
                            <Star size={10}/>Feature
                          </button>
                        )}
                        {a.status!=="approved" && (
                          <button onClick={()=>applyStatus(a.id,"approved",false)} disabled={!!acting}
                            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:`1px solid ${STATUS_CFG.approved.b}`, background:STATUS_CFG.approved.bg, fontSize:10, fontWeight:700, color:STATUS_CFG.approved.c, cursor:"pointer", opacity:acting===a.id?.5:1 }}>
                            <CheckCircle2 size={10}/>Approve
                          </button>
                        )}
                        {a.status!=="rejected" && (
                          <button onClick={()=>applyStatus(a.id,"rejected")} disabled={!!acting}
                            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:`1px solid ${STATUS_CFG.rejected.b}`, background:STATUS_CFG.rejected.bg, fontSize:10, fontWeight:700, color:STATUS_CFG.rejected.c, cursor:"pointer", opacity:acting===a.id?.5:1 }}>
                            <Ban size={10}/>Reject
                          </button>
                        )}
                        <button onClick={()=>deleteArticle(a.id)} disabled={!!acting}
                          style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:"var(--r)", border:"1px solid rgba(220,38,38,.3)", background:"rgba(220,38,38,.06)", fontSize:10, fontWeight:700, color:"#dc2626", cursor:"pointer", opacity:acting===a.id?.5:1 }}>
                          {acting===a.id?<div style={{ width:9,height:9,border:"1.5px solid #dc2626",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>:<Trash2 size={10}/>}
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Expandable content preview */}
                    <div style={{ borderTop:"1px solid var(--border)", padding:"6px 16px" }}>
                      <button onClick={()=>loadContent(a.id)} style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:600, color:"var(--text-4)", padding:"2px 0" }}>
                        {isX?<><ChevronUp size={11}/>Hide content</>:<><ChevronDown size={11}/>View full content</>}
                      </button>
                      {isX && fullContent[a.id] && (
                        <div style={{ marginTop:8, padding:"12px 14px", background:"var(--bg-alt)", borderRadius:"var(--r)", fontSize:12, color:"var(--text-3)", lineHeight:1.7, fontFamily:"JetBrains Mono,monospace", maxHeight:300, overflow:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                          {fullContent[a.id]}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
}
