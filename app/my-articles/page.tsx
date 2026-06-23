"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../components/ui/Navbar";
import { useAuth } from "../../lib/auth";
import {
  BookOpen, PenLine, Trash2, Edit3, Eye, Clock, TrendingUp,
  Star, FlaskConical, CheckCircle2, AlertCircle, Globe, Lock,
  Search, Filter, Plus, RefreshCw, DollarSign,
} from "lucide-react";

interface Article {
  id: string; title: string; blurb: string; price: string;
  category: string; readTime: number; isResearch: boolean;
  authorAddress: string; reads: number; status: string;
  featured: boolean; timestamp: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  approved:  { bg:"rgba(5,150,105,.1)",  color:"var(--accent)",  border:"rgba(5,150,105,.25)", label:"Live"    },
  featured:  { bg:"rgba(202,138,4,.1)",  color:"#ca8a04",        border:"rgba(202,138,4,.25)", label:"Featured"},
  pending:   { bg:"rgba(217,119,6,.1)",  color:"#d97706",        border:"rgba(217,119,6,.25)", label:"Pending" },
  rejected:  { bg:"rgba(220,38,38,.1)",  color:"#dc2626",        border:"rgba(220,38,38,.25)", label:"Rejected"},
  draft:     { bg:"var(--bg-alt)",       color:"var(--text-4)",  border:"var(--border)",       label:"Draft"   },
};

export default function MyArticlesPage() {
  const { address, isAuth, requireAuth } = useAuth();

  const [articles, setArticles]  = useState<Article[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [search,   setSearch]    = useState("");
  const [filter,   setFilter]    = useState("all");
  const [deleting, setDeleting]  = useState<string | null>(null);
  const [success,  setSuccess]   = useState("");
  const [error,    setError]     = useState("");

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    const r = await fetch(`/api/articles?author=${address.toLowerCase()}&limit=100`).then(r => r.json()).catch(() => []);
    setArticles(Array.isArray(r) ? r : []);
    setLoading(false);
  }, [address]);

  useEffect(() => { load(); }, [load]);

  async function deleteArticle(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id); setError("");
    const r = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (r.ok) {
      setSuccess(`"${title}" deleted`);
      setArticles(p => p.filter(a => a.id !== id));
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Delete failed");
    }
    setDeleting(null);
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  }

  const filtered = articles.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || (a.category||"").toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const total     = articles.length;
  const live      = articles.filter(a => a.status === "approved" || a.status === "featured").length;
  const pending   = articles.filter(a => a.status === "pending").length;
  const totalReads= articles.reduce((s, a) => s + (a.reads || 0), 0);
  const totalEarned = articles.reduce((s, a) => s + (parseFloat(a.price||"0") * 0.85 * (a.reads||0)), 0);

  if (!isAuth) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:500, margin:"0 auto", padding:"calc(var(--header-h) + 60px) 16px", textAlign:"center" }}>
        <BookOpen size={40} style={{ color:"var(--text-4)", marginBottom:14 }}/>
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Sign in to see your articles</h2>
        <button onClick={() => requireAuth()} className="btn btn-primary btn-lg" style={{ width:"100%", justifyContent:"center", marginTop:16 }}>Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:940, margin:"0 auto", padding:"calc(var(--header-h) + 20px) 14px calc(var(--bottom-nav-h,0px) + 40px)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-.02em", marginBottom:3 }}>My Articles</h1>
            <p style={{ fontSize:12, color:"var(--text-4)" }}>Manage, edit and track all your published work</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={load} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", cursor:"pointer", fontSize:12, color:"var(--text-3)", fontWeight:600 }}>
              <RefreshCw size={13}/>Refresh
            </button>
            <Link href="/write" className="btn btn-primary" style={{ gap:6 }}>
              <Plus size={14}/>Write New
            </Link>
          </div>
        </div>

        {/* Banners */}
        {success && <div style={{ padding:"10px 14px", background:"rgba(5,150,105,.07)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-md)", marginBottom:14, fontSize:13, color:"var(--accent)", display:"flex", gap:7 }}><CheckCircle2 size={14}/>{success}</div>}
        {error   && <div style={{ padding:"10px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.2)", borderRadius:"var(--r-md)", marginBottom:14, fontSize:13, color:"#dc2626",  display:"flex", gap:7 }}><AlertCircle size={14}/>{error}</div>}

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:20 }}>
          {[
            { label:"Total Articles", v:total,                 color:"var(--brand)",  icon:BookOpen    },
            { label:"Live",           v:live,                  color:"var(--accent)", icon:Globe       },
            { label:"Pending",        v:pending,               color:"#d97706",       icon:Clock       },
            { label:"Total Reads",    v:totalReads,            color:"#0284c7",       icon:TrendingUp  },
            { label:"Est. Earnings",  v:`$${totalEarned.toFixed(2)}`, color:"var(--accent)", icon:DollarSign },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:"12px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${s.color}15`, border:`1px solid ${s.color}25`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <s.icon size={13} style={{ color:s.color }}/>
                </div>
              </div>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:"var(--text-4)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:180 }}>
            <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your articles…"
              style={{ width:"100%", padding:"8px 12px 8px 32px", background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", fontSize:12, color:"var(--text)", outline:"none", boxSizing:"border-box" as const }}/>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {["all","approved","featured","pending","rejected","draft"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:"6px 12px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer", border:"1.5px solid", transition:"all .12s",
                  background: filter===f ? "var(--brand-muted)" : "transparent",
                  color:      filter===f ? "var(--brand)" : "var(--text-4)",
                  borderColor:filter===f ? "var(--brand-border)" : "var(--border)",
                  textTransform:"capitalize",
                }}>{f==="all"?"All":f==="approved"?"Live":f}</button>
            ))}
          </div>
          <span style={{ fontSize:11, color:"var(--text-4)", whiteSpace:"nowrap" }}>{filtered.length} article{filtered.length!==1?"s":""}</span>
        </div>

        {/* Articles list */}
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:90, borderRadius:"var(--r-lg)" }}/>)}
          </div>
        ) : !filtered.length ? (
          <div style={{ padding:"56px 20px", textAlign:"center", background:"var(--bg-card)", borderRadius:"var(--r-xl)", border:"1.5px dashed var(--border)" }}>
            <PenLine size={36} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:15, fontWeight:700, color:"var(--text)", fontFamily:"Outfit,sans-serif", marginBottom:6 }}>
              {search || filter!=="all" ? "No articles match your filter" : "You haven't written anything yet"}
            </p>
            <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:20 }}>
              {search || filter!=="all" ? "Try clearing your filters" : "Write your first article and start earning USDC"}
            </p>
            <Link href="/write" className="btn btn-primary" style={{ gap:6 }}><Plus size={14}/>Write First Article</Link>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(a => {
              const st = STATUS_STYLE[a.status] || STATUS_STYLE.draft;
              const isFree = parseFloat(a.price||"0") === 0;
              return (
                <div key={a.id} className="card" style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>

                    {/* Left: content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Badges row */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:7, alignItems:"center" }}>
                        {/* Status badge */}
                        <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                        {a.category && (
                          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"var(--brand-muted)", color:"var(--brand)", border:"1px solid var(--brand-border)" }}>
                            {a.category}
                          </span>
                        )}
                        {a.isResearch && (
                          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"rgba(2,132,199,.1)", color:"#0284c7", border:"1px solid rgba(2,132,199,.2)", display:"flex", alignItems:"center", gap:3 }}>
                            <FlaskConical size={8}/>Research
                          </span>
                        )}
                        {a.featured && (
                          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"rgba(202,138,4,.1)", color:"#ca8a04", border:"1px solid rgba(202,138,4,.25)", display:"flex", alignItems:"center", gap:3 }}>
                            <Star size={7}/>Featured
                          </span>
                        )}
                        <span style={{ marginLeft:"auto", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:900, color: isFree ? "var(--text-4)" : "var(--accent)" }}>
                          {isFree ? "Free" : `$${parseFloat(a.price).toFixed(3)}`}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(13px,2.5vw,15px)", fontWeight:800, color:"var(--text)", lineHeight:1.3, marginBottom:5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>
                        {a.title}
                      </h3>

                      {/* Blurb */}
                      {a.blurb && (
                        <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.55, marginBottom:8, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>
                          {a.blurb}
                        </p>
                      )}

                      {/* Meta */}
                      <div style={{ display:"flex", gap:12, fontSize:10, color:"var(--text-4)", flexWrap:"wrap" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><TrendingUp size={9}/>{a.reads||0} reads</span>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={9}/>{a.readTime||0}m read</span>
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}><DollarSign size={9}/>Est. ${((parseFloat(a.price||"0")*0.85*(a.reads||0))).toFixed(2)} earned</span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                      {/* View */}
                      <Link href={`/article/${a.id}`} title="View article"
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 11px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", textDecoration:"none", fontSize:11, fontWeight:700, color:"var(--text-3)", transition:"all .12s", whiteSpace:"nowrap" }}>
                        <Eye size={12}/>View
                      </Link>
                      {/* Edit */}
                      <Link href={`/write/edit/${a.id}`} title="Edit article"
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 11px", background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", borderRadius:"var(--r)", textDecoration:"none", fontSize:11, fontWeight:700, color:"var(--brand)", transition:"all .12s", whiteSpace:"nowrap" }}>
                        <Edit3 size={12}/>Edit
                      </Link>
                      {/* Delete */}
                      <button onClick={() => deleteArticle(a.id, a.title)} disabled={deleting===a.id} title="Delete article"
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 11px", background:"rgba(220,38,38,.07)", border:"1.5px solid rgba(220,38,38,.2)", borderRadius:"var(--r)", cursor:"pointer", fontSize:11, fontWeight:700, color:"#dc2626", transition:"all .12s", whiteSpace:"nowrap" }}>
                        {deleting===a.id ? <RefreshCw size={11} style={{ animation:"spin .7s linear infinite" }}/> : <Trash2 size={12}/>}
                        {deleting===a.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
