"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../components/ui/Navbar";
import { useAuth } from "../../lib/auth";
import {
  BookOpen, PenLine, Trash2, Edit3, Eye, Clock, TrendingUp,
  Star, FlaskConical, CheckCircle2, AlertCircle, Globe,
  Search, Plus, RefreshCw, DollarSign, Send, FileText,
} from "lucide-react";

interface Article {
  id:string; title:string; blurb:string; price:string;
  category:string; readTime:number; isResearch:boolean;
  authorAddress:string; reads:number; status:string;
  featured:boolean; timestamp:number;
}
interface Draft {
  id:string; title:string; status:string; last_saved:string; created_at:string;
}

const STATUS_STYLE: Record<string,{bg:string;color:string;border:string;label:string}> = {
  approved: { bg:"rgba(5,150,105,.1)",  color:"var(--accent)",  border:"rgba(5,150,105,.25)",  label:"Live"     },
  featured: { bg:"rgba(202,138,4,.1)",  color:"#ca8a04",        border:"rgba(202,138,4,.25)",  label:"Featured" },
  pending:  { bg:"rgba(217,119,6,.1)",  color:"#d97706",        border:"rgba(217,119,6,.25)",  label:"Pending"  },
  rejected: { bg:"rgba(220,38,38,.1)",  color:"#dc2626",        border:"rgba(220,38,38,.25)",  label:"Rejected" },
  draft:    { bg:"var(--bg-alt)",       color:"var(--text-4)",  border:"var(--border)",        label:"Draft"    },
};

export default function MyArticlesPage() {
  const { address, isAuth, requireAuth } = useAuth();
  const [articles, setArticles]  = useState<Article[]>([]);
  const [drafts,   setDrafts]    = useState<Draft[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [search,   setSearch]    = useState("");
  const [filter,   setFilter]    = useState("all");
  const [deleting, setDeleting]  = useState<string|null>(null);
  const [submitting,setSubmitting]= useState<string|null>(null);
  const [success,  setSuccess]   = useState("");
  const [error,    setError]     = useState("");

  const flash = (ok:string|null, err:string|null) => {
    if (ok) { setSuccess(ok); setTimeout(()=>setSuccess(""),4000); }
    if (err){ setError(err);  setTimeout(()=>setError(""),4000); }
  };

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    const [arts, drfs] = await Promise.all([
      fetch(`/api/articles?author=${address.toLowerCase()}&limit=100`).then(r=>r.json()).catch(()=>[]),
      fetch(`/api/drafts?address=${address.toLowerCase()}`).then(r=>r.json()).catch(()=>[]),
    ]);
    setArticles(Array.isArray(arts) ? arts : []);
    setDrafts(Array.isArray(drfs) ? drfs : []);
    setLoading(false);
  }, [address]);

  useEffect(() => { load(); }, [load]);

  async function deleteArticle(id:string, title:string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/articles/${id}`,{method:"DELETE"});
    if (r.ok) { setArticles(p=>p.filter(a=>a.id!==id)); flash(`"${title}" deleted`,null); }
    else flash(null,"Delete failed");
    setDeleting(null);
  }

  async function deleteDraft(id:string, title:string) {
    if (!confirm(`Delete draft "${title}"? This cannot be undone.`)) return;
    setDeleting(`d${id}`);
    const r = await fetch(`/api/drafts/${id}`,{method:"DELETE"});
    if (r.ok) { setDrafts(p=>p.filter(d=>d.id!==id)); flash(`Draft deleted`,null); }
    else flash(null,"Delete failed");
    setDeleting(null);
  }

  async function submitForReview(id:string, title:string) {
    if (!confirm(`Submit "${title}" for review? Once submitted, admin will review before publishing.`)) return;
    setSubmitting(id);
    const r = await fetch(`/api/articles/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"pending"})});
    if (r.ok) { setArticles(p=>p.map(a=>a.id===id?{...a,status:"pending"}:a)); flash("Submitted for review!",null); }
    else flash(null,"Submit failed");
    setSubmitting(null);
  }

  async function submitDraftForReview(draftId:string, title:string) {
    if (!confirm(`Submit "${title||"Untitled"}" for review? Admin will review before publishing.`)) return;
    setSubmitting(`d${draftId}`);
    // Update draft status to pending
    const r = await fetch(`/api/drafts/${draftId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"pending"})});
    if (r.ok) { setDrafts(p=>p.map(d=>d.id===draftId?{...d,status:"pending"}:d)); flash("Research paper submitted for review!",null); }
    else flash(null,"Submit failed");
    setSubmitting(null);
  }

  const filteredArticles = articles.filter(a => {
    if (filter==="drafts") return false; // handled separately
    if (filter!=="all" && a.status!==filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !(a.category||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredDrafts = drafts.filter(d => {
    if (filter!=="all" && filter!=="drafts") return false;
    if (search && !(d.title||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalReads   = articles.reduce((s,a)=>s+(a.reads||0),0);
  const totalEarned  = articles.reduce((s,a)=>s+(parseFloat(a.price||"0")*0.85*(a.reads||0)),0);
  const live         = articles.filter(a=>a.status==="approved"||a.status==="featured").length;
  const pending      = articles.filter(a=>a.status==="pending").length;

  if (!isAuth) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:500,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 16px",textAlign:"center"}}>
        <BookOpen size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",marginBottom:8}}>Sign in to see your articles</h2>
        <button onClick={()=>requireAuth()} className="btn btn-primary btn-lg" style={{width:"100%",justifyContent:"center",marginTop:16}}>Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:960,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 14px calc(var(--bottom-nav-h,0px) + 40px)"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(20px,4vw,26px)",fontWeight:900,color:"var(--text)",letterSpacing:"-.02em",marginBottom:3}}>My Articles</h1>
            <p style={{fontSize:12,color:"var(--text-4)"}}>All your published work and research drafts</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={load} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",cursor:"pointer",fontSize:12,color:"var(--text-3)",fontWeight:600}}>
              <RefreshCw size={13}/>Refresh
            </button>
            <Link href="/write" className="btn btn-secondary" style={{gap:5}}><PenLine size={13}/>Article</Link>
            <Link href="/write/research" className="btn btn-primary" style={{gap:5}}><FlaskConical size={13}/>Research</Link>
          </div>
        </div>

        {/* Banners */}
        {success&&<div style={{padding:"10px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"var(--accent)",display:"flex",gap:7}}><CheckCircle2 size={14}/>{success}</div>}
        {error&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={14}/>{error}</div>}

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:20}}>
          {[
            {label:"Articles",  v:articles.length, color:"var(--brand)",  icon:BookOpen},
            {label:"Research Drafts",v:drafts.length, color:"#4f46e5", icon:FlaskConical},
            {label:"Live",      v:live,            color:"var(--accent)", icon:Globe},
            {label:"Pending",   v:pending,         color:"#d97706",       icon:Clock},
            {label:"Total Reads",v:totalReads,     color:"#0284c7",       icon:TrendingUp},
            {label:"Est. Earnings",v:`$${totalEarned.toFixed(2)}`,color:"var(--accent)",icon:DollarSign},
          ].map(s=>(
            <div key={s.label} className="card" style={{padding:"10px 12px"}}>
              <div style={{width:26,height:26,borderRadius:7,background:`${s.color}15`,border:`1px solid ${s.color}25`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:5}}>
                <s.icon size={12} style={{color:s.color}}/>
              </div>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:s.color,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9,color:"var(--text-4)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:1,minWidth:180}}>
            <Search size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              style={{width:"100%",padding:"8px 12px 8px 32px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:12,color:"var(--text)",outline:"none",boxSizing:"border-box" as const}}/>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["all","approved","pending","rejected","drafts"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{padding:"6px 11px",borderRadius:99,fontSize:10,fontWeight:700,cursor:"pointer",border:"1.5px solid",textTransform:"capitalize",transition:"all .12s",
                  background:filter===f?"var(--brand-muted)":"transparent",
                  color:filter===f?"var(--brand)":"var(--text-4)",
                  borderColor:filter===f?"var(--brand-border)":"var(--border)"
                }}>{f==="approved"?"Live":f}</button>
            ))}
          </div>
        </div>

        {loading?(
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:88,borderRadius:"var(--r-lg)"}}/>)}
          </div>
        ):(
          <>
            {/* ── Research Drafts ── */}
            {(filter==="all"||filter==="drafts") && filteredDrafts.length>0 && (
              <div style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <div style={{width:3,height:18,background:"#4f46e5",borderRadius:2}}/>
                  <FlaskConical size={14} style={{color:"#4f46e5"}}/>
                  <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)"}}>Research Drafts</h2>
                  <span style={{fontSize:11,color:"var(--text-4)"}}>{filteredDrafts.length} draft{filteredDrafts.length!==1?"s":""}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {filteredDrafts.map(d=>(
                    <div key={d.id} className="card" style={{padding:"13px 15px",border:d.status==="pending"?"1.5px solid rgba(217,119,6,.3)":"1.5px solid var(--border)"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,70,229,.1)",border:"1.5px solid rgba(79,70,229,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <FlaskConical size={16} style={{color:"#4f46e5"}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:d.status==="pending"?"rgba(217,119,6,.1)":"rgba(79,70,229,.1)",color:d.status==="pending"?"#d97706":"#4f46e5",border:`1px solid ${d.status==="pending"?"rgba(217,119,6,.25)":"rgba(79,70,229,.2)"}`}}>
                              {d.status==="pending"?"Under Review":"Research Draft"}
                            </span>
                            <span style={{fontSize:10,color:"var(--text-4)"}}>Last saved {new Date(d.last_saved||d.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--text)",marginBottom:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {d.title||"Untitled Research Paper"}
                          </h3>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                          {d.status!=="pending" && (
                            <Link href={`/write/research?draft=${d.id}`} title="Continue editing"
                              style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r)",textDecoration:"none",fontSize:10,fontWeight:700,color:"var(--brand)",whiteSpace:"nowrap"}}>
                              <Edit3 size={11}/>Edit
                            </Link>
                          )}
                          {d.status==="pending" ? (
                            <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r)",fontSize:10,fontWeight:700,color:"#d97706",whiteSpace:"nowrap"}}>
                              <Clock size={10}/>Under Review
                            </div>
                          ) : (
                            <button onClick={()=>submitDraftForReview(d.id,d.title)} disabled={submitting===`d${d.id}`}
                              style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"rgba(5,150,105,.08)",border:"1.5px solid rgba(5,150,105,.2)",borderRadius:"var(--r)",cursor:"pointer",fontSize:10,fontWeight:700,color:"var(--accent)",whiteSpace:"nowrap"}}>
                              {submitting===`d${d.id}`?<RefreshCw size={10} style={{animation:"spin .7s linear infinite"}}/>:<Send size={10}/>}
                              Submit
                            </button>
                          )}
                          <button onClick={()=>deleteDraft(d.id,d.title)} disabled={deleting===`d${d.id}`}
                            style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"rgba(220,38,38,.07)",border:"1.5px solid rgba(220,38,38,.2)",borderRadius:"var(--r)",cursor:"pointer",fontSize:10,fontWeight:700,color:"#dc2626",whiteSpace:"nowrap"}}>
                            {deleting===`d${d.id}`?<RefreshCw size={10} style={{animation:"spin .7s linear infinite"}}/>:<Trash2 size={10}/>}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Published Articles ── */}
            {filter!=="drafts" && (
              <div>
                {filteredDrafts.length>0 && filter==="all" && (
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                    <div style={{width:3,height:18,background:"var(--brand)",borderRadius:2}}/>
                    <BookOpen size={14} style={{color:"var(--brand)"}}/>
                    <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:800,color:"var(--text)"}}>Articles</h2>
                    <span style={{fontSize:11,color:"var(--text-4)"}}>{filteredArticles.length}</span>
                  </div>
                )}
                {!filteredArticles.length?(
                  <div style={{padding:"48px 20px",textAlign:"center",background:"var(--bg-card)",borderRadius:"var(--r-xl)",border:"1.5px dashed var(--border)"}}>
                    <PenLine size={32} style={{color:"var(--text-4)",marginBottom:10}}/>
                    <p style={{fontSize:14,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif",marginBottom:5}}>
                      {search||filter!=="all"?"No articles match":"No articles yet"}
                    </p>
                    <p style={{fontSize:12,color:"var(--text-4)",marginBottom:16}}>Write your first article and start earning USDC</p>
                    <Link href="/write" className="btn btn-primary" style={{gap:5}}><Plus size={13}/>Write First Article</Link>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {filteredArticles.map(a=>{
                      const st = STATUS_STYLE[a.status]||STATUS_STYLE.draft;
                      const isFree = parseFloat(a.price||"0")===0;
                      return (
                        <div key={a.id} className="card" style={{padding:"13px 15px"}}>
                          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
                                <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:st.bg,color:st.color,border:`1px solid ${st.border}`}}>{st.label}</span>
                                {a.category&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}>{a.category}</span>}
                                {a.isResearch&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)",display:"flex",alignItems:"center",gap:3}}><FlaskConical size={7}/>Research</span>}
                                {a.featured&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.3)",display:"flex",alignItems:"center",gap:3}}><Star size={7}/>Featured</span>}
                                <span style={{marginLeft:"auto",fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:900,color:isFree?"var(--text-4)":"var(--accent)"}}>{isFree?"Free":`$${parseFloat(a.price).toFixed(3)}`}</span>
                              </div>
                              <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(12px,2.5vw,14px)",fontWeight:800,color:"var(--text)",lineHeight:1.3,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.title}</h3>
                              <div style={{display:"flex",gap:10,fontSize:10,color:"var(--text-4)",flexWrap:"wrap"}}>
                                <span style={{display:"flex",alignItems:"center",gap:3}}><TrendingUp size={8}/>{a.reads||0} reads</span>
                                <span style={{display:"flex",alignItems:"center",gap:3}}><Clock size={8}/>{a.readTime||0}m</span>
                                <span style={{display:"flex",alignItems:"center",gap:3}}><DollarSign size={8}/>Est. ${(parseFloat(a.price||"0")*0.85*(a.reads||0)).toFixed(2)}</span>
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                              <Link href={`/article/${a.id}`} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",textDecoration:"none",fontSize:10,fontWeight:700,color:"var(--text-3)",whiteSpace:"nowrap"}}>
                                <Eye size={11}/>View
                              </Link>
                              <Link href={`/write/edit/${a.id}`} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r)",textDecoration:"none",fontSize:10,fontWeight:700,color:"var(--brand)",whiteSpace:"nowrap"}}>
                                <Edit3 size={11}/>Edit
                              </Link>
                              {a.status==="draft"&&(
                                <button onClick={()=>submitForReview(a.id,a.title)} disabled={submitting===a.id}
                                  style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"rgba(5,150,105,.08)",border:"1.5px solid rgba(5,150,105,.2)",borderRadius:"var(--r)",cursor:"pointer",fontSize:10,fontWeight:700,color:"var(--accent)",whiteSpace:"nowrap"}}>
                                  {submitting===a.id?<RefreshCw size={10} style={{animation:"spin .7s linear infinite"}}/>:<Send size={10}/>}Submit
                                </button>
                              )}
                              <button onClick={()=>deleteArticle(a.id,a.title)} disabled={deleting===a.id}
                                style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"rgba(220,38,38,.07)",border:"1.5px solid rgba(220,38,38,.2)",borderRadius:"var(--r)",cursor:"pointer",fontSize:10,fontWeight:700,color:"#dc2626",whiteSpace:"nowrap"}}>
                                {deleting===a.id?<RefreshCw size={10} style={{animation:"spin .7s linear infinite"}}/>:<Trash2 size={10}/>}Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
