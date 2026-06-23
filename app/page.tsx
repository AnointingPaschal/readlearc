"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import { FACULTIES } from "../lib/categories";
import {
  ArrowRight, BookOpen, PenLine, Zap, Users, TrendingUp,
  Star, Clock, Shield, FlaskConical, Search, Flame, ChevronRight,
} from "lucide-react";
import { FacultyIcon } from "../components/ui/FacultyIcon";

interface Article {
  id:string;title:string;blurb:string;price:string;category:string;
  readTime:number;isResearch:boolean;authorShort:string;authorAddress:string;
  reads:number;status:string;featured:boolean;timestamp:number;
}
interface Cfg {
  hero_image?:string;hero_title?:string;hero_sub?:string;hero_cta?:string;
  site_banner?:string;brand_name?:string;brand_tagline?:string;brand_color?:string;
  [key:string]:string|undefined;
}

function hue(addr:string){return parseInt((addr||"000000").slice(2,4)||"0",16)*1.4;}

function FeaturedCard({a,big}:{a:Article;big?:boolean}){
  const h=hue(a.authorAddress);
  return(
    <Link href={`/article/${a.id}`} style={{textDecoration:"none",display:"flex",flexDirection:"column",height:"100%"}}>
      <div className="card card-hover" style={{padding:big?"18px":"14px",height:"100%",display:"flex",flexDirection:"column",gap:8,boxSizing:"border-box" as const}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}>{a.category}</span>
          {a.isResearch&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.25)"}}>Research</span>}
          {a.featured&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.3)",display:"flex",alignItems:"center",gap:3}}><Star size={7}/>Featured</span>}
        </div>
        <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:big?16:13,fontWeight:800,color:"var(--text)",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:big?3:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.title}</h3>
        {a.blurb&&<p style={{fontSize:big?12:11,color:"var(--text-3)",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:big?3:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden",margin:0}}>{a.blurb}</p>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid var(--border)",marginTop:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:16,height:16,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
            <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:"var(--text-4)"}}>{a.authorShort}</span>
          </div>
          <span style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--accent)"}}>${parseFloat(a.price).toFixed(3)}</span>
        </div>
      </div>
    </Link>
  );
}

function ArticleRow({a}:{a:Article}){
  const h=hue(a.authorAddress);
  return(
    <Link href={`/article/${a.id}`} style={{textDecoration:"none"}}>
      <div className="card card-hover" style={{padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}>{a.category}</span>
          {a.isResearch&&<span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)"}}>Research</span>}
          <span style={{marginLeft:"auto",fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:800,color:"var(--accent)"}}>${parseFloat(a.price).toFixed(3)}</span>
        </div>
        <h4 style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.title}</h4>
        {a.blurb&&<p style={{fontSize:11,color:"var(--text-3)",lineHeight:1.55,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.blurb}</p>}
        <div style={{fontSize:10,color:"var(--text-4)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:13,height:13,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
          <span>{a.authorShort}</span><Clock size={8}/><span>{a.readTime}m</span><span>·</span><span>{a.reads} reads</span>
        </div>
      </div>
    </Link>
  );
}


// ── Auto-advancing featured slider ──────────────────────────────
function FeaturedSlider({ items }: { items: Article[] }) {
  const [idx,    setIdx]    = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  function startTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
    }, 4500);
  }

  useEffect(() => {
    if (items.length > 1 && !paused) startTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [items.length, paused]);

  function goTo(i: number) {
    setIdx(i); setPaused(true);
    if (timer.current) clearInterval(timer.current);
    setTimeout(() => { setPaused(false); }, 8000);
  }

  const a = items[idx];
  if (!a) return null;
  const h = parseInt((a.authorAddress||"000000").slice(2,4)||"0",16)*1.4;

  return (
    <section style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:20,background:"#ca8a04",borderRadius:2}}/>
          <Star size={14} style={{color:"#ca8a04"}}/>
          <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Featured</h2>
        </div>
        <Link href="/explore?filter=featured" style={{fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
          See all <ArrowRight size={11}/>
        </Link>
      </div>

      {/* Single card per slide */}
      <Link href={`/article/${a.id}`} style={{textDecoration:"none",display:"block"}}>
        <div className="card card-hover" style={{padding:"18px 20px",position:"relative",overflow:"hidden",minHeight:150}}>
          {/* subtle colour wash from author hue */}
          <div style={{position:"absolute",top:0,right:0,width:"35%",height:"100%",background:`linear-gradient(to left,hsl(${h}deg,40%,${document.documentElement.classList.contains("dark")?"10%":"96%"}),transparent)`,pointerEvents:"none",opacity:.6}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center",position:"relative"}}>
            <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}>{a.category}</span>
            {a.isResearch&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)"}}>Research</span>}
            <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.3)",display:"flex",alignItems:"center",gap:3}}><Star size={7}/>Featured</span>
            <span style={{marginLeft:"auto",fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:900,color:"var(--accent)"}}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
          <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(16px,3.5vw,22px)",fontWeight:900,color:"var(--text)",lineHeight:1.2,letterSpacing:"-.02em",marginBottom:8,position:"relative"}}>{a.title}</h3>
          {a.blurb&&<p style={{fontSize:"clamp(11px,1.5vw,13px)",color:"var(--text-3)",lineHeight:1.65,marginBottom:12,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden",position:"relative"}}>{a.blurb}</p>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid var(--border)",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)"}}>{a.authorShort}</span>
              <span style={{fontSize:10,color:"var(--text-4)",display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{a.readTime}m</span>
            </div>
            {/* Dots */}
            {items.length>1&&(
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {items.map((_,i)=>(
                  <button key={i} onClick={e=>{e.preventDefault();goTo(i);}}
                    style={{width:i===idx?16:5,height:5,borderRadius:99,background:i===idx?"var(--brand)":"var(--border)",border:"none",cursor:"pointer",padding:0,transition:"all .3s"}}/>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
}

export default function HomePage(){
  const [featured, setFeatured] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [research, setResearch] = useState<Article[]>([]);
  const [recent,   setRecent]   = useState<Article[]>([]);
  const [stats,    setStats]    = useState({articles:0,writers:0,reads:0});
  const [cfg,      setCfg]      = useState<Cfg>({});
  const [search,   setSearch]   = useState("");
  const [activeTag,setActiveTag]= useState("All");
  const [cats,     setCats]     = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [slide,    setSlide]    = useState(0);
  const slideTimer=useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    Promise.all([
      fetch("/api/articles?status=featured&limit=6").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?limit=120").then(r=>r.json()).catch(()=>[]),
      fetch("/api/articles?isResearch=true&limit=6").then(r=>r.json()).catch(()=>[]),
      fetch("/api/admin/settings").then(r=>r.json()).catch(()=>({})),
    ]).then(([feat,all,res,settings])=>{
      const feats=Array.isArray(feat)?feat:[];
      const alls=Array.isArray(all)?all:[];
      const ress=Array.isArray(res)?res:[];
      setFeatured(feats.slice(0,6));
      setTrending(alls.sort((a:Article,b:Article)=>b.reads-a.reads).slice(0,8));
      setResearch(ress.slice(0,6));
      setRecent(alls.slice(0,10));
      const cs=Array.from(new Set(alls.map((a:Article)=>a.category).filter(Boolean))) as string[];
      setCats(cs);
      const writers=new Set(alls.map((a:Article)=>a.authorAddress)).size;
      const reads=alls.reduce((s:number,a:Article)=>s+(a.reads||0),0);
      setStats({articles:alls.length,writers,reads});
      setCfg(settings||{});
      setLoading(false);
    });
  },[]);

  const slides=[1,2,3].map(n=>({
    title:cfg[`hero_slide_${n}_title`],sub:cfg[`hero_slide_${n}_sub`],
    image:cfg[`hero_slide_${n}_image`],color:cfg[`hero_slide_${n}_color`]||"var(--brand)",
    tag:cfg[`hero_slide_${n}_tag`],
  })).filter(s=>s.title||s.image);

  const heroTitle=cfg.hero_title||`${cfg.brand_name||"Readlearc"}`;
  const heroSub=cfg.hero_sub||cfg.brand_tagline||"Writers earn 85% in USDC. Readers own proof of every article they unlock.";
  const heroCta=cfg.hero_cta||"Explore Articles";
  const heroImg=cfg.hero_image||"";
  const banner=cfg.site_banner||"";

  useEffect(()=>{
    if(slides.length<2)return;
    slideTimer.current=setInterval(()=>setSlide(s=>(s+1)%slides.length),5000);
    return()=>{if(slideTimer.current)clearInterval(slideTimer.current);};
  },[slides.length]);

  const activeSlide=slides[slide];
  const TAGS=["All",...cats.slice(0,7)];
  const feed=activeTag==="All"?trending:trending.filter(a=>a.category===activeTag);

  // ── Right sidebar
  const RightSidebar=()=>(
    <aside className="home-sidebar">
      <div className="card" style={{padding:"14px",marginBottom:10}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Platform Stats</div>
        {[{l:"Articles",v:stats.articles+"+"},{l:"Writers",v:stats.writers+"+"},{l:"Total Reads",v:stats.reads+"+"},{l:"Writer Share",v:"85% USDC"}].map(s=>(
          <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)",fontSize:11}}>
            <span style={{color:"var(--text-4)"}}>{s.l}</span>
            <span style={{fontWeight:800,color:"var(--text)",fontFamily:"Outfit,sans-serif"}}>{s.v}</span>
          </div>
        ))}
      </div>
      {cats.length>0&&(
        <div className="card" style={{padding:"14px",marginBottom:10}}>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Top Subjects</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {cats.slice(0,12).map(cat=>(
              <Link key={cat} href={`/explore?q=${encodeURIComponent(cat)}`}
                style={{fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)",textDecoration:"none"}}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="card" style={{padding:"14px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",marginBottom:10}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--brand)",marginBottom:6}}>Start Publishing</div>
        <p style={{fontSize:11,color:"var(--text-3)",lineHeight:1.6,marginBottom:10}}>Earn 85% of every USDC payment.</p>
        <Link href="/write" style={{display:"block",textAlign:"center",padding:"8px",background:"var(--brand)",color:"white",borderRadius:"var(--r)",fontWeight:700,fontSize:12,textDecoration:"none",marginBottom:6}}>Write Article</Link>
        <Link href="/write/research" style={{display:"block",textAlign:"center",padding:"7px",background:"transparent",color:"var(--brand)",border:"1px solid var(--brand-border)",borderRadius:"var(--r)",fontWeight:700,fontSize:12,textDecoration:"none"}}>Research Studio</Link>
      </div>
      <div className="card" style={{padding:"14px"}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--text)",marginBottom:6}}>Contribute</div>
        <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.5,marginBottom:8}}>Public &amp; private research collaboration spaces.</p>
        <Link href="/contribute" style={{display:"block",textAlign:"center",padding:"8px",background:"var(--bg-alt)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--r)",fontWeight:700,fontSize:12,textDecoration:"none"}}>Browse Spaces →</Link>
      </div>
    </aside>
  );

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>

      {/* ── Hero ── */}
      <div style={{marginTop:"var(--header-h)",position:"relative",height:"clamp(280px,38vh,440px)",overflow:"hidden"}}>
        {(activeSlide?.image||heroImg)?(
          <img src={activeSlide?.image||heroImg} alt="hero" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        ):(
          <div style={{width:"100%",height:"100%",background:`linear-gradient(145deg,#0a0618 0%,${cfg.brand_color||"#1a0938"} 50%,#06111e 100%)`}}>
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
          </div>
        )}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,.75) 0%,rgba(0,0,0,.4) 60%,rgba(0,0,0,.2) 100%)"}}/>
        <div className="container" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 clamp(16px,5vw,56px)"}}>
          <div style={{maxWidth:560}}>
            {(activeSlide?.tag||cfg.brand_name)&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:99,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",backdropFilter:"blur(8px)",marginBottom:12}}>
                <Zap size={10} color="white" style={{opacity:.8}}/>
                <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)",letterSpacing:".05em"}}>{activeSlide?.tag||cfg.brand_name||"Readlearc"}</span>
              </div>
            )}
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(24px,5vw,48px)",fontWeight:900,color:"white",lineHeight:1.05,letterSpacing:"-.03em",marginBottom:10}}>{activeSlide?.title||heroTitle}</h1>
            <p style={{fontSize:"clamp(12px,1.6vw,14px)",color:"rgba(255,255,255,.75)",lineHeight:1.7,marginBottom:20,maxWidth:480}}>{activeSlide?.sub||heroSub}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <Link href="/explore" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"var(--accent)",borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:13,color:"white",textDecoration:"none"}}>{heroCta}<ArrowRight size={13}/></Link>
              <Link href="/write" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:99,fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:13,color:"white",textDecoration:"none",backdropFilter:"blur(8px)"}}><PenLine size={12}/>Start Writing</Link>
            </div>
          </div>
        </div>
        {slides.length>1&&(
          <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
            {slides.map((_,i)=>(
              <button key={i} onClick={()=>setSlide(i)} style={{width:i===slide?20:6,height:6,borderRadius:99,background:i===slide?"white":"rgba(255,255,255,.35)",border:"none",cursor:"pointer",padding:0,transition:"all .3s"}}/>
            ))}
          </div>
        )}
      </div>

      {/* ── Banner ── */}
      {banner&&<div style={{width:"100%",maxHeight:100,overflow:"hidden"}}><img src={banner} alt="banner" style={{width:"100%",objectFit:"cover",display:"block",maxHeight:100}}/></div>}

      {/* ── Stats strip ── */}
      <div style={{background:"var(--bg-card)",borderBottom:"1px solid var(--border)",overflowX:"auto"}}>
        <div className="container" style={{display:"flex",minWidth:"max-content",padding:"0 16px"}}>
          {[{icon:BookOpen,label:"Published",v:stats.articles+"+"},{icon:Users,label:"Writers",v:stats.writers+"+"},{icon:TrendingUp,label:"Total Reads",v:stats.reads+"+"},{icon:Zap,label:"Writer Share",v:"85% USDC"},{icon:Shield,label:"On-chain Proof",v:"Every Read"}].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderRight:"1px solid var(--border)",flexShrink:0}}>
              <div style={{width:30,height:30,borderRadius:9,background:"var(--brand-muted)",border:"1px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <s.icon size={13} style={{color:"var(--brand)"}}/>
              </div>
              <div>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:900,color:"var(--text)",lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9,color:"var(--text-4)",marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body with sidebar ── */}
      <div className="container" style={{padding:"30px 16px 70px"}}>
        <div className="home-layout">
          <div className="home-main">

            {/* Featured Slider */}
            {featured.length>0&&<FeaturedSlider items={featured}/>}

            {/* Trending */}
            <section style={{marginBottom:40}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{width:3,height:20,background:"var(--accent)",borderRadius:2}}/>
                <Flame size={15} style={{color:"var(--accent)"}}/>
                <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Trending</h2>
              </div>
              <form onSubmit={e=>{e.preventDefault();if(search.trim())window.location.href=`/explore?q=${encodeURIComponent(search)}`;}} style={{position:"relative",marginBottom:10}}>
                <Search size={14} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles, topics, disciplines…"
                  style={{width:"100%",padding:"10px 14px 10px 38px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:13,color:"var(--text)",outline:"none",boxSizing:"border-box" as const}}/>
              </form>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {TAGS.map(t=>(
                  <button key={t} onClick={()=>setActiveTag(t)} style={{padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .12s",border:`1.5px solid ${activeTag===t?"var(--brand)":"var(--border)"}`,background:activeTag===t?"var(--brand-muted)":"transparent",color:activeTag===t?"var(--brand)":"var(--text-3)"}}>{t}</button>
                ))}
              </div>
              {loading?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
                  {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:180,borderRadius:"var(--r-lg)"}}/>)}
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
                  {feed.slice(0,6).map(a=><FeaturedCard key={a.id} a={a}/>)}
                </div>
              )}
              <div style={{textAlign:"center",marginTop:16}}>
                <Link href="/explore" className="btn btn-secondary" style={{gap:6}}>Browse all articles<ArrowRight size={12}/></Link>
              </div>
            </section>

            {/* Research */}
            {research.length>0&&(
              <section style={{marginBottom:40}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:3,height:20,background:"#0284c7",borderRadius:2}}/>
                    <FlaskConical size={15} style={{color:"#0284c7"}}/>
                    <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Research Papers</h2>
                  </div>
                  <Link href="/explore?research=1" style={{fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>View all<ArrowRight size={11}/></Link>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                  {research.map(a=>(
                    <Link key={a.id} href={`/article/${a.id}`} style={{textDecoration:"none"}}>
                      <div className="card card-hover" style={{padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                        <div style={{width:36,height:36,borderRadius:"var(--r)",background:"rgba(2,132,199,.1)",border:"1px solid rgba(2,132,199,.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <FlaskConical size={16} style={{color:"#0284c7"}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:9,fontWeight:700,color:"var(--brand)",marginBottom:4,fontFamily:"Outfit,sans-serif"}}>{a.category}</div>
                          <h4 style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.title}</h4>
                          {a.blurb&&<p style={{fontSize:11,color:"var(--text-3)",lineHeight:1.5,marginBottom:4,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{a.blurb}</p>}
                          <div style={{display:"flex",gap:8,fontSize:10,color:"var(--text-4)"}}>
                            <span>{a.authorShort}</span>
                            <span style={{color:"var(--accent)",fontWeight:700}}>${parseFloat(a.price).toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Browse by Discipline */}
            <section style={{marginBottom:40}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:3,height:20,background:"var(--brand)",borderRadius:2}}/>
                  <BookOpen size={15} style={{color:"var(--brand)"}}/>
                  <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Browse by Discipline</h2>
                </div>
                <Link href="/explore" style={{fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>Explore all<ArrowRight size={11}/></Link>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                {FACULTIES.map(f=>(
                  <Link key={f.id} href={`/explore?faculty=${f.id}`} style={{textDecoration:"none",display:"flex",height:"100%"}}>
                    <div className="card card-hover" style={{padding:"16px 10px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",minHeight:108,boxSizing:"border-box" as const}}>
                      <div style={{width:42,height:42,borderRadius:12,background:`${f.color}18`,border:`1.5px solid ${f.color}28`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8,flexShrink:0}}>
                        <FacultyIcon name={f.icon} size={20} style={{color:f.color}}/>
                      </div>
                      <div style={{fontFamily:"Outfit,sans-serif",fontSize:11,fontWeight:700,color:"var(--text)",lineHeight:1.25,textAlign:"center"}}>{f.label}</div>
                      <div style={{fontSize:9,color:"var(--text-4)",marginTop:4}}>{f.courses.length} courses</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* How it works */}
            <section style={{marginBottom:40,padding:"28px clamp(14px,4vw,36px)",background:"var(--bg-card)",borderRadius:"var(--r-xl)",border:"1px solid var(--border)"}}>
              <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",textAlign:"center",letterSpacing:"-.02em",marginBottom:4}}>How It Works</h2>
              <p style={{fontSize:12,color:"var(--text-4)",textAlign:"center",marginBottom:24}}>Fair economics for academic publishing on the Arc blockchain</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:18}}>
                {[{icon:PenLine,color:"var(--brand)",title:"Write & Submit",desc:"Use the rich editor or Research Studio. Submit for review."},{icon:Shield,color:"#d97706",title:"Quality Review",desc:"AI checks quality, originality, and plagiarism before going live."},{icon:BookOpen,color:"var(--accent)",title:"Readers Pay",desc:"Readers pay USDC per article — directly into your earnings."},{icon:Zap,color:"#0284c7",title:"You Earn 85%",desc:"85% of every USDC payment, paid out monthly."}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,border:`1.5px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
                      <s.icon size={20} style={{color:s.color}}/>
                    </div>
                    <h4 style={{fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:800,color:"var(--text)",marginBottom:5}}>{s.title}</h4>
                    <p style={{fontSize:11,color:"var(--text-3)",lineHeight:1.6}}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Latest */}
            {recent.length>0&&(
              <section>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:3,height:20,background:"var(--text-4)",borderRadius:2}}/>
                    <Clock size={14} style={{color:"var(--text-3)"}}/>
                    <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Latest</h2>
                  </div>
                  <Link href="/explore" style={{fontSize:11,color:"var(--brand)",textDecoration:"none",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>All<ArrowRight size={11}/></Link>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {recent.map(a=><ArticleRow key={a.id} a={a}/>)}
                </div>
              </section>
            )}
          </div>
          <RightSidebar/>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{background:"var(--bg-card)",borderTop:"1px solid var(--border)",padding:"32px 16px 24px"}}>
        <div className="container">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:24,marginBottom:28}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={13} color="white"/></div>
                <span style={{fontFamily:"Outfit,sans-serif",fontWeight:900,fontSize:14,color:"var(--text)"}}>{cfg.brand_name||"Readlearc"}</span>
              </div>
              <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.7}}>{cfg.brand_tagline||"Pay per word. Own every read."}</p>
            </div>
            {[{label:"Platform",links:[{l:"Explore",h:"/explore"},{l:"Write Article",h:"/write"},{l:"Research Studio",h:"/write/research"},{l:"Contribute",h:"/contribute"}]},{label:"Account",links:[{l:"My Wallet",h:"/wallet-app"},{l:"Reading History",h:"/reading-history"},{l:"My Profile",h:"/profile"}]},{label:"Network",links:[{l:"Arc Testnet",h:"https://testnet.arcscan.app"},{l:"Circle USDC",h:"https://faucet.circle.com"}]}].map(col=>(
              <div key={col.label}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>{col.label}</div>
                {col.links.map(l=>(
                  <Link key={l.l} href={l.h} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--text-4)",textDecoration:"none",marginBottom:7}}
                    onMouseEnter={e=>(e.currentTarget.style.color="var(--brand)")}
                    onMouseLeave={e=>(e.currentTarget.style.color="var(--text-4)")}>
                    <ChevronRight size={9} style={{flexShrink:0}}/>{l.l}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <p style={{fontSize:11,color:"var(--text-4)"}}>© {new Date().getFullYear()} {cfg.brand_name||"Readlearc"} · Built on Arc Testnet</p>
            <p style={{fontSize:11,color:"var(--text-4)",display:"flex",alignItems:"center",gap:5}}><Shield size={10}/>All payments verified on-chain</p>
          </div>
        </div>
      </footer>

      <style>{`
        .home-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        .home-main { min-width: 0; }
        .home-sidebar { display: none; }
        @media (min-width: 1060px) {
          .home-layout { grid-template-columns: 1fr 240px; }
          .home-sidebar { display: flex; flex-direction: column; gap: 10px; position: sticky; top: calc(var(--header-h) + 20px); }
        }
      `}</style>
    </div>
  );
}
