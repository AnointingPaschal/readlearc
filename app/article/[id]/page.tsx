"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Users, CheckCircle2, ExternalLink, Share2, BookOpen, RefreshCw } from "lucide-react";
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



export default function ArticlePage() {
  const { id }  = useParams<{ id:string }>();
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

  async function loadArticle() {
    if (!id) return;
    const url = `/api/articles/${id}${address?`?reader=${address.toLowerCase()}`:""}`;
    try { const r=await fetch(url);const d=await r.json();if(!d.error){setArticle(d);setPaid(d.hasPaid);} } catch {}
    setLoading(false);
  }
  useEffect(()=>{ setLoading(true); loadArticle(); },[id,address]);
  useEffect(()=>{ if(!signer||!isAuth){setBalance(null);return;} getBalance(signer).then(b=>setBalance(formatUsdc(b))); },[signer,isAuth]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth||!signer) { requireAuth(()=>handlePay()); return; }
    setError(""); setPaying(true); setPayStep("Checking balance…");
    try {
      const bal = await getBalance(signer); setBalance(formatUsdc(bal));
      if (!(await canAfford(signer,article.price))) {
        setError(`Insufficient USDC. Have $${formatUsdc(bal)}, need $${parseFloat(article.price).toFixed(3)}. Get test USDC at faucet.circle.com.`);
        setPaying(false); setPayStep(""); return;
      }
      const ok = await requestSign({ title:"Pay to Read",description:article.title.slice(0,70),to:article.authorAddress,amount:`$${parseFloat(article.price).toFixed(3)}`,token:"USDC",type:"USDC Transfer" });
      if (!ok) { setPaying(false); setPayStep(""); return; }
      setPayStep("Signing…");
      const {txHash:hash} = await payForArticle(signer,article.id,article.authorAddress,article.price);
      setTxHash(hash); setPayStep("Unlocking…");
      const r = await fetch(`/api/articles/${id}/pay`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({readerAddress:address.toLowerCase(),txHash:hash,amountPaid:article.price})});
      const d = await r.json();
      if (d.content) setArticle(prev=>prev?{...prev,content:d.content,contentPreview:d.content,contentBlur:""}:prev);
      setPaid(true); setPayStep(""); refresh();
    } catch(e:any) { setError(e instanceof PaymentError?e.message:"Unexpected error."); setPayStep(""); }
    setPaying(false);
  }

  if (loading) return (<div style={{minHeight:"100vh",background:"var(--bg)"}}><Navbar/><div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h)+40px) 16px"}}>{[70,20,20,16,16].map((h,i)=><div key={i} className="skeleton" style={{height:h,marginBottom:12,borderRadius:"var(--r)",width:i>1?`${65+i*7}%`:"100%"}}/>)}</div></div>);
  if (!article) return (<div style={{minHeight:"100vh",background:"var(--bg)"}}><Navbar/><div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h)+60px) 16px",textAlign:"center"}}><BookOpen size={36} style={{color:"var(--text-4)",marginBottom:12}}/><p style={{fontSize:15,color:"var(--text-3)",marginBottom:16}}>Article not found.</p><Link href="/explore" className="btn btn-primary">Browse Articles</Link></div></div>);

  const isPending = article.status==="pending";
  const isAuthor  = address?.toLowerCase()===article.authorAddress?.toLowerCase();
  const unlocked  = paid||isAuthor;
  const isResearch= article.isResearch;
  const priceNum  = parseFloat(article.price);
  const fullHtml   = toHtml(article.content || "");
  const clearHtml  = toHtml(article.contentPreview || "");
  const blurHtml   = toHtml(article.contentBlur   || "");

  const SocialSection = () => (
    <div style={{ marginTop:28 }}>
      <Reactions articleId={article.id}/>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",margin:"16px 0" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt((article.authorAddress||"000000").slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt((article.authorAddress||"000000").slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif" }}>{article.authorShort}</div>
            <div style={{ fontSize:11,color:"var(--text-4)" }}>Article author</div>
          </div>
        </div>
        {!isAuthor&&<FollowButton targetAddress={article.authorAddress}/>}
      </div>
      <Comments articleId={article.id}/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:isResearch&&unlocked?900:820,margin:"0 auto",padding:"calc(var(--header-h)+16px) 12px 100px"}}>
        <Link href="/explore" style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--text-3)",textDecoration:"none",marginBottom:16}}><ArrowLeft size={13}/>Explore</Link>
        {isPending&&<div style={{padding:"9px 13px",background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",marginBottom:14,fontSize:12,color:"#d97706"}}>⏳ Pending review — only visible to you.</div>}

        <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <span className="badge badge-brand">{article.category}</span>
          {isResearch&&<span className="badge badge-blue">Research</span>}
          <span className="price-tag">${priceNum.toFixed(3)}</span>
          <span style={{fontSize:10,color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}><Clock size={9}/>{article.readTime}m <span style={{opacity:.35}}>·</span><Users size={9}/>{article.reads}</span>
        </div>

        <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(20px,4.5vw,36px)",fontWeight:900,color:"var(--text)",lineHeight:1.1,letterSpacing:"-.03em",marginBottom:16}}>{article.title}</h1>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
          <Link href={`/profile/${article.authorAddress}`} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt((article.authorAddress||"000000").slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt((article.authorAddress||"000000").slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
            <div>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:"var(--brand)"}}>{article.authorShort}</div>
              <div style={{fontSize:10,color:"var(--text-4)"}}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</div>
            </div>
          </Link>
          <button onClick={()=>{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="btn btn-ghost btn-sm">
            {copied?<CheckCircle2 size={11} style={{color:"var(--accent)"}}/>:<Share2 size={11}/>}{copied?"Copied":"Share"}
          </button>
        </div>

        <hr className="divider" style={{marginBottom:18}}/>
        {article.blurb&&<blockquote style={{borderLeft:"3px solid var(--brand)",paddingLeft:14,marginBottom:18,fontStyle:"italic",fontSize:"clamp(13px,2vw,15px)",color:"var(--text-2)",lineHeight:1.65}}>{article.blurb}</blockquote>}

        {/* ── UNLOCKED ── */}
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
            {/* Clear content */}
            {isResearch ? (
              <ResearchViewer
                content={clearHtml + blurHtml}
                title={article.title}
                locked={true}
                payButton={
                  <div style={{ textAlign:"center", width:"100%", padding:"0 16px" }}>
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
                {/* Gradual blur zone */}
                <div style={{ position:"relative", overflow:"hidden" }}>
                  <div style={{ filter:"blur(3px)", userSelect:"none", pointerEvents:"none", fontFamily:"Georgia,serif", fontSize:"clamp(14px,2vw,15px)", lineHeight:1.7, color:"var(--text-2)" }}>
                    <div className="article-render"><div dangerouslySetInnerHTML={{__html:blurHtml}}/></div>
                  </div>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 0%, transparent 15%, rgba(249,248,247,.6) 45%, rgba(249,248,247,.9) 70%, rgb(249,248,247) 100%)", pointerEvents:"none" }}/>
                </div>
                {/* CTA */}
                <div style={{ textAlign:"center", padding:"clamp(16px,3vw,28px) 16px 20px" }}>
                  {isAuth&&balance!==null&&parseFloat(balance)<priceNum&&(
                    <p style={{fontSize:11,color:"#dc2626",marginBottom:10}}>Balance: ${balance} — <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--brand)",fontWeight:600}}>Get test USDC ↗</a></p>
                  )}
                  {error&&<div style={{padding:"9px 13px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:12,fontSize:12,color:"#dc2626",textAlign:"left"}}>{error}</div>}
                  <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                    style={{width:"100%",maxWidth:300,justifyContent:"center",fontWeight:800,fontSize:16,height:50,borderRadius:99}}>
                    {paying?<><RefreshCw size={14} className="spin"/>{payStep||"Processing…"}</>:`Continue Reading · $${priceNum.toFixed(3)}`}
                  </button>
                  {!isAuth&&<p style={{fontSize:11,color:"var(--text-4)",marginTop:8}}>Create a free wallet to unlock — 30 seconds.</p>}
                </div>
              </>
            )}

            {/* Reactions above fold */}
            <div style={{paddingTop:12,borderTop:"1px solid var(--border)"}}>
              <Reactions articleId={article.id}/>
            </div>
          </>
        )}
      </div>

      <style>{`
        .article-render{font-family:Georgia,serif;font-size:clamp(14px,2vw,15px);line-height:1.68;color:var(--text-2)}
        .article-render h1{font-family:Outfit,sans-serif;font-size:clamp(20px,4vw,32px);font-weight:900;color:var(--text);line-height:1.1;margin:20px 0 9px;letter-spacing:-.02em}
        .article-render h2{font-family:Outfit,sans-serif;font-size:clamp(16px,3vw,22px);font-weight:800;color:var(--text);margin:16px 0 6px}
        .article-render h3{font-family:Outfit,sans-serif;font-size:clamp(14px,2.5vw,18px);font-weight:700;color:var(--text);margin:12px 0 5px}
        .article-render p{margin:0 0 10px}
        .article-render strong{font-weight:700;color:var(--text)}
        .article-render em{font-style:italic}
        .article-render blockquote{border-left:3px solid var(--brand);padding:3px 0 3px 13px;margin:12px 0;font-style:italic;color:var(--text-3)}
        .article-render pre{background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--r-md);padding:11px 14px;font-family:"JetBrains Mono",monospace;font-size:12px;overflow-x:auto;margin:10px 0}
        .article-render code{font-family:"JetBrains Mono",monospace;background:var(--bg-alt);padding:1px 5px;border-radius:3px;font-size:.87em}
        .article-render ul,.article-render ol{padding-left:22px;margin:0 0 10px}
        .article-render li{margin:3px 0}
        .article-render a{color:var(--brand);text-decoration:underline}
        .article-render img{max-width:100%;border-radius:var(--r-lg);margin:12px 0;display:block}
        .article-render hr{border:none;border-top:2px solid var(--border);margin:18px 0}
        .article-render table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}
        .article-render td,.article-render th{border:1px solid var(--border);padding:6px 10px}
        .article-render th{background:var(--bg-alt);font-weight:700}
      `}</style>
    </div>
  );
}
