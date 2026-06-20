"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Flame, Star, Search, X, ArrowRight, Clock, TrendingUp, ChevronRight, Shield, Wallet, BookOpen, PenLine } from "lucide-react";
import Navbar from "../components/ui/Navbar";
import NetworkGuard from "../components/ui/NetworkGuard";
import { IS_SUPABASE_CONFIGURED } from "../lib/supabase";

type Article = {
  id:string; title:string; blurb:string; price:string; category:string;
  readTime:number; isResearch:boolean; authorAddress:string; authorShort:string;
  status:string; featured:boolean; reads:number; timestamp:number;
};

const CATS = ["All","Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];

function Card({ a }: { a:Article }) {
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
      <div className="card card-hover" style={{ padding:20, height:"100%", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
          <span className="badge badge-brand">{a.category}</span>
          <span className="price-tag">${parseFloat(a.price).toFixed(3)} USDC</span>
        </div>
        <h3 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:15, color:"var(--text)", lineHeight:1.3, flex:1,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
        <p style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-4)" }}>
          <span style={{ fontFamily:"JetBrains Mono,monospace", color:"var(--brand)", fontWeight:600, fontSize:10 }}>{a.authorShort}</span>
          <span style={{ display:"flex", gap:10 }}>
            <span style={{ display:"flex", alignItems:"center", gap:2 }}><Clock size={10}/>{a.readTime}m</span>
            <span style={{ display:"flex", alignItems:"center", gap:2 }}><TrendingUp size={10}/>{a.reads}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function Skeleton({ h=200 }: { h?:number }) {
  return <div className="skeleton" style={{ height:h, borderRadius:"var(--r-lg)" }}/>;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("All");

  useEffect(() => {
    fetch("/api/articles?limit=100")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setArticles(d);
        else setError(d.error || "Failed to load articles");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const bySearch = search
    ? articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.blurb.toLowerCase().includes(search.toLowerCase()))
    : null;
  const byCat    = cat === "All" ? articles : articles.filter(a => a.category === cat);
  const featured = articles.filter(a => a.featured).slice(0,3);
  const trending = articles.filter(a => !a.featured).sort((a,b) => b.reads-a.reads).slice(0,6);
  const latest   = [...byCat].sort((a,b) => b.timestamp-a.timestamp).slice(0,9);
  const show     = bySearch ?? latest;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NetworkGuard/>
      <Navbar/>

      {/* DB error */}
      {error && (
        <div style={{ position:"fixed", top:"var(--header-h)", left:0, right:0, zIndex:55, background:"#dc2626", color:"white", padding:"10px 20px", textAlign:"center", fontSize:13, fontWeight:600 }}>
          {IS_SUPABASE_CONFIGURED
            ? `Database error: ${error}`
            : "Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy."}
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ paddingTop:"calc(var(--header-h) + clamp(56px,9vw,100px))", paddingBottom:"clamp(48px,7vw,80px)", position:"relative", overflow:"hidden", textAlign:"center" }}>
        {/* grid bg */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize:"56px 56px", opacity:.35, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:800, height:500, background:"radial-gradient(ellipse,rgba(109,40,217,.1) 0%,transparent 65%)", pointerEvents:"none" }}/>

        <div className="container" style={{ position:"relative" }}>
          <span className="badge badge-brand" style={{ marginBottom:20, display:"inline-flex", gap:5 }}>
            <Zap size={11} strokeWidth={2.5}/>Built on Arc · Circle USDC
          </span>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(40px,7vw,88px)", fontWeight:900, lineHeight:1.03, letterSpacing:"-0.04em", color:"var(--text)", marginBottom:20 }}>
            Pay per word.<br/>
            <span style={{ background:"linear-gradient(135deg,var(--brand),var(--accent))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Own every read.
            </span>
          </h1>
          <p style={{ fontSize:"clamp(15px,2vw,18px)", color:"var(--text-3)", maxWidth:520, margin:"0 auto 36px", lineHeight:1.75 }}>
            Writers earn <strong style={{ color:"var(--accent)", fontWeight:700 }}>85% in USDC instantly</strong>. Readers hold cryptographic proof of every article they unlock.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:64, flexWrap:"wrap" }}>
            <Link href="/explore" className="btn btn-primary btn-lg">Browse Articles <ArrowRight size={16}/></Link>
            <Link href="/write"   className="btn btn-secondary btn-lg"><PenLine size={15}/>Start Writing</Link>
          </div>

          {/* Value props */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:10, maxWidth:760, margin:"0 auto" }}>
            {[
              { icon:Zap,      title:"Sub-second",     desc:"Instant USDC settlement on Arc",    color:"var(--brand)"  },
              { icon:Shield,   title:"85% to writers", desc:"Highest creator share in web3",     color:"var(--accent)" },
              { icon:Wallet,   title:"No minimums",    desc:"Pay as little as $0.001",           color:"#0284c7"       },
              { icon:BookOpen, title:"Forever access", desc:"Read receipts stored permanently",  color:"#d97706"       },
            ].map(p => (
              <div key={p.title} className="card" style={{ padding:"18px 16px", textAlign:"center" }}>
                <div style={{ width:36,height:36,borderRadius:10,background:`${p.color}14`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
                  <p.icon size={16} style={{ color:p.color }}/>
                </div>
                <div style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Categories ── */}
      <div style={{ background:"var(--bg-card)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", position:"sticky", top:"var(--header-h)", zIndex:30, padding:"12px 0" }}>
        <div className="container" style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ position:"relative" }}>
            <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search articles, topics, categories…"
              className="input input-search" style={{ background:"var(--bg-alt)" }}/>
            {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}><X size={14}/></button>}
          </div>
          {!search && (
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
              {CATS.filter(c=>c==="All"||articles.some(a=>a.category===c)).map(c=>(
                <button key={c} onClick={()=>setCat(c)} style={{ padding:"5px 13px",borderRadius:"var(--r-f)",fontSize:12,fontWeight:600,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,border:`1.5px solid ${cat===c?"var(--brand)":"var(--border)"}`,background:cat===c?"var(--brand-muted)":"transparent",color:cat===c?"var(--brand)":"var(--text-3)",transition:"all .15s" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {search && (
        <section style={{ padding:"clamp(28px,4vw,44px) 0", background:"var(--bg-alt)", borderBottom:"1px solid var(--border)" }}>
          <div className="container">
            <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:16, fontWeight:600 }}>
              {(bySearch?.length||0)} result{bySearch?.length!==1?"s":""} for "<span style={{ color:"var(--brand)" }}>{search}</span>"
            </p>
            {!bySearch?.length
              ? <p style={{ color:"var(--text-4)", fontSize:13 }}>No articles found.</p>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                  {bySearch.slice(0,9).map(a=><Card key={a.id} a={a}/>)}
                </div>
            }
          </div>
        </section>
      )}

      {!search && (<>
        {/* Featured */}
        {(loading||featured.length>0) && (
          <section style={{ padding:"clamp(44px,6vw,64px) 0" }}>
            <div className="container">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30,height:30,borderRadius:8,background:"rgba(234,179,8,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Star size={14} style={{ color:"#ca8a04" }}/></div>
                  <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Featured</h2>
                </div>
                <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)" }}>View all <ChevronRight size={13}/></Link>
              </div>
              {loading
                ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{[1,2,3].map(i=><Skeleton key={i} h={240}/>)}</div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{featured.map(a=><Card key={a.id} a={a}/>)}</div>
              }
            </div>
          </section>
        )}

        {/* Trending */}
        <section style={{ padding:"clamp(44px,6vw,64px) 0", background:"var(--bg-alt)" }}>
          <div className="container">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:"rgba(217,119,6,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Flame size={14} style={{ color:"#d97706" }}/></div>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Trending</h2>
              </div>
              <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)" }}>View all <ChevronRight size={13}/></Link>
            </div>
            {loading
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{[1,2,3,4,5,6].map(i=><Skeleton key={i} h={100}/>)}</div>
              : !articles.length && !loading
                ? <div className="card" style={{ padding:"48px 24px", textAlign:"center" }}>
                    <Flame size={32} style={{ color:"var(--text-4)", marginBottom:12 }}/>
                    <p style={{ fontSize:15, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>No articles yet</p>
                    <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:20 }}>
                      {IS_SUPABASE_CONFIGURED
                        ? "Be the first to write an article."
                        : "Configure Supabase environment variables to load articles."}
                    </p>
                    <Link href="/write" className="btn btn-primary btn-sm">Write First Article</Link>
                  </div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                    {trending.map((a,i)=>(
                      <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                        <div className="card card-hover" style={{ padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start" }}>
                          <span style={{ fontFamily:"Outfit,sans-serif", fontSize:28, fontWeight:900, color:"var(--border-2)", lineHeight:1, flexShrink:0, minWidth:32 }}>{String(i+1).padStart(2,"0")}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", gap:5, marginBottom:6 }}>
                              <span className="badge badge-neutral">{a.category}</span>
                              <span className="price-tag" style={{ fontSize:10 }}>${parseFloat(a.price).toFixed(3)}</span>
                            </div>
                            <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4, lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                            <p style={{ fontSize:11, color:"var(--text-3)", marginBottom:5, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.blurb}</p>
                            <span style={{ fontSize:10, color:"var(--text-4)", display:"flex", alignItems:"center", gap:3 }}><TrendingUp size={9}/>{a.reads} reads</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
            }
          </div>
        </section>

        {/* Latest */}
        <section style={{ padding:"clamp(44px,6vw,64px) 0" }}>
          <div className="container">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:"rgba(5,150,105,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={14} style={{ color:"var(--accent)" }}/></div>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>
                  {cat==="All"?"Latest":cat}
                </h2>
              </div>
              <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:"var(--brand)" }}>View all <ChevronRight size={13}/></Link>
            </div>
            {loading
              ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>{[1,2,3,4].map(i=><Skeleton key={i}/>)}</div>
              : !latest.length
                ? <div className="card" style={{ padding:"36px", textAlign:"center", color:"var(--text-4)", fontSize:13 }}>No articles in this category.</div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                    {latest.map(a=><Card key={a.id} a={a}/>)}
                  </div>
            }
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding:"clamp(44px,6vw,64px) 0", background:"var(--bg-alt)" }}>
          <div className="container">
            <div style={{ borderRadius:"var(--r-xl)", padding:"clamp(36px,5vw,56px) clamp(24px,5vw,56px)", background:"linear-gradient(135deg,var(--brand),var(--brand-d))", textAlign:"center", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:"rgba(255,255,255,.06)",pointerEvents:"none" }}/>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(26px,5vw,48px)", fontWeight:900, color:"white", marginBottom:12, letterSpacing:"-.03em" }}>Start earning in USDC today</h2>
              <p style={{ color:"rgba(255,255,255,.75)", fontSize:16, marginBottom:28 }}>Write one article. Set your price. Earn 85% of every read — forever.</p>
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                <Link href="/write" className="btn" style={{ background:"white",color:"var(--brand)",fontWeight:800,height:50,padding:"0 28px",fontSize:15 }}>Publish Your First Article</Link>
                <Link href="/explore" className="btn" style={{ background:"rgba(255,255,255,.15)",color:"white",border:"1.5px solid rgba(255,255,255,.3)",height:50,padding:"0 24px",fontSize:15 }}>Explore Articles</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:"1px solid var(--border)", padding:"24px 0", background:"var(--bg-card)" }}>
          <div className="container" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={13} color="white"/></div>
              <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:14, color:"var(--text)" }}>Readlearc</span>
            </div>
            <div style={{ display:"flex", gap:20 }}>
              {([["/explore","Explore"],["/write","Write"],["/creator","Creator"],["/admin","Admin"]] as string[][]).map(([h,l])=>(
                <Link key={h} href={h} style={{ fontSize:12,color:"var(--text-4)",textDecoration:"none" }}>{l}</Link>
              ))}
            </div>
            <div style={{ fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--accent)",display:"inline-block" }}/>
              Arc Testnet · Supabase
            </div>
          </div>
        </footer>
      </>)}
    </div>
  );
}
