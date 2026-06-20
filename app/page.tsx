"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Flame, Zap, Star, TrendingUp, ChevronRight, Clock, Users, PenLine, Wallet, Shield, BookOpen, X } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import SetupBanner from "../components/ui/SetupBanner";
import { dbFetchArticles, type DBArticle } from "../lib/chain";

const CATS = ["All","Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];
const fade = { hidden:{opacity:0,y:18}, show:{opacity:1,y:0,transition:{duration:.42,ease:"easeOut" as const}} };
const grid = { hidden:{}, show:{transition:{staggerChildren:.06}} };

function ArticleCard({ a, big=false }: { a: DBArticle; big?: boolean }) {
  const price = parseFloat(a.price);
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none", display:"block", height:"100%" }}>
      <div className="card card-hover" style={{ padding: big ? "clamp(20px,3vw,28px)" : "18px 16px", height:"100%", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6 }}>
          <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{a.category}</span>
          <span className="price-tag">${price.toFixed(3)} USDC</span>
        </div>
        <h3 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, color:"var(--text)", lineHeight:1.28, fontSize: big ? "clamp(17px,2.5vw,21px)" : "15px",
          display:"-webkit-box", WebkitLineClamp:big?3:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>
          {a.title}
        </h3>
        <p style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.65, flex:1,
          display:"-webkit-box", WebkitLineClamp:big?3:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>
          {a.blurb}
        </p>
        <div style={{ paddingTop:10, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Link href={`/profile/${a.authorAddress}`} onClick={e=>e.stopPropagation()}
            style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--brand)", fontWeight:600, textDecoration:"none" }}>
            {a.authorShort}
          </Link>
          <span style={{ display:"flex", gap:10, fontSize:11, color:"var(--text-4)" }}>
            <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={10}/>{a.readTime}m</span>
            <span style={{ display:"flex", alignItems:"center", gap:3 }}><Users size={10}/>{a.reads}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function TrendingCard({ a, rank }: { a: DBArticle; rank: number }) {
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
      <div className="card card-hover" style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"13px 16px" }}>
        <span style={{ fontFamily:"Outfit,sans-serif", fontSize:28, fontWeight:900, color:"var(--border-2)", lineHeight:1, flexShrink:0, width:30 }}>
          {String(rank).padStart(2,"0")}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
            <span className="badge badge-neutral" style={{ textTransform:"capitalize" }}>{a.category}</span>
            <span className="price-tag" style={{ fontSize:10 }}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
          <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", lineHeight:1.32, marginBottom:4,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
          <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.55, marginBottom:5,
            display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
          <div style={{ fontSize:10, color:"var(--text-4)", display:"flex", alignItems:"center", gap:3 }}>
            <TrendingUp size={9}/>{a.reads} reads
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [articles,  setArticles]  = useState<DBArticle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    dbFetchArticles({ limit:100 }).then(setArticles).finally(() => setLoading(false));
  }, []);

  // DB already returns only approved/featured — no client-side moderation needed
  const byCat    = activeCat === "All" ? articles : articles.filter(a => a.category === activeCat);
  const searched = search ? articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.blurb.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const featured = articles.filter(a => a.featured).slice(0, 3);
  const trending = articles.filter(a => !a.featured).sort((a,b) => b.reads - a.reads).slice(0, 6);
  const latest   = [...byCat].sort((a,b) => b.timestamp - a.timestamp).slice(0, 9);
  const catsWithArticles = CATS.filter(c => c === "All" || articles.some(a => a.category === c));

  const Sk = ({ h=220 }: { h?: number }) => <div className="skeleton" style={{ height:h, borderRadius:"var(--r-lg)" }}/>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>

      {/* ── Hero ── */}
      <section style={{ paddingTop:"calc(var(--header-h) + clamp(52px,9vw,88px))", paddingBottom:"clamp(48px,7vw,72px)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize:"56px 56px", opacity:.4, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"-30%", left:"50%", transform:"translateX(-50%)", width:900, height:600, background:"radial-gradient(ellipse,rgba(109,40,217,.09) 0%,transparent 68%)", pointerEvents:"none" }}/>
        <div className="container" style={{ position:"relative" }}>
          <motion.div initial="hidden" animate="show" variants={grid} style={{ textAlign:"center" }}>
            <motion.div variants={fade}>
              <span className="badge badge-brand" style={{ marginBottom:22, display:"inline-flex", gap:5, fontSize:11 }}>
                <Zap size={11} strokeWidth={2.5}/> Built on Arc · Circle USDC · Pay-per-Read
              </span>
            </motion.div>
            <motion.h1 variants={fade} style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(38px,7vw,80px)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.04em", color:"var(--text)", marginBottom:20 }}>
              Pay per word.<br/><span className="grad-text">Own every read.</span>
            </motion.h1>
            <motion.p variants={fade} style={{ fontSize:"clamp(15px,2vw,18px)", color:"var(--text-3)", maxWidth:540, margin:"0 auto 36px", lineHeight:1.72 }}>
              The first blockchain publishing platform where writers earn <strong style={{ color:"var(--accent)", fontWeight:700 }}>85% in USDC instantly</strong>, and readers hold cryptographic proof of every article they unlock.
            </motion.p>
            <motion.div variants={fade} style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:56, flexWrap:"wrap" }}>
              <Link href="/explore" className="btn btn-primary btn-lg">Browse Articles <ArrowRight size={16}/></Link>
              <Link href="/write"   className="btn btn-secondary btn-lg"><PenLine size={15}/>Start Writing</Link>
            </motion.div>
            <motion.div variants={grid} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, maxWidth:780, margin:"0 auto" }}>
              {[
                { icon:Zap,      title:"Sub-second",     desc:"USDC settled on Arc instantly",    color:"var(--brand)"  },
                { icon:Shield,   title:"85% to writers", desc:"Highest creator share in web3",    color:"var(--accent)" },
                { icon:Wallet,   title:"No minimums",    desc:"From $0.001 — true nanopayments",  color:"#0284c7"       },
                { icon:BookOpen, title:"Owned forever",  desc:"Read receipts stored in database", color:"#d97706"       },
              ].map(p => (
                <motion.div key={p.title} variants={fade} className="card" style={{ padding:"18px 16px", textAlign:"center" }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${p.color}12`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
                    <p.icon size={16} style={{ color:p.color }}/>
                  </div>
                  <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{p.title}</div>
                  <div style={{ fontSize:12, color:"var(--text-4)", lineHeight:1.5 }}>{p.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Search + Categories ── */}
      <div style={{ background:"var(--bg-card)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", position:"sticky", top:"var(--header-h)", zIndex:30 }}>
        <div className="container" style={{ paddingTop:12, paddingBottom:12, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ position:"relative" }}>
            <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles, topics, writers…"
              style={{ width:"100%", height:44, paddingLeft:44, paddingRight:search?40:14, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-f)", fontSize:14, color:"var(--text)", outline:"none", transition:"border-color .15s, box-shadow .15s" }}
              onFocus={e=>{(e.target as any).style.borderColor="var(--brand)";(e.target as any).style.boxShadow="0 0 0 3px rgba(109,40,217,.08)"}}
              onBlur={e=>{(e.target as any).style.borderColor="var(--border)";(e.target as any).style.boxShadow="none"}}
            />
            {search && <button onClick={()=>setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex" }}><X size={15}/></button>}
          </div>
          {!search && (
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
              {catsWithArticles.map(c => (
                <button key={c} onClick={()=>setActiveCat(c)} style={{ padding:"5px 13px", borderRadius:"var(--r-f)", fontSize:12, fontWeight:600, whiteSpace:"nowrap", cursor:"pointer", transition:"all .15s", flexShrink:0,
                  border:`1.5px solid ${activeCat===c?"var(--brand)":"var(--border)"}`, background:activeCat===c?"var(--brand-muted)":"transparent", color:activeCat===c?"var(--brand)":"var(--text-3)" }}>
                  {c}{c!=="All" && <span style={{ opacity:.6, fontSize:10, marginLeft:3 }}>({articles.filter(a=>a.category===c).length})</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {search && (
        <section style={{ padding:"clamp(24px,4vw,40px) 0", background:"var(--bg-alt)", borderBottom:"1px solid var(--border)" }}>
          <div className="container">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <Search size={14} style={{ color:"var(--brand)" }}/>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:16, fontWeight:700, color:"var(--text)" }}>
                {searched.length} result{searched.length!==1?"s":""} for "<span style={{ color:"var(--brand)" }}>{search}</span>"
              </h2>
            </div>
            {searched.length===0
              ? <p style={{ color:"var(--text-4)", fontSize:14 }}>No articles found. Try different keywords.</p>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                  {searched.slice(0,9).map(a => <ArticleCard key={a.id} a={a}/>)}
                </div>
            }
          </div>
        </section>
      )}

      {!search && (<>
        {/* ── Featured ── */}
        {(loading || featured.length > 0) && (
          <section style={{ padding:"clamp(40px,6vw,60px) 0" }}>
            <div className="container">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:30,height:30,borderRadius:8,background:"rgba(234,179,8,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Star size={14} style={{ color:"#ca8a04" }}/></div>
                  <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Featured</h2>
                </div>
                <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)", fontWeight:700 }}>View all <ChevronRight size={13}/></Link>
              </div>
              {loading
                ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{[1,2,3].map(i=><Sk key={i} h={260}/>)}</div>
                : featured.length === 0
                  ? <div className="card" style={{ padding:"40px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>No featured articles yet — feature them from the admin panel.</div>
                  : <motion.div initial="hidden" animate="show" variants={grid} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                      {featured.map(a => <motion.div key={a.id} variants={fade}><ArticleCard a={a} big/></motion.div>)}
                    </motion.div>
              }
            </div>
          </section>
        )}

        {/* ── Trending ── */}
        <section style={{ padding:"clamp(40px,6vw,60px) 0", background:"var(--bg-alt)" }}>
          <div className="container">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:"rgba(217,119,6,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Flame size={14} style={{ color:"#d97706" }}/></div>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Trending</h2>
              </div>
              <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)", fontWeight:700 }}>View all <ChevronRight size={13}/></Link>
            </div>
            {loading
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>{[1,2,3,4,5,6].map(i=><Sk key={i} h={120}/>)}</div>
              : trending.length === 0
                ? <div className="card" style={{ padding:"36px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>No articles yet — <Link href="/write" style={{ color:"var(--brand)", fontWeight:600 }}>write the first one</Link>.</div>
                : <motion.div initial="hidden" animate="show" variants={grid} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                    {trending.map((a,i) => <motion.div key={a.id} variants={fade}><TrendingCard a={a} rank={i+1}/></motion.div>)}
                  </motion.div>
            }
          </div>
        </section>

        {/* ── Latest ── */}
        <section style={{ padding:"clamp(40px,6vw,60px) 0" }}>
          <div className="container">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:"rgba(5,150,105,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={14} style={{ color:"var(--accent)" }}/></div>
                <div>
                  <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>
                    {activeCat==="All" ? "Latest Articles" : activeCat}
                  </h2>
                  {activeCat!=="All" && <p style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>{latest.length} article{latest.length!==1?"s":""}</p>}
                </div>
              </div>
              <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)", fontWeight:700 }}>View all <ChevronRight size={13}/></Link>
            </div>
            {loading
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{[1,2,3,4].map(i=><Sk key={i}/>)}</div>
              : latest.length === 0
                ? <div className="card" style={{ padding:"36px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>No articles in this category yet.</div>
                : <motion.div initial="hidden" animate="show" variants={grid} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                    {latest.map(a => <motion.div key={a.id} variants={fade}><ArticleCard a={a}/></motion.div>)}
                  </motion.div>
            }
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding:"clamp(40px,6vw,60px) 0", background:"var(--bg-alt)", borderTop:"1px solid var(--border)" }}>
          <div className="container">
            <div style={{ borderRadius:"var(--r-xl)", padding:"clamp(32px,5vw,52px) clamp(24px,5vw,52px)", background:"linear-gradient(135deg,var(--brand),var(--brand-d))", boxShadow:"var(--shadow-brand)", textAlign:"center", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,.05)", pointerEvents:"none" }}/>
              <div style={{ position:"relative" }}>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(26px,5vw,46px)", fontWeight:900, color:"white", letterSpacing:"-0.03em", marginBottom:12 }}>Start earning in USDC today</h2>
                <p style={{ color:"rgba(255,255,255,.75)", fontSize:16, marginBottom:28, lineHeight:1.6 }}>Write one article. Set your price. Earn 85% of every read — forever.</p>
                <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                  <Link href="/write" className="btn" style={{ background:"white", color:"var(--brand)", fontWeight:800, height:50, padding:"0 28px", fontSize:15 }}>Publish Your First Article</Link>
                  <Link href="/explore" className="btn" style={{ background:"rgba(255,255,255,.12)", color:"white", border:"1.5px solid rgba(255,255,255,.25)", height:50, padding:"0 24px", fontSize:15 }}>Explore Articles</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer style={{ borderTop:"1px solid var(--border)", padding:"clamp(18px,3vw,28px) 0", background:"var(--bg-card)" }}>
          <div className="container" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={13} color="white" strokeWidth={2.5}/></div>
              <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:14, color:"var(--text)" }}>Readlearc</span>
            </div>
            <nav style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[{href:"/explore",l:"Explore"},{href:"/write",l:"Write"},{href:"/creator",l:"Earn"},{href:"/admin",l:"Admin"}].map(({href,l})=>(
                <Link key={href} href={href} style={{ fontSize:12, color:"var(--text-4)", textDecoration:"none" }}>{l}</Link>
              ))}
            </nav>
            <div style={{ fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--accent)",display:"inline-block",animation:"pulse-dot 2s infinite" }}/>
              Supabase · Live
            </div>
          </div>
        </footer>
      </>)}
    </div>
  );
}
