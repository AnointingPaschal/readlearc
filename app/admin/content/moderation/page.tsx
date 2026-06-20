"use client";
import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle2, Ban, Star, Trash2, Edit3, Save, X, Eye, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import Link from "next/link";

type S = "pending"|"approved"|"rejected"|"featured";
const SC:Record<S,{label:string;c:string;bg:string}> = {
  pending: { label:"Pending",  c:"#d97706", bg:"rgba(217,119,6,.09)" },
  approved:{ label:"Approved", c:"#059669", bg:"rgba(5,150,105,.09)"  },
  featured:{ label:"Featured", c:"#ca8a04", bg:"rgba(234,179,8,.09)"  },
  rejected:{ label:"Rejected", c:"#dc2626", bg:"rgba(220,38,38,.09)"  },
};

interface A { id:string;title:string;blurb:string;price:string;category:string;readTime:number;isResearch:boolean;authorAddress:string;authorShort:string;status:S;featured:boolean;reads:number;paidCount:number;timestamp:number; }

export default function ModerationPage() {
  const [arts,    setArts]    = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all"|S>("all");
  const [search,  setSearch]  = useState("");
  const [editing, setEditing] = useState<string|null>(null);
  const [eData,   setEData]   = useState<any>({});
  const [content, setContent] = useState<Record<string,string>>({});
  const [expanded,setExpanded]= useState<string|null>(null);
  const [busy,    setBusy]    = useState("");
  const [err,     setErr]     = useState("");

  async function load() {
    setLoading(true); setErr("");
    const p = new URLSearchParams({ limit:"200" });
    if (filter!=="all") p.set("status",filter);
    if (search) p.set("q",search);
    const r = await fetch(`/api/admin/articles?${p}`);
    const d = await r.json();
    if (!r.ok) { setErr(d.error||"Failed"); setLoading(false); return; }
    setArts(d); setLoading(false);
  }

  useEffect(()=>{ load(); },[]); // eslint-disable-line

  async function patch(id:string, body:any) {
    setBusy(id);
    const r = await fetch(`/api/admin/articles/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d = await r.json();
    if (!r.ok) { alert(d.error); setBusy(""); return; }
    setArts(prev=>prev.map(a=>a.id===id?{...a,...body,price:body.price?String(body.price):a.price}:a));
    setBusy("");
  }

  async function del(id:string) {
    if (!confirm("Delete this article permanently?")) return;
    setBusy(id);
    await fetch(`/api/admin/articles/${id}`,{method:"DELETE"});
    setArts(prev=>prev.filter(a=>a.id!==id));
    setBusy("");
  }

  async function saveEdit(id:string) {
    const u:any={};
    if (eData.title)    u.title=eData.title;
    if (eData.blurb)    u.blurb=eData.blurb;
    if (eData.price)    u.price=parseFloat(eData.price);
    if (eData.category) u.category=eData.category;
    if (eData.content)  u.content=eData.content;
    await patch(id,u);
    setEditing(null); setEData({});
  }

  async function loadContent(id:string) {
    if (content[id]) { setExpanded(expanded===id?null:id); return; }
    const r = await fetch(`/api/articles/${id}?admin=1`);
    const d = await r.json();
    setContent(c=>({...c,[id]:d.content||""}));
    setExpanded(id);
  }

  const filtered = arts.filter(a=>{
    if (filter!=="all"&&a.status!==filter) return false;
    if (search&&!a.title.toLowerCase().includes(search.toLowerCase())&&!a.authorAddress.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts:Record<string,number>={all:arts.length};
  arts.forEach(a=>{ counts[a.status]=(counts[a.status]||0)+1; });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Content Moderation</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:3 }}>{arts.length} articles in database</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={13} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      {err && (
        <div style={{ padding:"12px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",display:"flex",gap:8,fontSize:13,color:"#dc2626" }}>
          <AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>{err} — check Supabase env vars in Vercel.
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(["all","pending","approved","featured","rejected"] as const).map(f=>{
          const cfg = SC[f as S]||{ label:"All", c:"var(--brand)", bg:"var(--brand-muted)" };
          return <button key={f} onClick={()=>{setFilter(f);}} style={{ padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:700,cursor:"pointer",border:`1.5px solid ${filter===f?cfg.c:"var(--border)"}`,background:filter===f?cfg.bg:"transparent",color:filter===f?cfg.c:"var(--text-3)",transition:"all .15s" }}>
            {f==="all"?"All":cfg.label} ({counts[f]||0})
          </button>;
        })}
        <button onClick={load} style={{ padding:"5px 12px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:600,cursor:"pointer",border:"1.5px solid var(--border)",background:"var(--bg-alt)",color:"var(--text-3)" }}>Apply</button>
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search title or author…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      {/* Articles */}
      {loading
        ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:90,borderRadius:"var(--r-lg)" }}/>)
        : !filtered.length
          ? <div className="card" style={{ padding:"48px",textAlign:"center",color:"var(--text-4)",fontSize:14 }}>
              {arts.length===0?"No articles yet. Writers submit via the Write page.":"No articles match this filter."}
            </div>
          : filtered.map(a=>{
              const cfg = SC[a.status]||SC.pending;
              const isE = editing===a.id;
              const isX = expanded===a.id;
              return (
                <div key={a.id} className="card" style={{ overflow:"hidden", borderLeft:`3px solid ${cfg.c}`, padding:0 }}>
                  {isE ? (
                    <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:9 }}>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                        <span style={{ fontSize:12,fontWeight:700,color:"var(--brand)" }}>Editing #{a.id}</span>
                        <div style={{ display:"flex",gap:6 }}>
                          <button onClick={()=>saveEdit(a.id)} disabled={!!busy} className="btn btn-primary btn-xs"><Save size={10}/>Save</button>
                          <button onClick={()=>{setEditing(null);setEData({});}} className="btn btn-ghost btn-xs"><X size={10}/>Cancel</button>
                        </div>
                      </div>
                      <input defaultValue={a.title} onChange={e=>setEData((d:any)=>({...d,title:e.target.value}))} className="admin-input" placeholder="Title" style={{ fontFamily:"Outfit,sans-serif",fontWeight:700 }}/>
                      <textarea defaultValue={a.blurb} rows={2} onChange={e=>setEData((d:any)=>({...d,blurb:e.target.value}))} className="admin-input" placeholder="Blurb"/>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        <input defaultValue={a.price} type="number" step="0.001" onChange={e=>setEData((d:any)=>({...d,price:e.target.value}))} className="admin-input" placeholder="Price"/>
                        <input defaultValue={a.category} onChange={e=>setEData((d:any)=>({...d,category:e.target.value}))} className="admin-input" placeholder="Category"/>
                      </div>
                      <div>
                        <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif",textTransform:"uppercase",letterSpacing:".07em" }}>Full Content</label>
                        <textarea defaultValue={content[a.id]||""} rows={6} onChange={e=>setEData((d:any)=>({...d,content:e.target.value}))} className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,lineHeight:1.6 }} placeholder="Article content (markdown)…"/>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap" }}>
                        <div style={{ flex:1,minWidth:200 }}>
                          <div style={{ display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center" }}>
                            <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:"var(--r-f)",background:cfg.bg,color:cfg.c,fontFamily:"Outfit,sans-serif" }}>{cfg.label}</span>
                            {a.featured&&<span className="badge badge-star">Featured</span>}
                            {a.isResearch&&<span className="badge badge-blue">Research</span>}
                            <span className="badge badge-neutral">{a.category}</span>
                            <span style={{ fontSize:9,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace" }}>#{a.id}</span>
                          </div>
                          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:4,lineHeight:1.3 }}>{a.title}</h3>
                          <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.blurb}</p>
                          <div style={{ display:"flex",gap:12,fontSize:10,color:"var(--text-4)",flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{a.authorShort}</span>
                            <span>${a.price}</span>
                            <span>{a.reads} reads · {a.paidCount} paid</span>
                            <span>{new Date(a.timestamp*1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                          <Link href={`/article/${a.id}`} target="_blank" style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",fontSize:10,fontWeight:600,color:"var(--text-3)",textDecoration:"none" }}><Eye size={10}/>Preview</Link>
                          <button onClick={()=>{setEditing(a.id);setEData({});loadContent(a.id);}} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",fontSize:10,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}><Edit3 size={10}/>Edit</button>
                          {a.status!=="featured"&&<button onClick={()=>patch(a.id,{status:"featured",featured:true})} disabled={busy===a.id} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${SC.featured.bg}`,background:SC.featured.bg,fontSize:10,fontWeight:700,color:SC.featured.c,cursor:"pointer" }}><Star size={10}/>Feature</button>}
                          {a.status!=="approved"&&<button onClick={()=>patch(a.id,{status:"approved",featured:false})} disabled={busy===a.id} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${SC.approved.bg}`,background:SC.approved.bg,fontSize:10,fontWeight:700,color:SC.approved.c,cursor:"pointer" }}><CheckCircle2 size={10}/>Approve</button>}
                          {a.status!=="rejected"&&<button onClick={()=>patch(a.id,{status:"rejected"})} disabled={busy===a.id} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:`1px solid ${SC.rejected.bg}`,background:SC.rejected.bg,fontSize:10,fontWeight:700,color:SC.rejected.c,cursor:"pointer" }}><Ban size={10}/>Reject</button>}
                          <button onClick={()=>del(a.id)} disabled={busy===a.id} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)",fontSize:10,fontWeight:700,color:"#dc2626",cursor:"pointer" }}>{busy===a.id?<span className="spin" style={{ width:9,height:9,border:"1.5px solid #dc2626",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block" }}/>:<Trash2 size={10}/>}Delete</button>
                        </div>
                      </div>
                      <div style={{ borderTop:"1px solid var(--border)",padding:"6px 16px" }}>
                        <button onClick={()=>loadContent(a.id)} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:600,color:"var(--text-4)",padding:"2px 0" }}>
                          {isX?<><ChevronUp size={11}/>Hide content</>:<><ChevronDown size={11}/>View content</>}
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
