"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, Users, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import { fetchArticles, IS_CONFIGURED, type Article } from "../../lib/chain";

const CATS = ["All","Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];
const SORTS = ["Newest","Most Read","Lowest Price","Highest Price"];

export default function ExplorePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("All");
  const [sort,     setSort]     = useState("Newest");

  useEffect(() => {
    fetchArticles(50).then(setArticles).finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a => {
    const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.blurb.toLowerCase().includes(search.toLowerCase()) || a.authorAddress.toLowerCase().includes(search.toLowerCase());
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
      <SetupBanner />
      <Navbar />
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"80px 16px 60px" }}>
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ marginBottom:36 }}>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(28px,5vw,48px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.03em", marginBottom:8 }}>Explore Articles</h1>
          <p style={{ color:"var(--text-3)", fontSize:15 }}>Discover stories stored permanently on-chain. Pay in USDC, read instantly.</p>
        </motion.div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }} />
            <input type="text" placeholder="Search articles, authors…" value={search} onChange={e => setSearch(e.target.value)} className="input input-search" style={{ fontSize:14 }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <SlidersHorizontal size={15} style={{ color:"var(--text-4)", flexShrink:0 }} />
            <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width:"auto", paddingLeft:12, paddingRight:32, fontSize:13, cursor:"pointer", height:44 }}>
              {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:36 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding:"6px 14px", borderRadius:"var(--rfull)", border:`1.5px solid ${cat===c?"var(--brand)":"var(--border)"}`, background:cat===c?"var(--brand-muted)":"var(--bg-card)", color:cat===c?"var(--brand)":"var(--text-3)", fontWeight:600, fontSize:12, cursor:"pointer", transition:"all .15s" }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:250, borderRadius:20 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding:"80px 24px", textAlign:"center" }}>
            <BookOpen size={40} style={{ color:"var(--text-4)", marginBottom:12 }} />
            <p style={{ fontSize:16, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>
              {!IS_CONFIGURED ? "Contract not configured" : articles.length === 0 ? "No articles yet" : "No articles match your search"}
            </p>
            <p style={{ fontSize:13, color:"var(--text-4)" }}>
              {!IS_CONFIGURED ? "Set your environment variables in Vercel to load articles from the blockchain." : articles.length === 0 ? "Be the first to publish!" : "Try different keywords or category."}
            </p>
          </div>
        ) : (<>
          <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:16, fontWeight:500 }}>{filtered.length} article{filtered.length!==1?"s":""} on-chain</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {filtered.map(a => (
              <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                <div className="card card-hover" style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
                    <span className="price-tag">${a.price} USDC</span>
                  </div>
                  <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:17, fontWeight:700, color:"var(--text)", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                  <p style={{ color:"var(--text-3)", fontSize:13, lineHeight:1.6, flex:1, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                  <div style={{ paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-4)" }}>
                    <Link href={`/profile/${a.authorAddress}`} onClick={e => e.stopPropagation()} style={{ color:"var(--brand)", textDecoration:"none", fontFamily:"JetBrains Mono,monospace", fontSize:11, fontWeight:600 }}>{a.authorShort}</Link>
                    <span style={{ display:"flex", gap:10 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={10}/>{a.readTime}m</span>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}><Users size={10}/>{a.reads}</span>
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
