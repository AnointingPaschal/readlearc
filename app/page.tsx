"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import { ArrowRight, BookOpen, PenLine, Zap, Users, TrendingUp, Star, Clock, Shield, FlaskConical, Search, Flame } from "lucide-react";

interface Article { id:string;title:string;blurb:string;price:string;category:string;readTime:number;isResearch:boolean;authorShort:string;authorAddress:string;reads:number;status:string;featured:boolean;timestamp:number; }
interface SiteConfig { hero_image?:string;hero_title?:string;hero_sub?:string;hero_cta?:string;site_banner?:string;brand_name?:string;brand_tagline?:string;brand_color?:string;accent_color?:string; }

function ArticleCard({ a }: { a:Article }) {
  const addr = a.authorAddress||"";
  const h = parseInt((addr||"000000").slice(2,4)||"0",16)*1.4;
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
      <div className="card card-hover" style={{ padding:"14px",display:"flex",flexDirection:"column",height:"100%",gap:8 }}>
        <div style={{ display:"flex",gap:5,flexWrap:"wrap",alignItems:"center" }}>
          <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)",fontFamily:"Outfit,sans-serif" }}>{a.category}</span>
          {a.isResearch&&<span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)" }}>Research</span>}
          {a.featured&&<Star size={10} style={{ color:"#ca8a04" }}/>}
        </div>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--text)",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as any,overflow:"hidden",flex:1 }}>{a.title}</h3>
        <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.blurb}</p>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${h}deg,65%,55%),hsl(${h+40}deg,55%,45%))`,flexShrink:0 }}/>
            <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:9,color:"var(--text-4)" }}>{a.authorShort}</span>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <span style={{ fontSize:9,color:"var(--text-4)" }}><Clock size={8}/> {a.readTime}m</span>
            <span style={{ fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:800,color:"var(--accent)" }}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [research, setResearch] = useState<Article[]>([]);
  const [recent,   setRecent]   = useState<Article[]>([]);
  const [stats,    setStats]    = useState({ articles:0, writers:0, reads:0 });
  const [cfg,      setCfg]      = useState<SiteConfig>({});
  const [search,   setSearch]   = useState("");
  const [activeTag,setActiveTag]= useState("All");
  const [cats,     setCats]     = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?status=featured&limit=6").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?limit=100").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?isResearch=true&limit=4").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/settings").then(r=>r.json()).catch(()=>({})),
    ]).then(([feat,all,res,settings]) => {
      const feats = Array.isArray(feat)?feat:[];
      const alls  = Array.isArray(all)?all:[];
      const ress  = Array.isArray(res)?res:[];
      setFeatured(feats.slice(0,6));
      setTrending(alls.sort((a:Article,b:Article)=>b.reads-a.reads).slice(0,6));
      setResearch(ress.slice(0,4));
      setRecent(alls.slice(0,8));
      const cs = Array.from(new Set(alls.map((a:Article)=>a.category).filter(Boolean))) as string[];
      setCats(cs);
      const writers = new Set(alls.map((a:Article)=>a.authorAddress)).size;
      const reads   = alls.reduce((s:number,a:Article)=>s+(a.reads||0),0);
      setStats({ articles:alls.length, writers, reads });
      setCfg(settings||{});
      setLoading(false);
    });
  },[]);

  const TAGS = ["All",...cats.slice(0,7)];
  const feed = (activeTag==="All"?trending:trending.filter(a=>a.category===activeTag)).slice(0,6);

  const heroTitle = cfg.hero_title || (cfg.brand_name ? `Welcome to ${cfg.brand_name}` : "Academic Publishing on the Blockchain");
  const heroSub   = cfg.hero_sub   || cfg.brand_tagline || "Writers earn 85% in USDC. Readers own proof of every article they unlock. No ads. No algorithms.";
  const heroCta   = cfg.hero_cta   || "Explore Articles";
  const heroImg   = cfg.hero_image || "";
  const banner    = cfg.site_banner || "";

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)" }}>
      <Navbar/>

      {/* ── Hero ── */}
      <div style={{ marginTop:"var(--header-h)",position:"relative",height:"clamp(280px,40vh,420px)",overflow:"hidden" }}>
        {heroImg
          ? <img src={heroImg} alt="hero" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
          : <div style={{ width:"100%",height:"100%",background:`linear-gradient(135deg,#0f0a1e 0%,${cfg.brand_color||"#1a0938"} 60%,#0c1a2e 100%)` }}/>
        }
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.45)" }}/>
        {/* Only show text overlay if title/sub configured */}
        {(heroTitle||heroSub) && (
          <div className="container" style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"0 clamp(16px,4vw,40px) clamp(20px,4vw,40px)" }}>
            <div style={{ maxWidth:560 }}>
              {heroTitle&&<h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(22px,4vw,42px)",fontWeight:900,color:"white",lineHeight:1.08,letterSpacing:"-.03em",marginBottom:8 }}>{heroTitle}</h1>}
              {heroSub&&<p style={{ fontSize:"clamp(12px,1.8vw,15px)",color:"rgba(255,255,255,.8)",lineHeight:1.6,marginBottom:16,maxWidth:480 }}>{heroSub}</p>}
              <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                <Link href="/explore" style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"var(--accent)",borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:13,color:"white",textDecoration:"none" }}>
                  {heroCta||"Explore"} <ArrowRight size={13}/>
                </Link>
                <Link href="/write" style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"rgba(255,255,255,.12)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:13,color:"white",textDecoration:"none",backdropFilter:"blur(8px)" }}>
                  <PenLine size={12}/>Write
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Site Banner (if set) ── */}
      {banner&&(
        <div style={{ width:"100%",maxHeight:120,overflow:"hidden" }}>
          <img src={banner} alt="banner" style={{ width:"100%",objectFit:"cover",display:"block",maxHeight:120 }}/>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ background:"var(--bg-card)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",overflowX:"auto" }}>
        <div className="container" style={{ display:"flex",gap:0,minWidth:"max-content",padding:"0 16px" }}>
          {[
            { icon:BookOpen,   label:"Articles",       v:stats.articles+"+" },
            { icon:Users,      label:"Writers",         v:stats.writers+"+"  },
            { icon:TrendingUp, label:"Total Reads",     v:stats.reads+"+"    },
            { icon:Zap,        label:"Writer Earnings", v:"85%"              },
            { icon:Shield,     label:"On-chain Proof",  v:"Every Read"       },
          ].map((s,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:9,padding:"13px 20px",borderRight:"1px solid var(--border)",flexShrink:0 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"var(--brand-muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <s.icon size={12} style={{ color:"var(--brand)" }}/>
              </div>
              <div>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:900,color:"var(--text)",lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9,color:"var(--text-4)",marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding:"32px 16px 60px" }}>

        {/* ── Featured ── */}
        {featured.length>0&&(
          <section style={{ marginBottom:40 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <Star size={15} style={{ color:"#ca8a04" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Featured</h2>
              </div>
              <Link href="/explore?filter=featured" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:600,display:"flex",alignItems:"center",gap:3 }}>View all<ArrowRight size={11}/></Link>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12 }}>
              {featured.slice(0,3).map(a=><ArticleCard key={a.id} a={a}/>)}
            </div>
          </section>
        )}

        {/* ── Trending + search ── */}
        <section style={{ marginBottom:40 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:14 }}>
            <Flame size={15} style={{ color:"var(--accent)" }}/>
            <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Trending</h2>
          </div>
          <form onSubmit={e=>{e.preventDefault();if(search.trim())window.location.href=`/explore?q=${encodeURIComponent(search)}`;}} style={{ position:"relative",marginBottom:12 }}>
            <Search size={14} style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles, topics, authors…"
              style={{ width:"100%",padding:"10px 14px 10px 38px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:13,color:"var(--text)",outline:"none",boxSizing:"border-box" as const }}/>
          </form>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:14 }}>
            {TAGS.map(t=>(
              <button key={t} onClick={()=>setActiveTag(t)}
                style={{ padding:"4px 12px",borderRadius:99,border:`1.5px solid ${activeTag===t?"var(--brand)":"var(--border)"}`,background:activeTag===t?"var(--brand-muted)":"transparent",fontSize:11,fontWeight:700,color:activeTag===t?"var(--brand)":"var(--text-3)",cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .1s" }}>
                {t}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10 }}>
              {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{ height:180,borderRadius:"var(--r-lg)" }}/>)}
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10 }}>
              {feed.map(a=><ArticleCard key={a.id} a={a}/>)}
            </div>
          )}
          <div style={{ textAlign:"center",marginTop:18 }}>
            <Link href="/explore" className="btn btn-secondary" style={{ gap:6 }}>All Articles <ArrowRight size={12}/></Link>
          </div>
        </section>

        {/* ── Research ── */}
        {research.length>0&&(
          <section style={{ marginBottom:40 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <FlaskConical size={15} style={{ color:"#0284c7" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Research Papers</h2>
              </div>
              <Link href="/explore?filter=research" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:600,display:"flex",alignItems:"center",gap:3 }}>View all<ArrowRight size={11}/></Link>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
              {research.map(a=>(
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"14px",display:"flex",gap:12,alignItems:"flex-start" }}>
                    <div style={{ width:40,height:40,borderRadius:"var(--r)",background:"rgba(2,132,199,.1)",border:"1px solid rgba(2,132,199,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <FlaskConical size={18} style={{ color:"#0284c7" }}/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.title}</h4>
                      {a.blurb&&<p style={{ fontSize:10,color:"var(--text-4)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden",marginBottom:4 }}>{a.blurb}</p>}
                      <div style={{ display:"flex",gap:8,fontSize:10,color:"var(--text-4)" }}>
                        <span>{a.authorShort}</span>
                        <span>{a.reads} reads</span>
                        <span style={{ color:"var(--accent)",fontWeight:700 }}>${parseFloat(a.price).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── How it works ── */}
        <section style={{ marginBottom:32,padding:"32px clamp(16px,4vw,40px)",background:"var(--bg-card)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)" }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",textAlign:"center",letterSpacing:"-.02em",marginBottom:4 }}>How It Works</h2>
          <p style={{ fontSize:12,color:"var(--text-4)",textAlign:"center",marginBottom:24 }}>Fair publishing economics on Arc blockchain</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16 }}>
            {[
              { n:"01",icon:PenLine,   color:"var(--brand)",  title:"Write",       desc:"Use our rich editor. Submit for admin review."           },
              { n:"02",icon:Shield,    color:"#d97706",       title:"AI Review",   desc:"AI checks quality, originality, and plagiarism."         },
              { n:"03",icon:BookOpen,  color:"var(--accent)", title:"Readers Pay", desc:"Readers pay USDC to unlock — directly to your earnings." },
              { n:"04",icon:Zap,       color:"#0284c7",       title:"You Earn",    desc:"85% paid to you monthly in USDC by admin."              },
            ].map(s=>(
              <div key={s.n} style={{ textAlign:"center",padding:"16px 8px" }}>
                <div style={{ width:44,height:44,borderRadius:14,background:`${s.color}14`,border:`1.5px solid ${s.color}28`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
                  <s.icon size={20} style={{ color:s.color }}/>
                </div>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:s.color,marginBottom:3,letterSpacing:".05em" }}>{s.n}</div>
                <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--text)",marginBottom:5 }}>{s.title}</h4>
                <p style={{ fontSize:11,color:"var(--text-3)",lineHeight:1.55 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent ── */}
        {recent.length>0&&(
          <section>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <Clock size={14} style={{ color:"var(--text-3)" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Latest</h2>
              </div>
              <Link href="/explore" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:600,display:"flex",alignItems:"center",gap:3 }}>All<ArrowRight size={11}/></Link>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {recent.map(a=>(
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"11px 14px",display:"flex",gap:10,alignItems:"center" }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",gap:5,marginBottom:4,flexWrap:"wrap" }}>
                        <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)" }}>{a.category}</span>
                        {a.isResearch&&<span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)" }}>Research</span>}
                      </div>
                      <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.title}</h4>
                      <div style={{ fontSize:10,color:"var(--text-4)",marginTop:3 }}>{a.authorShort} · {a.reads} reads</div>
                    </div>
                    <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--accent)",flexShrink:0 }}>${parseFloat(a.price).toFixed(3)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background:"var(--bg-card)",borderTop:"1px solid var(--border)",padding:"32px 16px 20px" }}>
        <div className="container">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:24,marginBottom:28 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Zap size={13} color="white"/>
                </div>
                <span style={{ fontFamily:"Outfit,sans-serif",fontWeight:900,fontSize:15,color:"var(--text)" }}>{cfg.brand_name||"Readlearc"}</span>
              </div>
              <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.65 }}>{cfg.brand_tagline||"Pay per word. Own every read."}</p>
            </div>
            {[
              { label:"Platform", links:[{l:"Explore",h:"/explore"},{l:"Write Article",h:"/write"},{l:"Research Studio",h:"/write/research"},{l:"Creator Studio",h:"/creator"}] },
              { label:"Account",  links:[{l:"My Wallet",h:"/wallet-app"},{l:"Reading History",h:"/reading-history"},{l:"My Profile",h:"/profile"}] },
              { label:"Network",  links:[{l:"Arc Testnet",h:"https://testnet.arcscan.app"},{l:"Circle USDC",h:"https://faucet.circle.com"},{l:"OpenRouter AI",h:"https://openrouter.ai"}] },
            ].map(col=>(
              <div key={col.label}>
                <div style={{ fontFamily:"Outfit,sans-serif",fontSize:11,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10 }}>{col.label}</div>
                {col.links.map(l=>(
                  <Link key={l.l} href={l.h} style={{ display:"block",fontSize:12,color:"var(--text-4)",textDecoration:"none",marginBottom:6,transition:"color .12s" }}
                    onMouseEnter={e=>(e.currentTarget.style.color="var(--brand)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-4)")}>{l.l}</Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ paddingTop:16,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
            <p style={{ fontSize:11,color:"var(--text-4)" }}>© {new Date().getFullYear()} {cfg.brand_name||"Readlearc"} · Built on Arc Testnet</p>
            <p style={{ fontSize:11,color:"var(--text-4)",display:"flex",alignItems:"center",gap:5 }}><Shield size={10}/>All payments verified on-chain</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
