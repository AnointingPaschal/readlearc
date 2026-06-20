"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, Users, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import { dbFetchArticles, type DBArticle } from "../../lib/chain";

const CATS  = ["All","Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];
const SORTS = ["Newest","Most Read","Lowest Price","Highest Price"];

export default function ExplorePage() {
  const [articles, setArticles] = useState<DBArticle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("All");
  const [sort,     setSort]     = useState("Newest");
  const [error,    setError]    = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    dbFetchArticles({ limit:100 })
      .then(setArticles)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a => {
    const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.blurb.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "All" || a.category === cat;
    return ms && mc;
  }).sort((a,b) => {
    if (sort === "Newest")       return b.timestamp - a.timestamp;
    if (sort === "Most Read")    return b.reads - a.reads;
    if (sort === "Lowest Price") return parseFloat(a.price) - parseFloat(b.price);
    if (sort === "Highest Price")return parseFloat(b.price) - parseFloat(a.price);
    return 0;
  });

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"calc(var(--header-h) + 32px) 14px 60px" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(26px,5vw,44px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:6 }}>Explore Articles</h1>
          <p style={{ color:"var(--text-3)", fontSize:14 }}>Discover stories from writers on Readlearc. Pay in USDC, read instantly.</p>
        </div>

        {error && <div style={{ marginBottom:14, padding:"12px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r-md)", fontSize:13, color:"#dc2626" }}>
          Database error: {error} — check DATABASE_URL in Vercel.
        </div>}

        {/* Search + sort */}
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input type="text" placeholder="Search articles…" value={search} onChange={e=>setSearch(e.target.value)} className="input input-search" style={{ fontSize:14 }}/>
            {search && <button onClick={()=>setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex" }}><X size={14}/></button>}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="input" style={{ width:"auto", paddingLeft:12, paddingRight:32, fontSize:13, cursor:"pointer", height:44, flexShrink:0 }}>
            {SORTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:28 }}>
          {CATS.filter(c => c==="All" || articles.some(a=>a.category===c)).map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ padding:"5px 13px", borderRadius:"var(--r-f)", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s", border:`1.5px solid ${cat===c?"var(--brand)":"var(--border)"}`, background:cat===c?"var(--brand-muted)":"transparent", color:cat===c?"var(--brand)":"var(--text-3)" }}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{ height:240, borderRadius:"var(--r-lg)" }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding:"64px 24px", textAlign:"center" }}>
            <BookOpen size={36} style={{ color:"var(--text-4)", marginBottom:12 }}/>
            <p style={{ fontSize:15, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>
              {articles.length === 0 ? "No approved articles yet" : "No articles match your search"}
            </p>
            <p style={{ fontSize:13, color:"var(--text-4)" }}>
              {articles.length === 0 ? "Submit articles via the Write page — they'll appear after admin approval." : "Try different keywords or category."}
            </p>
          </div>
        ) : (<>
          <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:14, fontWeight:500 }}>{filtered.length} article{filtered.length!==1?"s":""}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {filtered.map(a => (
              <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                <div className="card card-hover" style={{ padding:"20px 18px", height:"100%", display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                    <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
                    <span className="price-tag">${parseFloat(a.price).toFixed(3)} USDC</span>
                  </div>
                  <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                  <p style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6, flex:1, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                  <div style={{ paddingTop:10, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-4)" }}>
                    <Link href={`/profile/${a.authorAddress}`} onClick={e=>e.stopPropagation()} style={{ color:"var(--brand)", textDecoration:"none", fontFamily:"JetBrains Mono,monospace", fontSize:10, fontWeight:600 }}>{a.authorShort}</Link>
                    <span style={{ display:"flex", gap:10 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={9}/>{a.readTime}m</span>
                      <span style={{ display:"flex", alignItems:"center", gap:2 }}><Users size={9}/>{a.reads}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}
