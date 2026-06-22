"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, Users, CheckCircle2, ExternalLink,
  Share2, BookOpen, RefreshCw, Tag, Star, FlaskConical,
} from "lucide-react";
import ResearchViewer from "../../../components/ui/ResearchViewer";
import Navbar from "../../../components/ui/Navbar";
import ArticleAI from "../../../components/ui/ArticleAI";
import Comments from "../../../components/social/Comments";
import Reactions from "../../../components/social/Reactions";
import FollowButton from "../../../components/social/FollowButton";
import { useAuth, EXPLORER_URL } from "../../../lib/auth";
import { payForArticle, canAfford, formatUsdc, getBalance, PaymentError } from "../../../lib/pay";
import { toHtml } from "../../../lib/markdown";

interface Article {
  id:string;title:string;blurb:string;content:string|null;
  contentPreview:string;contentBlur:string;
  price:string;category:string;readTime:number;isResearch:boolean;
  authorAddress:string;authorShort:string;status:string;
  reads:number;hasPaid:boolean;timestamp:number;
}

function hue(addr:string){return parseInt((addr||"000000").slice(2,4)||"0",16)*1.4;}

export default function ArticlePage() {
  const { id } = useParams<{ id:string }>();
  const { isAuth, address, signer, requireAuth, refresh, requestSign } = useAuth();

  const [article, setArticle] = useState<Article|null>(null);
  const [loading, setLoading] = useState(true);
  const [paid,    setPaid]    = useState(false);
  const [paying,  setPaying]  = useState(false);
  const [payStep, setPayStep] = useState("");
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);
  const [balance, setBalance] = useState<string|null>(null);
  const [related, setRelated] = useState<Article[]>([]);

  async function loadArticle() {
    if (!id) return;
    const url = `/api/articles/${id}${address?`?reader=${address.toLowerCase()}`:""}`;
    try {
      const r=await fetch(url);const d=await r.json();
      if(!d.error){setArticle(d);setPaid(d.hasPaid);}
    } catch {}
    setLoading(false);
  }
  useEffect(()=>{ setLoading(true); loadArticle(); },[id,address]);
  useEffect(()=>{ if(!signer||!isAuth){setBalance(null);return;} getBalance(signer).then(b=>setBalance(formatUsdc(b))); },[signer,isAuth]);
  useEffect(()=>{
    if (!article) return;
    fetch(`/api/articles?limit=4`).then(r=>r.json()).then(d=>{
      if (Array.isArray(d)) setRelated(d.filter((a:Article)=>a.id!==article.id).slice(0,3));
    }).catch(()=>{});
  },[article?.id]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth||!signer) { requireAuth(()=>handlePay()); return; }
    setError(""); setPaying(true); setPayStep("Checking balance…");
    try {
      const bal=await getBalance(signer);setBalance(formatUsdc(bal));
      if (!(await canAfford(signer,article.price))) {
        setError(`Insufficient USDC. Have $${formatUsdc(bal)}, need $${parseFloat(article.price).toFixed(3)}. Get test USDC at faucet.circle.com.`);
        setPaying(false);setPayStep("");return;
      }
      const ok=await requestSign({title:"Pay to Read",description:article.title.slice(0,70),to:article.authorAddress,amount:`$${parseFloat(article.price).toFixed(3)}`,token:"USDC",type:"USDC Transfer"});
      if (!ok){setPaying(false);setPayStep("");return;}
      setPayStep("Signing payment…");
      const {txHash:_txHash}=await payForArticle(signer,article.authorAddress,article.price,article.id);
      setTxHash(_txHash);
      setPayStep("Confirming on-chain…");
      await fetch("/api/articles",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:article.id,readerAddress:address?.toLowerCase(),txHash:_txHash})});
      setPayStep("Unlocking article…");
      await loadArticle();setPaid(true);refresh();
    } catch(e) {
      setError(e instanceof PaymentError?e.message:(e instanceof Error?e.message:"Payment failed"));
    }
    setPaying(false);setPayStep("");
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div className="read-layout" style={{paddingTop:"calc(var(--header-h) + 20px)"}}>
        <div className="read-main">
          {[80,20,20,16,16,400].map((h,i)=><div key={i} className="skeleton" style={{height:h,marginBottom:12,borderRadius:"var(--r)",width:i>1&&i<5?`${50+i*12}%`:"100%"}}/>)}
        </div>
      </div>
    </div>
  );
  if (!article) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:600,margin:"0 auto",padding:"calc(var(--header-h)+60px) 16px",textAlign:"center"}}>
        <BookOpen size={36} style={{color:"var(--text-4)",marginBottom:12}}/>
        <p style={{fontSize:15,color:"var(--text-3)",marginBottom:16}}>Article not found.</p>
        <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
      </div>
    </div>
  );

  const priceNum   = parseFloat(article.price)||0;
  const unlocked   = paid || article.hasPaid;
  const isResearch = article.isResearch;
  const isPending  = article.status==="pending";
  const clearHtml  = toHtml(article.contentPreview||"");
  const blurHtml   = toHtml(article.contentBlur||"");
  const fullHtml   = toHtml(article.content||"");
  const h          = hue(article.authorAddress);

  const SocialSection = ()=>(
    <div style={{marginTop:28}}>
      <Reactions articleId={article.id}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",margin:"16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Link href={`/profile/${article.authorAddress}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:"var(--brand)"}}>{article.authorShort}</div>
              <div style={{fontSize:10,color:"var(--text-4)"}}>Author</div>
            </div>
          </Link>
          <FollowButton targetAddress={article.authorAddress}/>
        </div>
      </div>
      <Comments articleId={article.id}/>
    </div>
  );

  // ── Right sidebar content ────────────────────────────────────────
  const RightSidebar = ()=>(
    <aside className="read-sidebar">
      {/* Article meta */}
      <div className="card" style={{padding:"14px",marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,fontFamily:"Outfit,sans-serif"}}>Article Info</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          <span className="badge badge-brand">{article.category}</span>
          {isResearch&&<span className="badge badge-blue">Research</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[
            {icon:Clock,label:"Read time",val:`${article.readTime} min`},
            {icon:Users,label:"Reads",val:String(article.reads)},
            {icon:Tag,label:"Price",val:`$${priceNum.toFixed(3)}`},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
              <span style={{color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}><r.icon size={10}/>{r.label}</span>
              <span style={{fontWeight:700,color:"var(--text)"}}>{r.val}</span>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid var(--border)",marginTop:12,paddingTop:12}}>
          <Link href={`/profile/${article.authorAddress}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",marginBottom:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,fontWeight:700,color:"var(--brand)"}}>{article.authorShort}</div>
              <div style={{fontSize:9,color:"var(--text-4)"}}>Author</div>
            </div>
          </Link>
          <FollowButton targetAddress={article.authorAddress}/>
        </div>
      </div>

      {/* Share */}
      <div className="card" style={{padding:"12px 14px",marginBottom:10}}>
        <button onClick={()=>{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
          className="btn btn-secondary" style={{width:"100%",justifyContent:"center",gap:6}}>
          {copied?<><CheckCircle2 size={12} style={{color:"var(--accent)"}}/>Copied!</>:<><Share2 size={12}/>Share Article</>}
        </button>
      </div>

      {/* Related */}
      {related.length>0&&(
        <div className="card" style={{padding:"14px"}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,fontFamily:"Outfit,sans-serif"}}>More Articles</div>
          {related.map(r=>(
            <Link key={r.id} href={`/article/${r.id}`} style={{textDecoration:"none",display:"block",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontSize:9,fontWeight:700,color:"var(--brand)",marginBottom:3}}>{r.category}</div>
              <div style={{fontSize:12,fontWeight:600,color:"var(--text)",lineHeight:1.3,marginBottom:3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{r.title}</div>
              <div style={{fontSize:10,fontWeight:700,color:"var(--accent)"}}>${parseFloat(r.price).toFixed(3)}</div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div className="read-layout" style={{paddingTop:"calc(var(--header-h) + 16px)"}}>

        {/* ── Main content ── */}
        <main className="read-main">
          <Link href="/explore" style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--text-3)",textDecoration:"none",marginBottom:16}}>
            <ArrowLeft size={13}/>Explore
          </Link>

          {isPending&&<div style={{padding:"9px 13px",background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",marginBottom:14,fontSize:12,color:"#d97706"}}>Pending review — only visible to you.</div>}

          <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <span className="badge badge-brand">{article.category}</span>
            {isResearch&&<span className="badge badge-blue"><FlaskConical size={9} style={{display:"inline",marginRight:3}}/>Research</span>}
            <span className="price-tag">${priceNum.toFixed(3)}</span>
            <span style={{fontSize:10,color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}>
              <Clock size={9}/>{article.readTime}m
              <span style={{opacity:.35}}>·</span>
              <Users size={9}/>{article.reads}
            </span>
          </div>

          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(20px,4.5vw,34px)",fontWeight:900,color:"var(--text)",lineHeight:1.1,letterSpacing:"-.03em",marginBottom:14}}>{article.title}</h1>

          {/* Author row + share (mobile) */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <Link href={`/profile/${article.authorAddress}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:`hsl(${h}deg,40%,50%)`,flexShrink:0}}/>
              <div>
                <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:"var(--brand)"}}>{article.authorShort}</div>
                <div style={{fontSize:10,color:"var(--text-4)"}}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</div>
              </div>
            </Link>
            <button onClick={()=>{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              className="btn btn-ghost btn-sm read-share-mobile">
              {copied?<CheckCircle2 size={11} style={{color:"var(--accent)"}}/>:<Share2 size={11}/>}{copied?"Copied":"Share"}
            </button>
          </div>

          <hr className="divider" style={{marginBottom:16}}/>
          {article.blurb&&<blockquote style={{borderLeft:"3px solid var(--brand)",paddingLeft:14,marginBottom:18,fontStyle:"italic",fontSize:"clamp(13px,2vw,15px)",color:"var(--text-2)",lineHeight:1.65}}>{article.blurb}</blockquote>}

          {/* ── Content ── */}
          {unlocked ? (
            <>
              {isResearch
                ? <ResearchViewer content={article.content||""} title={article.title}/>
                : <div className="article-render"><div dangerouslySetInnerHTML={{__html:fullHtml}}/></div>
              }
              {txHash&&(
                <div style={{marginTop:18,padding:"10px 14px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-lg)",display:"flex",alignItems:"center",gap:10}}>
                  <CheckCircle2 size={14} style={{color:"var(--accent)",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:700,color:"var(--accent)",marginBottom:2}}>Payment confirmed on Arc</p>
                    <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--brand)",textDecoration:"none"}}>{txHash.slice(0,20)}… <ExternalLink size={9}/></a>
                  </div>
                </div>
              )}
              <SocialSection/>
              <ArticleAI articleId={article.id} articleTitle={article.title} articleContent={article.content||""} isUnlocked={true}/>
            </>
          ) : (
            <>
              {isResearch ? (
                <ResearchViewer
                  content={clearHtml+blurHtml} title={article.title} locked={true}
                  payButton={
                    <div style={{textAlign:"center",width:"100%",padding:"0 16px"}}>
                      {error&&<div style={{padding:"8px 12px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:10,fontSize:11,color:"#dc2626"}}>{error}</div>}
                      <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                        style={{width:"100%",maxWidth:280,justifyContent:"center",fontWeight:800,fontSize:15,height:48,borderRadius:99,boxShadow:"0 4px 20px rgba(109,40,217,.35)"}}>
                        {paying?<><RefreshCw size={13} className="spin"/>{payStep}</>:`Continue Reading · $${priceNum.toFixed(3)}`}
                      </button>
                      {!isAuth&&<p style={{fontSize:10,color:"rgba(0,0,0,.4)",marginTop:6}}>Create a free wallet to unlock</p>}
                    </div>
                  }
                />
              ) : (
                <>
                  <div className="article-render"><div dangerouslySetInnerHTML={{__html:clearHtml}}/></div>
                  <div style={{position:"relative",overflow:"hidden"}}>
                    <div style={{filter:"blur(3px)",userSelect:"none",pointerEvents:"none",fontFamily:"Georgia,serif",fontSize:"clamp(14px,2vw,15px)",lineHeight:1.7,color:"var(--text-2)"}}>
                      <div className="article-render"><div dangerouslySetInnerHTML={{__html:blurHtml}}/></div>
                    </div>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 0%, transparent 15%, rgba(249,248,247,.6) 45%, rgba(249,248,247,.9) 70%, rgb(249,248,247) 100%)",pointerEvents:"none"}}/>
                  </div>
                  <div style={{textAlign:"center",padding:"clamp(16px,3vw,28px) 16px 20px"}}>
                    {isAuth&&balance!==null&&parseFloat(balance)<priceNum&&(
                      <p style={{fontSize:11,color:"#dc2626",marginBottom:10}}>Balance: ${balance} — <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--brand)",fontWeight:600}}>Get test USDC ↗</a></p>
                    )}
                    {error&&<div style={{padding:"9px 13px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:12,fontSize:12,color:"#dc2626",textAlign:"left"}}>{error}</div>}
                    <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                      style={{width:"100%",maxWidth:300,justifyContent:"center",fontWeight:800,fontSize:16,height:50,borderRadius:99}}>
                      {paying?<><RefreshCw size={14} className="spin"/>{payStep||"Processing…"}</>:`Continue Reading · $${priceNum.toFixed(3)}`}
                    </button>
                    {!isAuth&&<p style={{fontSize:11,color:"var(--text-4)",marginTop:8}}>Create a free wallet — 30 seconds.</p>}
                  </div>
                </>
              )}
              <div style={{paddingTop:12,borderTop:"1px solid var(--border)"}}>
                <Reactions articleId={article.id}/>
              </div>
            </>
          )}
        </main>

        {/* ── Right sidebar (desktop only) ── */}
        <RightSidebar/>
      </div>

      <style>{`
        .read-layout {
          max-width: 1100px;
          margin: 0 auto;
          padding-left: 14px;
          padding-right: 14px;
          padding-bottom: calc(var(--bottom-nav-h, 0px) + 40px);
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: start;
        }
        .read-main { min-width: 0; }
        .read-sidebar { display: none; }
        .read-share-mobile { display: inline-flex; }
        @media (min-width: 960px) {
          .read-layout { grid-template-columns: 1fr 260px; }
          .read-sidebar { display: block; position: sticky; top: calc(var(--header-h) + 16px); }
          .read-share-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
