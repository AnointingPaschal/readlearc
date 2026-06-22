"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Users, CheckCircle2, ExternalLink, Share2, BookOpen, RefreshCw, Printer, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import ArticleAI from "../../../components/ui/ArticleAI";
import Comments from "../../../components/social/Comments";
import Reactions from "../../../components/social/Reactions";
import FollowButton from "../../../components/social/FollowButton";
import { useAuth, EXPLORER_URL } from "../../../lib/auth";
import { payForArticle, canAfford, formatUsdc, getBalance, PaymentError } from "../../../lib/pay";
import { toHtml } from "../../../lib/markdown";

interface Article {
  id:string;title:string;blurb:string;content:string|null;price:string;
  category:string;readTime:number;isResearch:boolean;
  authorAddress:string;authorShort:string;status:string;
  reads:number;hasPaid:boolean;timestamp:number;
}

// ── A4 research page-by-section ───────────────────────────────────
function ResearchView({ content, title }: { content:string; title:string }) {
  const html = toHtml(content);
  const rawSections = html.split(/(?=<h2[\s>])/i);
  const sections: { heading:string; html:string }[] = [];
  for (const part of rawSections) {
    if (!part.trim()) continue;
    const m = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*)/i);
    if (m) sections.push({ heading: m[1].replace(/<[^>]+>/g,"").trim(), html: part });
    else if (!sections.length) sections.push({ heading:"", html:part });
  }
  const [page, setPage] = useState(0);
  const cur = sections[page] || { heading:"", html:"" };

  function print() {
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@page{size:A4 portrait;margin:2.54cm}body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.6;color:#000}h1{font-size:18pt;font-weight:bold;text-align:center;margin:0 0 4pt}h2{font-size:14pt;font-weight:bold;margin:14pt 0 3pt;border-bottom:1px solid #555;padding-bottom:2pt;page-break-after:avoid}h3{font-size:12pt;font-weight:bold;font-style:italic;margin:10pt 0 3pt}p{margin:0 0 7pt;text-align:justify}strong{font-weight:bold}em{font-style:italic}table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt}td,th{border:1pt solid #999;padding:3pt 7pt}th{background:#f0f0f0;font-weight:bold}blockquote{border-left:3pt solid #666;padding-left:10pt;margin:7pt 0;font-style:italic}img{max-width:100%;display:block;margin:8pt auto}ul,ol{padding-left:18pt;margin:4pt 0}li{margin:2pt 0}</style></head><body><h1>${title}</h1><hr/>${html}</body></html>`);
    win.document.close(); setTimeout(()=>win.print(),400);
  }

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#f1f3f4",borderRadius:"var(--r-lg)",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <FileText size={12} style={{ color:"#5f6368" }}/>
          <span style={{ fontSize:11,fontWeight:600,color:"#5f6368" }}>Research · Page {page+1}/{sections.length}</span>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 9px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:page===0?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:page===0?.4:1 }}><ChevronLeft size={11}/>Prev</button>
          <button onClick={()=>setPage(p=>Math.min(sections.length-1,p+1))} disabled={page===sections.length-1} style={{ display:"flex",alignItems:"center",gap:3,padding:"4px 9px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:page===sections.length-1?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:page===sections.length-1?.4:1 }}>Next<ChevronRight size={11}/></button>
          <button onClick={print} style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 11px",border:"1px solid #dadce0",borderRadius:5,background:"white",cursor:"pointer",fontSize:11,fontWeight:600,color:"#3c4043" }}><Printer size={11}/>Print</button>
        </div>
      </div>
      <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:12 }}>
        {sections.map((s,i)=>s.heading&&(<button key={i} onClick={()=>setPage(i)} style={{ padding:"3px 9px",borderRadius:"var(--r-f)",border:`1.5px solid ${i===page?"var(--brand)":"var(--border)"}`,background:i===page?"var(--brand-muted)":"transparent",fontSize:10,fontWeight:i===page?700:400,color:i===page?"var(--brand)":"var(--text-4)",cursor:"pointer" }}>{s.heading}</button>))}
      </div>
      <div style={{ background:"#d0d0d0",padding:"clamp(8px,2vw,16px) clamp(6px,1.5vw,10px)",borderRadius:"var(--r-lg)" }}>
        <div style={{ background:"white",maxWidth:794,margin:"0 auto",padding:"clamp(18px,4vw,72px)",boxShadow:"0 2px 10px rgba(0,0,0,.25)",borderRadius:2,boxSizing:"border-box" as const }}>
          {page===0&&(<><div style={{ fontFamily:'"Times New Roman",Times,serif',fontSize:"clamp(13px,2.5vw,16pt)",fontWeight:700,textAlign:"center",lineHeight:1.3,marginBottom:6,color:"#000" }}>{title}</div><div style={{ borderTop:"1px solid #666",margin:"8px 0 14px" }}/></>)}
          <div className="research-body" dangerouslySetInnerHTML={{ __html:cur.html }}/>
          <div style={{ marginTop:24,paddingTop:12,borderTop:"1px solid #e0e0e0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:"4px 10px",border:"1px solid #e0e0e0",borderRadius:4,background:"transparent",cursor:page===0?"not-allowed":"pointer",fontSize:10,color:"#777",opacity:page===0?.3:1,fontFamily:'"Times New Roman",Times,serif' }}>← Previous</button>
            <span style={{ fontFamily:'"Times New Roman",Times,serif',fontSize:9,color:"#aaa" }}>{page+1} / {sections.length}</span>
            <button onClick={()=>setPage(p=>Math.min(sections.length-1,p+1))} disabled={page===sections.length-1} style={{ padding:"4px 10px",border:"1px solid #e0e0e0",borderRadius:4,background:"transparent",cursor:page===sections.length-1?"not-allowed":"pointer",fontSize:10,color:"#777",opacity:page===sections.length-1?.3:1,fontFamily:'"Times New Roman",Times,serif' }}>Next →</button>
          </div>
        </div>
      </div>
      <style>{`.research-body{font-family:"Times New Roman",Times,serif;font-size:clamp(10px,1.8vw,12pt);line-height:1.6;color:#000;word-break:break-word}.research-body h2{font-size:clamp(12px,2.2vw,14pt);font-weight:bold;margin:14px 0 5px;padding-bottom:3px;border-bottom:1.5px solid #444;page-break-after:avoid}.research-body h3{font-size:clamp(11px,2vw,12pt);font-weight:bold;font-style:italic;margin:11px 0 4px}.research-body p{margin:0 0 7px;text-align:justify;hyphens:auto}.research-body strong{font-weight:bold}.research-body em{font-style:italic}.research-body table{border-collapse:collapse;width:100%;margin:10px 0;font-size:clamp(9px,1.4vw,10pt)}.research-body td,.research-body th{border:1px solid #bbb;padding:4px 8px}.research-body th{background:#f0f0f0;font-weight:bold;text-align:center}.research-body blockquote{border-left:3px solid #777;padding-left:12px;margin:8px 0;font-style:italic;color:#444}.research-body ul,.research-body ol{padding-left:20px;margin:4px 0 7px}.research-body li{margin:2px 0}.research-body a{color:#1a0dab;text-decoration:underline}.research-body img{max-width:100%;display:block;margin:10px auto}.research-body hr{border:none;border-top:1px solid #ccc;margin:10px 0}`}</style>
    </div>
  );
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
      if (d.content) setArticle(prev=>prev?{...prev,content:d.content}:prev);
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
  const fullHtml  = toHtml(article.content||"");
  // Show ~55% of content clearly, then blur rest
  const splitAt   = Math.floor(fullHtml.length*0.55);
  const clearHtml = fullHtml.slice(0, splitAt);
  const blurHtml  = fullHtml.slice(splitAt, splitAt + 1200); // show some but blurred

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
              ? <ResearchView content={article.content||""} title={article.title}/>
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
              <div style={{background:"#d0d0d0",padding:"12px 8px",borderRadius:"var(--r-lg)",marginBottom:0}}>
                <div style={{background:"white",maxWidth:794,margin:"0 auto",padding:"clamp(18px,4vw,60px)",boxShadow:"0 2px 10px rgba(0,0,0,.2)",borderRadius:2}}>
                  <div style={{fontFamily:'"Times New Roman",Times,serif',fontSize:"clamp(13px,2.5vw,16pt)",fontWeight:700,textAlign:"center",marginBottom:6,lineHeight:1.3}}>{article.title}</div>
                  <div style={{borderTop:"1px solid #888",margin:"8px 0 14px"}}/>
                  <div className="research-body" dangerouslySetInnerHTML={{__html:clearHtml}}/>
                </div>
              </div>
            ) : (
              <div className="article-render"><div dangerouslySetInnerHTML={{__html:clearHtml}}/></div>
            )}

            {/* Gradual blur zone */}
            <div style={{ position:"relative", overflow:"hidden", marginTop:0 }}>
              {/* Blurred continuation */}
              <div style={{ filter:"blur(3px)", userSelect:"none", pointerEvents:"none",
                fontFamily:isResearch?'"Times New Roman",Times,serif':"Georgia,serif",
                fontSize:isResearch?"12pt":"clamp(14px,2vw,15px)", lineHeight:1.7,
                color:isResearch?"#000":"var(--text-2)", padding:isResearch?"0 clamp(18px,4vw,60px)":"0" }}>
                <div dangerouslySetInnerHTML={{__html:blurHtml}}/>
              </div>
              {/* Progressive fade overlay */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(var(--bg-num,249,248,247),.5) 40%, rgba(var(--bg-num,249,248,247),.85) 65%, var(--bg) 100%)", pointerEvents:"none" }}/>
            </div>

            {/* CTA — no pricing text, just the button */}
            <div style={{ textAlign:"center", padding:"clamp(20px,4vw,36px) 16px 24px", marginTop:0 }}>
              {isAuth&&balance!==null&&parseFloat(balance)<priceNum&&(
                <p style={{fontSize:11,color:"#dc2626",marginBottom:10}}>Balance: ${balance} USDC — <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--brand)",fontWeight:600}}>Get test USDC ↗</a></p>
              )}
              {error&&<div style={{padding:"9px 13px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:12,fontSize:12,color:"#dc2626",textAlign:"left"}}>{error}</div>}
              <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                style={{width:"100%",maxWidth:320,justifyContent:"center",fontWeight:800,fontSize:16,height:50,borderRadius:99}}>
                {paying ? <><RefreshCw size={14} className="spin"/>{payStep||"Processing…"}</> : `Continue Reading · $${priceNum.toFixed(3)}`}
              </button>
              {!isAuth&&<p style={{fontSize:11,color:"var(--text-4)",marginTop:8}}>Create a free wallet to unlock — takes 30 seconds.</p>}
            </div>

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
