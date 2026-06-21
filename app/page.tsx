"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import {
  ArrowRight, BookOpen, PenLine, Zap, Users, TrendingUp,
  Star, ChevronLeft, ChevronRight, Clock, Shield, Award,
  BarChart3, Globe, Flame, FlaskConical, Search,
} from "lucide-react";

interface Article {
  id:string; title:string; blurb:string; price:string; category:string;
  readTime:number; isResearch:boolean; authorShort:string; authorAddress:string;
  reads:number; status:string; featured:boolean; timestamp:number;
}
interface Stats { articles:number; writers:number; reads:number; }

const DEFAULT_SLIDES = [
  {
    tag:      "Academic Publishing · Web3",
    headline: "Your Research\nDeserves an\nAudience.",
    sub:      "Publish peer-level articles and research papers. Readers pay directly to writers in USDC — no middlemen, no ads, no algorithms deciding who earns.",
    cta1:     { label:"Start Publishing", href:"/write"    },
    cta2:     { label:"Browse Research",  href:"/explore"  },
    accent:   "#6d28d9",
    bg:       "linear-gradient(135deg,#0f0a1e 0%,#1a0938 50%,#0c1a2e 100%)",
    image:    "",
  },
  {
    tag:      "For Readers",
    headline: "Read Smart.\nOwn What\nYou Learn.",
    sub:      "Every article you unlock is recorded on Arc blockchain — cryptographic proof of your reading history. Build a portfolio of knowledge you permanently own.",
    cta1:     { label:"Explore Articles", href:"/explore" },
    cta2:     { label:"How It Works",    href:"/explore" },
    accent:   "#059669",
    bg:       "linear-gradient(135deg,#022c22 0%,#064e3b 50%,#0f1628 100%)",
    image:    "",
  },
  {
    tag:      "For Researchers",
    headline: "Section-by-\nSection.\nPublish as\nYou Write.",
    sub:      "Our Research Studio lets you build papers section by section — Abstract, Methodology, Results — publishing each as you complete it. Auto-saves. Word-quality editor.",
    cta1:     { label:"Research Studio",  href:"/write/research" },
    cta2:     { label:"View Papers",     href:"/explore"        },
    accent:   "#0284c7",
    bg:       "linear-gradient(135deg,#0c1a2e 0%,#0e2340 50%,#1a0938 100%)",
    image:    "",
  },
];

function HeroSlider({ slides }: { slides: typeof DEFAULT_SLIDES }) {
  const [cur,  setCur]  = useState(0);
  const [prev, setPrev] = useState(-1);
  const [anim, setAnim] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  function go(idx: number) {
    if (anim || idx === cur) return;
    setPrev(cur); setCur(idx); setAnim(true);
    setTimeout(() => { setAnim(false); setPrev(-1); }, 600);
    if (timer.current) { clearInterval(timer.current); startTimer(); }
  }
  function startTimer() {
    timer.current = setInterval(() => {
      setCur(c => { const n=(c+1)%slides.length; setPrev(c); setAnim(true); setTimeout(()=>{setAnim(false);setPrev(-1);},600); return n; });
    }, 5500);
  }
  useEffect(() => { startTimer(); return () => { if(timer.current) clearInterval(timer.current); }; }, [slides.length]);

  const s = slides[cur];

  return (
    <div style={{ position:"relative", minHeight:"clamp(520px,85vh,760px)", overflow:"hidden", background:s.bg, transition:"background 0.7s" }}>
      {/* Background image if set */}
      {s.image && <div style={{ position:"absolute",inset:0,backgroundImage:`url(${s.image})`,backgroundSize:"cover",backgroundPosition:"center",opacity:.18 }}/>}

      {/* Noise texture overlay */}
      <div style={{ position:"absolute",inset:0,opacity:.04,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}/>

      {/* Gradient orbs */}
      <div style={{ position:"absolute",top:"-20%",right:"-10%",width:"60%",paddingBottom:"60%",borderRadius:"50%",background:`radial-gradient(circle,${s.accent}30 0%,transparent 70%)`,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",bottom:"-20%",left:"-10%",width:"50%",paddingBottom:"50%",borderRadius:"50%",background:`radial-gradient(circle,${s.accent}20 0%,transparent 70%)`,pointerEvents:"none" }}/>

      {/* Content */}
      <div className="container" style={{ position:"relative",zIndex:2,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"clamp(520px,85vh,760px)",padding:"clamp(60px,10vw,120px) 16px clamp(60px,8vw,100px)" }}>
        <div style={{ maxWidth:660 }}>
          {/* Tag */}
          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:`${s.accent}20`,border:`1px solid ${s.accent}40`,borderRadius:99,padding:"5px 13px",marginBottom:20,backdropFilter:"blur(10px)" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:s.accent }}/>
            <span style={{ fontSize:11,fontWeight:700,color:s.accent,letterSpacing:".08em",textTransform:"uppercase",fontFamily:"Outfit,sans-serif" }}>{s.tag}</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(36px,7vw,72px)",fontWeight:900,color:"white",lineHeight:1.02,letterSpacing:"-.04em",marginBottom:20,whiteSpace:"pre-line" }}>
            {s.headline.split("\n").map((line,i)=>(
              <span key={i}>
                {i===0&&<>{line}<br/></>}
                {i===1&&<span style={{ color:s.accent }}>{line}<br/></span>}
                {i>1&&<>{line}{i<s.headline.split("\n").length-1&&<br/>}</>}
              </span>
            ))}
          </h1>

          {/* Sub */}
          <p style={{ fontSize:"clamp(14px,2vw,17px)",color:"rgba(255,255,255,.72)",lineHeight:1.7,marginBottom:32,maxWidth:520 }}>{s.sub}</p>

          {/* CTAs */}
          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <Link href={s.cta1.href} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"13px 24px",background:s.accent,borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:15,color:"white",textDecoration:"none",transition:"opacity .15s",boxShadow:`0 8px 28px ${s.accent}50` }}
              onMouseEnter={e=>(e.currentTarget.style.opacity=".88")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              {s.cta1.label} <ArrowRight size={15}/>
            </Link>
            <Link href={s.cta2.href} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"13px 24px",background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:15,color:"white",textDecoration:"none",transition:"all .15s",backdropFilter:"blur(10px)" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.18)"; }} onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.1)"; }}>
              {s.cta2.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,zIndex:3 }}>
        {slides.map((_,i)=>(
          <button key={i} onClick={()=>go(i)}
            style={{ width:i===cur?28:8,height:8,borderRadius:99,border:"none",cursor:"pointer",background:i===cur?"white":"rgba(255,255,255,.35)",transition:"all .3s",padding:0 }}/>
        ))}
      </div>

      {/* Prev/Next */}
      {[{ dir:-1,icon:ChevronLeft,pos:"left" },{ dir:1,icon:ChevronRight,pos:"right" }].map(({dir,icon:Icon,pos})=>(
        <button key={pos} onClick={()=>go((cur+dir+slides.length)%slides.length)}
          style={{ position:"absolute",[pos]:16,top:"50%",transform:"translateY(-50%)",zIndex:3,width:40,height:40,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",backdropFilter:"blur(10px)",cursor:"pointer",color:"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Icon size={18}/>
        </button>
      ))}
    </div>
  );
}

function StatsBanner({ stats }: { stats: Stats }) {
  const items = [
    { icon:BookOpen,   label:"Articles Published",    value:stats.articles.toLocaleString()+"+" },
    { icon:Users,      label:"Writers Earning",        value:stats.writers.toLocaleString()+"+"  },
    { icon:TrendingUp, label:"Total Reads",            value:stats.reads.toLocaleString()+"+"    },
    { icon:Zap,        label:"Avg Writer Share",       value:"85%"                               },
    { icon:Shield,     label:"On-chain Proof",         value:"Every Read"                        },
    { icon:Globe,      label:"Blockchain",             value:"Arc Testnet"                       },
  ];
  return (
    <div style={{ background:"var(--bg-card)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",overflowX:"auto" }}>
      <div style={{ display:"flex",minWidth:"max-content",padding:"0 16px" }}>
        {items.map((s,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 24px",borderRight:"1px solid var(--border)",flexShrink:0 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:"var(--brand-muted)",border:"1px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <s.icon size={13} style={{ color:"var(--brand)" }}/>
            </div>
            <div>
              <div style={{ fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:900,color:"var(--text)",lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10,color:"var(--text-4)",marginTop:2,fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ a, size="normal" }: { a:Article; size?:"large"|"normal"|"compact" }) {
  const addr = a.authorAddress||"";
  const gradH = parseInt(addr.slice(2,4)||"0",16)*1.4;
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none",display:"flex",flexDirection:"column" }}>
      <div className="card card-hover" style={{ padding:0,overflow:"hidden",display:"flex",flexDirection:"column",height:"100%" }}>
        {/* Cover strip */}
        <div style={{ height:size==="large"?120:size==="compact"?40:60,background:`linear-gradient(135deg,hsl(${gradH}deg,50%,25%),hsl(${gradH+60}deg,50%,15%))`,flexShrink:0,position:"relative" }}>
          {a.isResearch&&<div style={{ position:"absolute",top:8,left:8,background:"rgba(2,132,199,.85)",padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:700,color:"white",fontFamily:"Outfit,sans-serif",backdropFilter:"blur(6px)" }}>RESEARCH</div>}
          {a.featured&&<div style={{ position:"absolute",top:8,right:8,display:"flex",alignItems:"center",gap:3,background:"rgba(202,138,4,.85)",padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:700,color:"white",backdropFilter:"blur(6px)" }}><Star size={8}/>FEATURED</div>}
        </div>
        <div style={{ padding:size==="compact"?"10px 12px":"14px",display:"flex",flexDirection:"column",flex:1 }}>
          <div style={{ display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)",fontFamily:"Outfit,sans-serif" }}>{a.category}</span>
            <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(5,150,105,.09)",color:"var(--accent)",border:"1px solid rgba(5,150,105,.2)",fontFamily:"Outfit,sans-serif" }}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:size==="large"?17:size==="compact"?12:14,fontWeight:800,color:"var(--text)",lineHeight:1.25,marginBottom:6,display:"-webkit-box",WebkitLineClamp:size==="compact"?2:3,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>
            {a.title}
          </h3>
          {size!=="compact"&&<p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.55,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden",flex:1 }}>{a.blurb}</p>}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto" }}>
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${gradH}deg,65%,55%),hsl(${gradH+40}deg,55%,45%))`,flexShrink:0 }}/>
              <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:9,color:"var(--text-4)" }}>{a.authorShort}</span>
            </div>
            <span style={{ fontSize:9,color:"var(--text-4)",display:"flex",alignItems:"center",gap:3 }}><Clock size={9}/>{a.readTime}m · {a.reads} reads</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [featured,  setFeatured]  = useState<Article[]>([]);
  const [trending,  setTrending]  = useState<Article[]>([]);
  const [research,  setResearch]  = useState<Article[]>([]);
  const [recent,    setRecent]    = useState<Article[]>([]);
  const [stats,     setStats]     = useState<Stats>({ articles:0, writers:0, reads:0 });
  const [slides,    setSlides]    = useState(DEFAULT_SLIDES);
  const [search,    setSearch]    = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [allCats,   setAllCats]   = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?status=featured&limit=6").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?status=approved&limit=12&sort=reads").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?status=approved&isResearch=true&limit=4").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?status=approved&limit=6&sort=new").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/settings").then(r=>r.json()).catch(()=>({})),
    ]).then(([feat,appr,res,rec,cfg]) => {
      const feats = Array.isArray(feat)?feat:[];
      const apprs = Array.isArray(appr)?appr:[];
      const ress  = Array.isArray(res)?res:[];
      const recs  = Array.isArray(rec)?rec:[];
      const all   = [...feats,...apprs];
      setFeatured(feats.slice(0,5));
      setTrending(apprs.slice(0,6));
      setResearch(ress.slice(0,4));
      setRecent(recs);
      const cats = Array.from(new Set(all.map((a:Article)=>a.category).filter(Boolean))) as string[];
      setAllCats(cats);
      const writers = new Set(all.map((a:Article)=>a.authorAddress)).size;
      const reads   = all.reduce((s:number,a:Article)=>s+(a.reads||0),0);
      setStats({ articles:all.length, writers, reads });
      // Load custom slides if configured
      if (cfg.hero_slide_1_title) {
        const customSlides = [1,2,3].map(n=>{
          const t=cfg[`hero_slide_${n}_title`]; if(!t)return null;
          return { tag:cfg[`hero_slide_${n}_tag`]||DEFAULT_SLIDES[n-1].tag, headline:cfg[`hero_slide_${n}_title`], sub:cfg[`hero_slide_${n}_sub`]||DEFAULT_SLIDES[n-1].sub, cta1:DEFAULT_SLIDES[n-1].cta1, cta2:DEFAULT_SLIDES[n-1].cta2, accent:cfg[`hero_slide_${n}_color`]||DEFAULT_SLIDES[n-1].accent, bg:DEFAULT_SLIDES[n-1].bg, image:cfg[`hero_slide_${n}_image`]||"" };
        }).filter(Boolean) as typeof DEFAULT_SLIDES;
        if (customSlides.length) setSlides(customSlides);
      }
      setLoading(false);
    });
  }, []);

  const TAGS = ["All", ...allCats.slice(0,8)];
  const browseFeed = (activeTag==="All"?trending:trending.filter(a=>a.category===activeTag)).slice(0,6);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>

      {/* Hero */}
      <div style={{ marginTop:"var(--header-h)" }}>
        <HeroSlider slides={slides}/>
      </div>

      {/* Stats bar */}
      <StatsBanner stats={stats}/>

      <div className="container" style={{ padding:"40px 16px 80px" }}>

        {/* ── Featured ── */}
        {featured.length>0&&(
          <section style={{ marginBottom:52 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <Star size={16} style={{ color:"#ca8a04" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Featured</h2>
              </div>
              <Link href="/explore?filter=featured" style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none",fontWeight:600 }}>View all<ArrowRight size={12}/></Link>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14 }}>
              {featured.slice(0,3).map(a=><ArticleCard key={a.id} a={a} size="large"/>)}
            </div>
          </section>
        )}

        {/* ── Search + browse ── */}
        <section style={{ marginBottom:52 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
            <Flame size={16} style={{ color:"var(--accent)" }}/>
            <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Trending</h2>
          </div>
          {/* Search */}
          <form onSubmit={e=>{e.preventDefault();if(search.trim())window.location.href=`/explore?q=${encodeURIComponent(search)}`;}} style={{ position:"relative",marginBottom:14 }}>
            <Search size={14} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles, topics, researchers…"
              style={{ width:"100%",padding:"12px 14px 12px 40px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:14,color:"var(--text)",outline:"none",boxSizing:"border-box" as const }}/>
          </form>
          {/* Category pills */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:18 }}>
            {TAGS.map(t=>(
              <button key={t} onClick={()=>setActiveTag(t)}
                style={{ padding:"5px 13px",borderRadius:99,border:`1.5px solid ${activeTag===t?"var(--brand)":"var(--border)"}`,background:activeTag===t?"var(--brand-muted)":"transparent",fontSize:11,fontWeight:700,color:activeTag===t?"var(--brand)":"var(--text-3)",cursor:"pointer",transition:"all .12s",fontFamily:"Outfit,sans-serif" }}>
                {t}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12 }}>
              {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{ height:200,borderRadius:"var(--r-lg)" }}/>)}
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12 }}>
              {browseFeed.map(a=><ArticleCard key={a.id} a={a}/>)}
            </div>
          )}
          <div style={{ textAlign:"center",marginTop:20 }}>
            <Link href="/explore" className="btn btn-secondary" style={{ gap:6 }}>See All Articles <ArrowRight size={13}/></Link>
          </div>
        </section>

        {/* ── Research papers ── */}
        {research.length>0&&(
          <section style={{ marginBottom:52 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <FlaskConical size={16} style={{ color:"#0284c7" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Research Papers</h2>
              </div>
              <Link href="/explore?filter=research" style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none",fontWeight:600 }}>View all<ArrowRight size={12}/></Link>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12 }}>
              {research.map(a=>(
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"16px",display:"flex",gap:12 }}>
                    <div style={{ width:48,height:48,borderRadius:"var(--r)",background:"rgba(2,132,199,.1)",border:"1px solid rgba(2,132,199,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <FlaskConical size={20} style={{ color:"#0284c7" }}/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",gap:5,marginBottom:5 }}>
                        <span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)" }}>RESEARCH</span>
                        <span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:99,background:"rgba(5,150,105,.09)",color:"var(--accent)",border:"1px solid rgba(5,150,105,.2)" }}>${parseFloat(a.price).toFixed(3)}</span>
                      </div>
                      <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden" }}>{a.title}</h4>
                      <div style={{ fontSize:10,color:"var(--text-4)",display:"flex",gap:8 }}>
                        <span>{a.authorShort}</span>
                        <span>{a.reads} reads</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── How it works ── */}
        <section style={{ marginBottom:52,padding:"40px clamp(16px,4vw,40px)",background:"var(--bg-card)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)" }}>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",textAlign:"center",letterSpacing:"-.02em",marginBottom:6 }}>How Readlearc Works</h2>
          <p style={{ fontSize:13,color:"var(--text-4)",textAlign:"center",marginBottom:28,lineHeight:1.6 }}>A fair, transparent publishing economy built on Arc blockchain</p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16 }}>
            {[
              { n:1, icon:PenLine,    color:"var(--brand)",  title:"Write & Submit",   desc:"Write articles or research papers using our rich editor. Submit for admin review."    },
              { n:2, icon:Shield,     color:"#d97706",       title:"AI Quality Check", desc:"Our AI analyzes content quality, originality, and plagiarism before approval."        },
              { n:3, icon:BookOpen,   color:"var(--accent)", title:"Readers Pay",      desc:"Approved articles go live. Readers pay in USDC to unlock the full content."          },
              { n:4, icon:BarChart3,  color:"#0284c7",       title:"Writers Earn",     desc:"85% of every payment goes to you. Earnings paid out monthly by admin in USDC."       },
            ].map(s=>(
              <div key={s.n} style={{ textAlign:"center",padding:"20px 12px" }}>
                <div style={{ width:52,height:52,borderRadius:16,background:`${s.color}14`,border:`1.5px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}>
                  <s.icon size={22} style={{ color:s.color }}/>
                </div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:7 }}>
                  <span style={{ fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:s.color,background:`${s.color}14`,width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>{s.n}</span>
                  <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:800,color:"var(--text)" }}>{s.title}</h4>
                </div>
                <p style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent ── */}
        {recent.length>0&&(
          <section style={{ marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <Clock size={15} style={{ color:"var(--text-3)" }}/>
                <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Latest</h2>
              </div>
              <Link href="/explore" style={{ fontSize:12,color:"var(--brand)",textDecoration:"none",fontWeight:600,display:"flex",alignItems:"center",gap:4 }}>All articles<ArrowRight size={12}/></Link>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {recent.map(a=>(
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
                  <div className="card card-hover" style={{ padding:"12px 14px",display:"flex",gap:12,alignItems:"center" }}>
                    <div style={{ width:44,height:44,borderRadius:"var(--r)",background:`linear-gradient(135deg,hsl(${parseInt(a.authorAddress.slice(2,4)||"0",16)*1.4}deg,50%,25%),hsl(${parseInt(a.authorAddress.slice(4,6)||"0",16)*1.4}deg,50%,15%))`,flexShrink:0 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",gap:5,marginBottom:4,flexWrap:"wrap" }}>
                        <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)" }}>{a.category}</span>
                        {a.isResearch&&<span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)" }}>Research</span>}
                      </div>
                      <h4 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.title}</h4>
                      <div style={{ fontSize:10,color:"var(--text-4)",marginTop:3,display:"flex",gap:8 }}>
                        <span>{a.authorShort}</span>
                        <span>${parseFloat(a.price).toFixed(3)}</span>
                        <span>{a.reads} reads</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--accent)",flexShrink:0 }}>${parseFloat(a.price).toFixed(3)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
