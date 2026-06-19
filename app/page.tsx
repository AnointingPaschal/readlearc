"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Zap, Clock, BookOpen, ChevronRight, Star, TrendingUp, Search, Layers } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import SetupBanner from "../components/ui/SetupBanner";
import { fetchArticles, IS_CONFIGURED, type Article } from "../lib/chain";

const fade   = { hidden:{opacity:0,y:18}, show:{opacity:1,y:0,transition:{duration:.45}} };
const stagger = { hidden:{}, show:{transition:{staggerChildren:.07}} };

function ArticleCard({ a, featured=false }: { a: Article; featured?: boolean }) {
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none", display:"block", height:"100%" }}>
      <div className="card card-hover" style={{ padding:featured?"clamp(20px,3vw,28px)":"18px 16px", height:"100%", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6 }}>
          <span className="badge badge-brand" style={{ textTransform:"capitalize", fontSize:9 }}>{a.category}</span>
          <span className="price-tag" style={{ fontSize:11 }}>${a.price}</span>
        </div>
        <h3 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, color:"var(--text)", lineHeight:1.3,
          fontSize:featured?"clamp(17px,2.5vw,21px)":"15px",
          display:"-webkit-box", WebkitLineClamp:featured?3:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>
          {a.title}
        </h3>
        {featured && <p style={{ fontSize:13, color:"var(--text-3)", lineHeight:1.65, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>}
        <div style={{ marginTop:"auto", paddingTop:10, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"var(--text-4)" }}>
          <Link href={`/profile/${a.authorAddress}`} onClick={e=>e.stopPropagation()} style={{ color:"var(--brand)", fontFamily:"JetBrains Mono,monospace", fontSize:10, fontWeight:600, textDecoration:"none" }}>{a.authorShort}</Link>
          <span style={{ display:"flex", gap:8 }}>
            <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={9}/>{a.readTime}m</span>
            <span style={{ display:"flex", alignItems:"center", gap:2 }}><TrendingUp size={9}/>{a.reads}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, icon: Icon, color, href, children }: any) {
  return (
    <section style={{ padding:"clamp(40px,6vw,64px) clamp(14px,4vw,24px)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={16} style={{ color }}/>
            </div>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,3vw,24px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>{title}</h2>
          </div>
          {href && <Link href={href} style={{ display:"flex", alignItems:"center", gap:4, fontSize:13, color:"var(--brand)", fontWeight:700, textDecoration:"none" }}>View all <ArrowRight size={13}/></Link>}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [featured,  setFeatured]  = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    Promise.all([
      fetchArticles(30).then(setArticles),
      fetch("/api/moderation?action=featured").then(r=>r.json()).then(setFeatured).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, []);

  const featuredArticles = articles.filter(a => featured.includes(a.id)).slice(0, 3);
  const trending         = [...articles].sort((a,b)=>b.reads-a.reads).slice(0, 6);
  const latest           = [...articles].sort((a,b)=>b.timestamp-a.timestamp).slice(0, 8);
  const byCategory       = articles.reduce<Record<string,Article[]>>((acc,a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});
  const topCats = Object.entries(byCategory).sort((a,b)=>b[1].length-a[1].length).slice(0,4);

  const searchFiltered = search ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.blurb.toLowerCase().includes(search.toLowerCase())) : [];

  const Skeleton = ({ h=240 }: { h?: number }) => <div className="skeleton" style={{ height:h, borderRadius:20 }}/>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner />
      <Navbar />

      {/* ── Top bar ── */}
      <div style={{ paddingTop:60, borderBottom:"1px solid var(--border)", background:"var(--bg-card)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"20px clamp(14px,4vw,24px)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,3vw,24px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:2 }}>Readlearc</h1>
            <p style={{ fontSize:12, color:"var(--text-4)" }}>Pay-per-read publishing on Arc blockchain · <span style={{ color:"var(--accent)", fontWeight:600 }}>85% to writers</span></p>
          </div>
          <div style={{ position:"relative", flexShrink:0 }}>
            <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles…"
              style={{ paddingLeft:36, paddingRight:14, height:40, width:"clamp(200px,30vw,320px)", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--rfull)", outline:"none", fontSize:13, color:"var(--text)", fontFamily:"inherit" }}
              onFocus={e=>(e.target as any).style.borderColor="var(--brand)"}
              onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
            />
          </div>
        </div>
      </div>

      {/* ── Search results ── */}
      {search && (
        <div style={{ background:"var(--bg-alt)", borderBottom:"1px solid var(--border)", padding:"12px clamp(14px,4vw,24px)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            {searchFiltered.length === 0 ? (
              <p style={{ fontSize:13, color:"var(--text-4)" }}>No results for "{search}"</p>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                {searchFiltered.slice(0,6).map(a=><ArticleCard key={a.id} a={a}/>)}
              </div>
            )}
          </div>
        </div>
      )}

      {!search && (<>
        {/* ── Featured ── */}
        {(loading || featuredArticles.length > 0) && (
          <Section title="Featured" icon={Star} color="var(--brand)" href="/explore">
            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                {[1,2,3].map(i=><Skeleton key={i}/>)}
              </div>
            ) : featuredArticles.length > 0 ? (
              <motion.div initial="hidden" animate="show" variants={stagger}
                style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                {featuredArticles.map(a=>(
                  <motion.div key={a.id} variants={fade}><ArticleCard a={a} featured/></motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="card" style={{ padding:"36px 20px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>
                Feature articles from the <Link href="/admin/content/moderation" style={{ color:"var(--brand)", fontWeight:600 }}>admin panel</Link>
              </div>
            )}
          </Section>
        )}

        {/* ── Trending ── */}
        <div style={{ background:"var(--bg-alt)" }}>
          <Section title="Trending" icon={Flame} color="#d97706" href="/explore">
            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12 }}>
                {[1,2,3,4,5,6].map(i=><Skeleton key={i} h={180}/>)}
              </div>
            ) : trending.length === 0 ? (
              <div className="card" style={{ padding:"36px 20px", textAlign:"center" }}>
                <Flame size={28} style={{ color:"var(--text-4)", marginBottom:10 }}/>
                <p style={{ fontSize:13, color:"var(--text-4)" }}>
                  {IS_CONFIGURED ? "No articles yet. Be the first to publish!" : "Configure contract to see articles."}
                </p>
                {IS_CONFIGURED && <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Write First Article</Link>}
              </div>
            ) : (
              <motion.div initial="hidden" animate="show" variants={stagger}
                style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12 }}>
                {trending.map((a,i)=>(
                  <motion.div key={a.id} variants={fade}>
                    <Link href={`/article/${a.id}`} style={{ textDecoration:"none", display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", borderRadius:"var(--r)", background:"var(--bg-card)", border:"1px solid var(--border)", transition:"all .2s" }}
                      onMouseEnter={e=>{(e.currentTarget as any).style.boxShadow="var(--shadow)";(e.currentTarget as any).style.transform="translateY(-2px)"}}
                      onMouseLeave={e=>{(e.currentTarget as any).style.boxShadow="none";(e.currentTarget as any).style.transform="none"}}
                    >
                      <span style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--border-mid)", lineHeight:1, flexShrink:0, width:28 }}>{String(i+1).padStart(2,"0")}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                          <span className="badge badge-neutral" style={{ fontSize:9, textTransform:"capitalize" }}>{a.category}</span>
                          <span className="price-tag" style={{ fontSize:9 }}>${a.price}</span>
                        </div>
                        <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                        <div style={{ marginTop:6, fontSize:10, color:"var(--text-4)", display:"flex", alignItems:"center", gap:3 }}><TrendingUp size={9}/>{a.reads} reads</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Section>
        </div>

        {/* ── Latest ── */}
        <Section title="Latest" icon={Zap} color="#059669" href="/explore">
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {[1,2,3,4].map(i=><Skeleton key={i}/>)}
            </div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={stagger}
              style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {latest.map(a=>(
                <motion.div key={a.id} variants={fade}><ArticleCard a={a}/></motion.div>
              ))}
            </motion.div>
          )}
        </Section>

        {/* ── By Category ── */}
        {!loading && topCats.length > 0 && topCats.map(([cat, catArticles]) => (
          <div key={cat} style={{ background:"var(--bg-alt)" }}>
            <Section title={cat} icon={Layers} color="#0284c7" href={`/explore?cat=${cat}`}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12 }}>
                {catArticles.slice(0,4).map(a=><ArticleCard key={a.id} a={a}/>)}
              </div>
            </Section>
          </div>
        ))}

        {/* ── Platform strip ── */}
        <div style={{ borderTop:"1px solid var(--border)", padding:"clamp(20px,4vw,40px) clamp(14px,4vw,24px)", background:"var(--bg-card)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:20, alignItems:"center" }}>
            {[
              { emoji:"⚡", label:"Sub-second settlement",  desc:"USDC transferred atomically on Arc" },
              { emoji:"💎", label:"85% to writers",         desc:"Highest creator share in web3 publishing" },
              { emoji:"🔒", label:"On-chain ownership",      desc:"Cryptographic proof of every article unlocked" },
              { emoji:"🌐", label:"No middlemen",            desc:"Smart contracts handle all payments" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{ borderTop:"1px solid var(--border)", padding:"24px clamp(14px,4vw,24px)", background:"var(--bg-alt)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={12} color="white" strokeWidth={2.5}/></div>
              <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:14, color:"var(--text)" }}>Readlearc</span>
            </div>
            <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
              {[{href:"/explore",label:"Explore"},{href:"/write",label:"Write"},{href:"/creator",label:"Earn"},{href:"/admin",label:"Admin"}].map(l=>(
                <Link key={l.href} href={l.href} style={{ fontSize:12, color:"var(--text-4)", textDecoration:"none" }}>{l.label}</Link>
              ))}
            </div>
            <div style={{ fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:"#059669",display:"inline-block" }}/>Arc Testnet
            </div>
          </div>
        </footer>
      </>)}
    </div>
  );
}
