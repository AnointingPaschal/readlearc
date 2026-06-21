"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/ui/Navbar";
import { Search, Filter, Star, Clock, Users, TrendingUp, FlaskConical, BookOpen, Flame, Grid3X3, List, ArrowRight } from "lucide-react";

interface A {
  id:string;title:string;blurb:string;price:string;category:string;
  readTime:number;isResearch:boolean;authorShort:string;authorAddress:string;
  reads:number;status:string;featured:boolean;timestamp:number;
}

const SORTS = [
  { key:"reads",    label:"Most Read"   },
  { key:"new",      label:"Newest"      },
  { key:"featured", label:"Featured"    },
  { key:"price_asc",label:"Lowest Price"},
];

function Card({ a, view }: { a:A; view:"grid"|"list" }) {
  const g = parseInt(a.authorAddress.slice(2,4)||"0",16)*1.4;
  if (view==="list") return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
      <div className="card card-hover" style={{ padding:"13px 14px",display:"flex",gap:12,alignItems:"flex-start" }}>
        <div style={{ width:52,height:52,borderRadius:"var(--r)",background:`linear-gradient(135deg,hsl(${g}deg,50%,25%),hsl(${g+60}deg,45%,18%))`,flexShrink:0 }}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",gap:5,marginBottom:5,flexWrap:"wrap" }}>
            <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)" }}>{a.category}</span>
            {a.isResearch&&<span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)" }}>Research</span>}
            {a.featured&&<span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.2)",display:"flex",alignItems:"center",gap:3 }}><Star size={7}/>Featured</span>}
          </div>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:4 }}>{a.title}</h3>
          <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any,overflow:"hidden",marginBottom:6 }}>{a.blurb}</p>
          <div style={{ display:"flex",gap:10,fontSize:10,color:"var(--text-4)",flexWrap:"wrap" }}>
            <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{a.authorShort}</span>
            <span><Clock size={9}/> {a.readTime}m</span>
            <span>{a.reads} reads</span>
          </div>
        </div>
        <div style={{ fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:900,color:"var(--accent)",flexShrink:0 }}>${parseFloat(a.price).toFixed(3)}</div>
      </div>
    </Link>
  );
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration:"none" }}>
      <div className="card card-hover" style={{ padding:0,overflow:"hidden",display:"flex",flexDirection:"column",height:"100%" }}>
        <div style={{ height:70,background:`linear-gradient(135deg,hsl(${g}deg,50%,25%),hsl(${g+60}deg,45%,18%))`,flexShrink:0,position:"relative" }}>
          {a.featured&&<div style={{ position:"absolute",top:6,right:6,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(202,138,4,.85)",color:"white",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:3 }}><Star size={7}/>Featured</div>}
          {a.isResearch&&<div style={{ position:"absolute",top:6,left:6,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(2,132,199,.85)",color:"white",backdropFilter:"blur(4px)" }}>Research</div>}
        </div>
        <div style={{ padding:"12px",flex:1,display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",gap:5,marginBottom:6 }}>
            <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)" }}>{a.category}</span>
            <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(5,150,105,.09)",color:"var(--accent)",border:"1px solid rgba(5,150,105,.2)" }}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",lineHeight:1.3,marginBottom:6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as any,overflow:"hidden",flex:1 }}>{a.title}</h3>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto",paddingTop:6,borderTop:"1px solid var(--border)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              <div style={{ width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${g}deg,65%,55%),hsl(${g+40}deg,55%,45%))` }}/>
              <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:9,color:"var(--text-4)" }}>{a.authorShort}</span>
            </div>
            <span style={{ fontSize:9,color:"var(--text-4)",display:"flex",alignItems:"center",gap:2 }}><TrendingUp size={8}/>{a.reads}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [arts,     setArts]     = useState<A[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("All");
  const [sort,     setSort]     = useState("reads");
  const [view,     setView]     = useState<"grid"|"list">("grid");
  const [research, setResearch] = useState(false);
  const [cats,     setCats]     = useState<string[]>([]);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 18;

  useEffect(() => {
    setLoading(true);
    fetch("/api/articles?status=approved&limit=200")
      .then(r=>r.json()).then(d=>{
        const data = Array.isArray(d)?d:[];
        setArts(data);
        const c = Array.from(new Set(data.map((a:A)=>a.category).filter(Boolean))) as string[];
        setCats(c);
        setLoading(false);
      }).catch(()=>setLoading(false));
    // Check URL params
    if (typeof window!=="undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("filter")==="research") setResearch(true);
      if (p.get("filter")==="featured") setSort("featured");
      if (p.get("q")) setSearch(p.get("q")||"");
    }
  },[]);

  const filtered = arts.filter(a=>{
    if (research && !a.isResearch) return false;
    if (cat!=="All" && a.category!==cat) return false;
    if (sort==="featured" && !a.featured) return false;
    if (search) {
      const q=search.toLowerCase();
      return a.title.toLowerCase().includes(q)||a.blurb?.toLowerCase().includes(q)||a.category?.toLowerCase().includes(q)||a.authorShort?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a,b)=>{
    if (sort==="reads") return b.reads-a.reads;
    if (sort==="new")   return b.timestamp-a.timestamp;
    if (sort==="price_asc") return parseFloat(a.price)-parseFloat(b.price);
    return 0;
  });

  const totalPages = Math.ceil(filtered.length/PER_PAGE);
  const paged      = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const featCount  = arts.filter(a=>a.featured).length;
  const resCount   = arts.filter(a=>a.isResearch).length;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"calc(var(--header-h) + 20px) 12px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(22px,4vw,32px)",fontWeight:900,color:"var(--text)",letterSpacing:"-.03em",marginBottom:4 }}>Explore Articles</h1>
          <p style={{ fontSize:13,color:"var(--text-4)" }}>{arts.length} published · {featCount} featured · {resCount} research papers</p>
        </div>

        {/* Search bar */}
        <div style={{ position:"relative",marginBottom:16 }}>
          <Search size={15} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search titles, authors, topics…"
            style={{ width:"100%",padding:"12px 14px 12px 42px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:14,color:"var(--text)",outline:"none",boxSizing:"border-box" as const }}/>
        </div>

        {/* Filters row */}
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:20 }}>
          {/* Category pills */}
          <div style={{ display:"flex",gap:5,flexWrap:"wrap",flex:1 }}>
            {["All",...cats.slice(0,7)].map(c=>(
              <button key={c} onClick={()=>{setCat(c);setPage(1);}}
                style={{ padding:"5px 12px",borderRadius:99,border:`1.5px solid ${cat===c?"var(--brand)":"var(--border)"}`,background:cat===c?"var(--brand-muted)":"transparent",fontSize:11,fontWeight:700,color:cat===c?"var(--brand)":"var(--text-3)",cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .12s" }}>
                {c}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}
            style={{ padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",cursor:"pointer" }}>
            {SORTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          {/* View toggle */}
          <div style={{ display:"flex",border:"1.5px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden" }}>
            {(["grid","list"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ width:32,height:32,border:"none",cursor:"pointer",background:view===v?"var(--brand-muted)":"var(--bg-alt)",color:view===v?"var(--brand)":"var(--text-4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {v==="grid"?<Grid3X3 size={13}/>:<List size={13}/>}
              </button>
            ))}
          </div>
          {/* Research toggle */}
          <button onClick={()=>{setResearch(v=>!v);setPage(1);}}
            style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:99,border:`1.5px solid ${research?"#0284c7":"var(--border)"}`,background:research?"rgba(2,132,199,.1)":"transparent",fontSize:11,fontWeight:700,color:research?"#0284c7":"var(--text-3)",cursor:"pointer",transition:"all .12s" }}>
            <FlaskConical size={11}/>Research Only
          </button>
        </div>

        {/* Results count */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
          <p style={{ fontSize:12,color:"var(--text-4)" }}>
            {loading?"Loading…":`${filtered.length} article${filtered.length!==1?"s":""}`}{search&&` for "${search}"`}
          </p>
          {totalPages>1&&<p style={{ fontSize:12,color:"var(--text-4)" }}>Page {page} of {totalPages}</p>}
        </div>

        {/* Grid / List */}
        {loading ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12 }}>
            {[...Array(12)].map((_,i)=><div key={i} className="skeleton" style={{ height:200,borderRadius:"var(--r-lg)" }}/>)}
          </div>
        ) : !paged.length ? (
          <div style={{ textAlign:"center",padding:"60px 16px" }}>
            <BookOpen size={36} style={{ color:"var(--text-4)",marginBottom:12 }}/>
            <p style={{ fontSize:15,color:"var(--text-3)",marginBottom:6 }}>No articles found</p>
            <p style={{ fontSize:12,color:"var(--text-4)",marginBottom:16 }}>Try a different search or category</p>
            <button onClick={()=>{setSearch("");setCat("All");setResearch(false);}} className="btn btn-secondary btn-sm">Clear filters</button>
          </div>
        ) : view==="grid" ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12 }}>
            {paged.map(a=><Card key={a.id} a={a} view="grid"/>)}
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {paged.map(a=><Card key={a.id} a={a} view="list"/>)}
          </div>
        )}

        {/* Pagination */}
        {totalPages>1&&(
          <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:24,flexWrap:"wrap" }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn btn-secondary btn-sm" style={{ opacity:page===1?.4:1 }}>← Prev</button>
            {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
              const n=totalPages<=7?i+1:page<=4?i+1:page>=totalPages-3?totalPages-6+i:page-3+i;
              return <button key={n} onClick={()=>setPage(n)} style={{ width:32,height:32,borderRadius:"var(--r)",border:`1.5px solid ${n===page?"var(--brand)":"var(--border)"}`,background:n===page?"var(--brand-muted)":"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:n===page?"var(--brand)":"var(--text-3)" }}>{n}</button>;
            })}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn btn-secondary btn-sm" style={{ opacity:page===totalPages?.4:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
