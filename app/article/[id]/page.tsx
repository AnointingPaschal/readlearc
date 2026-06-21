"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, Users, CheckCircle2, ExternalLink,
  Share2, BookOpen, AlertCircle, RefreshCw, Printer, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import ArticleAI from "../../../components/ui/ArticleAI";
import { useAuth, EXPLORER_URL } from "../../../lib/auth";
import { payForArticle, canAfford, formatUsdc, getBalance, PaymentError } from "../../../lib/pay";
import { toHtml } from "../../../lib/markdown";

interface Article {
  id:string; title:string; blurb:string; content:string|null; price:string;
  category:string; readTime:number; isResearch:boolean;
  authorAddress:string; authorShort:string; status:string;
  reads:number; hasPaid:boolean; timestamp:number;
}

// ── Research: split sections and display page-by-page ─────────────
function ResearchView({ content, title }: { content:string; title:string }) {
  // Split at every <h2>
  const raw = toHtml(content);
  const parts = raw.split(/(?=<h2[^>]*>)/);
  // First part before any h2 (preamble) + each section
  const sections: Array<{heading:string; body:string}> = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const m = part.match(/^<h2[^>]*>(.*?)<\/h2>([\s\S]*)/i);
    if (m) sections.push({ heading: m[1].replace(/<[^>]+>/g,""), body: m[0] });
    else if (sections.length === 0) sections.push({ heading:"", body:part });
  }

  const [page, setPage] = useState(0);

  function handlePrint() {
    const win = window.open("","_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
@page{size:A4;margin:2.54cm}
body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.6;color:#000;max-width:100%}
h1{font-size:18pt;font-weight:bold;text-align:center;margin:0 0 6pt}
h2{font-size:14pt;font-weight:bold;margin:14pt 0 4pt;border-bottom:1px solid #555;padding-bottom:2pt;page-break-after:avoid}
h3{font-size:12pt;font-weight:bold;margin:10pt 0 4pt}
p{margin:0 0 8pt;text-align:justify}
table{border-collapse:collapse;width:100%;margin:10pt 0}
td,th{border:1px solid #999;padding:4pt 8pt;font-size:10pt}
th{background:#f0f0f0;font-weight:bold}
blockquote{border-left:3pt solid #666;padding-left:12pt;margin:8pt 0;font-style:italic}
img{max-width:100%;display:block;margin:10pt auto}
ul,ol{padding-left:20pt;margin:6pt 0}
li{margin:3pt 0}
a{color:#1a0dab}
hr{border:none;border-top:1px solid #ccc;margin:14pt 0}
@media print{body{margin:0}}
</style></head><body>
<h1>${title}</h1><hr/>
${raw}
</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),400);
  }

  const totalPages = sections.length;
  const cur        = sections[page] || sections[0];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background:"#f1f3f4", borderRadius:"var(--r-lg)", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <FileText size={13} style={{ color:"#5f6368" }}/>
          <span style={{ fontSize:12, fontWeight:600, color:"#5f6368" }}>Research Paper</span>
          <span style={{ fontSize:11, color:"#9aa0a6" }}>·</span>
          <span style={{ fontSize:11, color:"#9aa0a6" }}>Section {page+1} of {totalPages}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
            style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1px solid #dadce0",borderRadius:6,background:"white",cursor:page===0?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:page===0?.4:1 }}>
            <ChevronLeft size={12}/>Prev
          </button>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
            style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1px solid #dadce0",borderRadius:6,background:"white",cursor:page===totalPages-1?"not-allowed":"pointer",fontSize:11,color:"#3c4043",opacity:page===totalPages-1?.4:1 }}>
            Next<ChevronRight size={12}/>
          </button>
          <button onClick={handlePrint}
            style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",border:"1px solid #dadce0",borderRadius:6,background:"white",cursor:"pointer",fontSize:11,fontWeight:600,color:"#3c4043" }}>
            <Printer size={11}/>Print / PDF
          </button>
        </div>
      </div>

      {/* TOC pills */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {sections.map((s,i) => s.heading && (
          <button key={i} onClick={()=>setPage(i)}
            style={{ padding:"3px 10px", borderRadius:"var(--r-f)", border:`1.5px solid ${i===page?"var(--brand)":"var(--border)"}`, background:i===page?"var(--brand-muted)":"transparent", fontSize:11, fontWeight:i===page?700:400, color:i===page?"var(--brand)":"var(--text-4)", cursor:"pointer", transition:"all .12s" }}>
            {s.heading}
          </button>
        ))}
      </div>

      {/* A4 page */}
      <div style={{ background:"#e8eaed", padding:"clamp(10px,3vw,20px) clamp(8px,2vw,12px)", borderRadius:"var(--r-lg)", minHeight:500 }}>
        <div style={{
          background:"white", maxWidth:794, margin:"0 auto",
          padding:"clamp(20px,5vw,80px)", minHeight:500,
          boxShadow:"0 2px 12px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.05)",
          borderRadius:2, boxSizing:"border-box" as const,
        }}>
          {/* Paper header on first page */}
          {page === 0 && (
            <>
              <h1 style={{ fontFamily:'"Times New Roman",Times,serif', fontSize:"clamp(14px,3vw,18pt)", fontWeight:700, textAlign:"center", lineHeight:1.3, marginBottom:8 }}>
                {title}
              </h1>
              <hr style={{ border:"none", borderTop:"1px solid #999", margin:"10px 0 16px" }}/>
            </>
          )}

          {/* Section content */}
          <div
            className="research-body"
            dangerouslySetInnerHTML={{ __html: toHtml(cur.body) }}
          />

          {/* Page nav at bottom */}
          <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid #e0e0e0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
              style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 12px",border:"1px solid #e0e0e0",borderRadius:6,background:"transparent",cursor:page===0?"not-allowed":"pointer",fontSize:11,color:"#666",opacity:page===0?.3:1,fontFamily:'"Times New Roman",Times,serif' }}>
              ← Previous
            </button>
            <span style={{ fontFamily:'"Times New Roman",Times,serif', fontSize:10, color:"#999" }}>
              {page+1} / {totalPages}
            </span>
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
              style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 12px",border:"1px solid #e0e0e0",borderRadius:6,background:"transparent",cursor:page===totalPages-1?"not-allowed":"pointer",fontSize:11,color:"#666",opacity:page===totalPages-1?.3:1,fontFamily:'"Times New Roman",Times,serif' }}>
              Next →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .research-body{font-family:"Times New Roman",Times,serif;font-size:clamp(11px,1.8vw,12pt);line-height:1.7;color:#000}
        .research-body h2{font-size:clamp(13px,2.5vw,14pt);font-weight:bold;margin:18px 0 8px;padding-bottom:4px;border-bottom:1.5px solid #333;page-break-after:avoid}
        .research-body h3{font-size:clamp(11px,2vw,12pt);font-weight:bold;font-style:italic;margin:14px 0 6px}
        .research-body h4{font-size:clamp(10px,1.8vw,11pt);font-weight:bold;margin:10px 0 4px}
        .research-body p{margin:0 0 10px;text-align:justify;hyphens:auto}
        .research-body strong{font-weight:bold}
        .research-body em{font-style:italic}
        .research-body table{border-collapse:collapse;width:100%;margin:14px 0;font-size:clamp(9px,1.5vw,10pt)}
        .research-body td,.research-body th{border:1px solid #bbb;padding:5px 10px}
        .research-body th{background:#f5f5f5;font-weight:bold;text-align:center}
        .research-body blockquote{border-left:3px solid #777;padding-left:14px;margin:10px 0;font-style:italic;color:#444}
        .research-body ul,.research-body ol{padding-left:24px;margin:6px 0 10px}
        .research-body li{margin:3px 0}
        .research-body a{color:#1a0dab;text-decoration:underline}
        .research-body img{max-width:100%;display:block;margin:14px auto}
        .research-body pre{background:#f8f8f8;border:1px solid #ddd;padding:10px;font-family:"Courier New",monospace;font-size:10pt;overflow-x:auto;border-radius:3px}
        .research-body hr{border:none;border-top:1px solid #ccc;margin:14px 0}
      `}</style>
    </div>
  );
}

// ── Regular article with proper HTML/Markdown rendering ───────────
function ArticleBody({ html }: { html:string }) {
  return <div className="article-render" dangerouslySetInnerHTML={{ __html: toHtml(html) }}/>;
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
    const url = `/api/articles/${id}${address ? `?reader=${address.toLowerCase()}` : ""}`;
    try { const r=await fetch(url); const d=await r.json(); if(!d.error){setArticle(d);setPaid(d.hasPaid);} } catch {}
    setLoading(false);
  }

  useEffect(()=>{ setLoading(true); loadArticle(); },[id,address]);
  useEffect(()=>{ if(!signer||!isAuth){setBalance(null);return;} getBalance(signer).then(b=>setBalance(formatUsdc(b))); },[signer,isAuth]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth||!signer) { requireAuth(()=>handlePay()); return; }
    setError(""); setPaying(true); setPayStep("Checking balance…");
    try {
      const affordable = await canAfford(signer,article.price);
      const bal = await getBalance(signer); setBalance(formatUsdc(bal));
      if (!affordable) { setError(`Insufficient USDC. Have $${formatUsdc(bal)}, need $${parseFloat(article.price).toFixed(3)}. Get test USDC at faucet.circle.com.`); setPaying(false); setPayStep(""); return; }
      const confirmed = await requestSign({ title:"Pay to Read", description:article.title.slice(0,70), to:article.authorAddress, amount:`$${parseFloat(article.price).toFixed(3)}`, token:"USDC", type:"USDC Transfer" });
      if (!confirmed) { setPaying(false); setPayStep(""); return; }
      setPayStep("Signing transaction…");
      const {txHash:hash} = await payForArticle(signer,article.id,article.authorAddress,article.price);
      setPayStep("Unlocking content…"); setTxHash(hash);
      const r = await fetch(`/api/articles/${id}/pay`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({readerAddress:address.toLowerCase(),txHash:hash,amountPaid:article.price})});
      const d = await r.json();
      if (d.content) setArticle(prev=>prev?{...prev,content:d.content}:prev);
      setPaid(true); setPayStep(""); refresh();
    } catch(e:any) { setError(e instanceof PaymentError?e.message:"Unexpected error."); setPayStep(""); }
    setPaying(false);
  }

  function share(){navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}><Navbar/>
      <div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h) + 40px) 16px"}}>
        {[80,24,24,18,18,18].map((h,i)=><div key={i} className="skeleton" style={{height:h,marginBottom:14,borderRadius:"var(--r)",width:i>2?`${70+i*5}%`:"100%"}}/>)}
      </div>
    </div>
  );

  if (!article) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}><Navbar/>
      <div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 16px",textAlign:"center"}}>
        <BookOpen size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <p style={{fontSize:16,color:"var(--text-3)",marginBottom:16}}>Article not found.</p>
        <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
      </div>
    </div>
  );

  const isPending  = article.status==="pending";
  const isAuthor   = address?.toLowerCase()===article.authorAddress?.toLowerCase();
  const unlocked   = paid||isAuthor;
  const isResearch = article.isResearch;
  const priceNum   = parseFloat(article.price);
  const fullHtml   = toHtml(article.content||"");

  // Split for paywall at ~45% of HTML length
  const splitAt   = Math.floor(fullHtml.length*0.45);
  const previewHtml = fullHtml.slice(0,splitAt);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:isResearch&&unlocked?900:820,margin:"0 auto",padding:"calc(var(--header-h) + 20px) 12px 100px"}}>

        <Link href="/explore" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-3)",textDecoration:"none",marginBottom:20}}>
          <ArrowLeft size={14}/>Explore
        </Link>

        {isPending&&<div style={{padding:"10px 14px",background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",marginBottom:16,fontSize:13,color:"#d97706"}}>⏳ Pending review — only visible to you.</div>}

        {/* Meta */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <span className="badge badge-brand">{article.category}</span>
          {isResearch&&<span className="badge badge-blue">Research Paper</span>}
          <span className="price-tag">${priceNum.toFixed(3)} USDC</span>
          <span style={{fontSize:11,color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}>
            <Clock size={10}/>{article.readTime}m <span style={{opacity:.4}}>·</span> <Users size={10}/>{article.reads} reads
          </span>
        </div>

        <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(22px,5vw,38px)",fontWeight:900,color:"var(--text)",lineHeight:1.08,letterSpacing:"-.03em",marginBottom:18}}>
          {article.title}
        </h1>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:10}}>
          <Link href={`/profile/${article.authorAddress}`} style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(article.authorAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(article.authorAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:12,fontWeight:700,color:"var(--brand)"}}>{article.authorShort}</div>
              <div style={{fontSize:11,color:"var(--text-4)"}}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </Link>
          <button onClick={share} className="btn btn-ghost btn-sm">
            {copied?<CheckCircle2 size={12} style={{color:"var(--accent)"}}/>:<Share2 size={12}/>}
            {copied?"Copied":"Share"}
          </button>
        </div>

        <hr className="divider" style={{marginBottom:24}}/>
        {article.blurb&&<blockquote style={{borderLeft:"3px solid var(--brand)",paddingLeft:16,marginBottom:24,fontStyle:"italic",fontSize:"clamp(13px,2vw,16px)",color:"var(--text-2)",lineHeight:1.75}}>{article.blurb}</blockquote>}

        {/* ── UNLOCKED ── */}
        {unlocked ? (
          <>
            {isResearch
              ? <ResearchView content={article.content||""} title={article.title}/>
              : <div className="article-render"><ArticleBody html={article.content||""}/></div>
            }
            {txHash&&(
              <div style={{marginTop:24,padding:"12px 16px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-lg)",display:"flex",alignItems:"center",gap:12}}>
                <CheckCircle2 size={16} style={{color:"var(--accent)",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:"var(--accent)",marginBottom:3}}>Payment confirmed on Arc Testnet</p>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3}}>
                    {txHash.slice(0,24)}… <ExternalLink size={9}/>
                  </a>
                </div>
              </div>
            )}
            {/* AI Assistant — visible after unlock */}
            <ArticleAI
              articleId={article.id}
              articleTitle={article.title}
              articleContent={article.content||""}
              isUnlocked={unlocked}
            />
          </>
        ) : (
          <>
            {/* Preview */}
            {isResearch ? (
              <div style={{background:"#e8eaed",padding:"16px 10px",borderRadius:"var(--r-lg)",marginBottom:0}}>
                <div style={{background:"white",maxWidth:794,margin:"0 auto",padding:"clamp(18px,5vw,72px)",boxShadow:"0 2px 10px rgba(0,0,0,.2)",borderRadius:2,fontFamily:'"Times New Roman",Times,serif',fontSize:"clamp(11px,1.8vw,12pt)",lineHeight:1.7,color:"#000"}}>
                  <h1 style={{fontSize:"clamp(14px,2.5vw,18pt)",fontWeight:700,textAlign:"center",marginBottom:8,fontFamily:"inherit"}}>{article.title}</h1>
                  <hr style={{border:"none",borderTop:"1px solid #999",margin:"10px 0 16px"}}/>
                  <div className="research-body" dangerouslySetInnerHTML={{__html:previewHtml}}/>
                  <div style={{height:70,background:"linear-gradient(transparent,white)",marginTop:-70,position:"relative"}}/>
                </div>
              </div>
            ) : (
              <div className="article-render"><ArticleBody html={previewHtml}/></div>
            )}

            {/* Paywall CTA */}
            <div style={{borderRadius:"var(--r-xl)",overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",marginTop:16}}>
              <div style={{position:"relative",maxHeight:110,overflow:"hidden"}}>
                <div style={{padding:"16px 20px 0",filter:"blur(5px)",userSelect:"none",pointerEvents:"none",fontFamily:isResearch?'"Times New Roman",Times,serif':"Georgia,serif",fontSize:isResearch?"12pt":15,lineHeight:1.8,color:isResearch?"#000":"var(--text-2)"}}>
                  <div dangerouslySetInnerHTML={{__html:fullHtml.slice(splitAt,splitAt+500)}}/>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,var(--bg-card))"}}/>
              </div>
              <div style={{padding:"clamp(20px,4vw,32px)",background:"var(--bg-card)",textAlign:"center"}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"var(--brand-muted)",border:"2px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <Lock size={22} style={{color:"var(--brand)"}}/>
                </div>
                <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",marginBottom:6,letterSpacing:"-.02em"}}>
                  {isResearch?"Read Full Paper":"Continue Reading"}
                </h3>
                <p style={{fontSize:14,color:"var(--text-3)",marginBottom:4,lineHeight:1.65}}>
                  Unlock for <strong style={{color:"var(--accent)"}}>${priceNum.toFixed(3)} USDC</strong> — paid to the writer
                </p>
                {isResearch&&<p style={{fontSize:11,color:"var(--text-4)",marginBottom:10}}>All sections · References · Print & PDF · AI Assistant</p>}
                {isAuth&&balance!==null&&(
                  <p style={{fontSize:12,color:"var(--text-4)",marginBottom:14}}>
                    Balance: <span style={{fontWeight:700,color:parseFloat(balance)>=priceNum?"var(--accent)":"#dc2626"}}>${balance} USDC</span>
                    {parseFloat(balance)<priceNum&&<> · <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--brand)",fontWeight:600}}>Get USDC ↗</a></>}
                  </p>
                )}
                {error&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:14,fontSize:12,color:"#dc2626",textAlign:"left",display:"flex",gap:7}}><AlertCircle size={13} style={{flexShrink:0,marginTop:1}}/>{error}</div>}
                <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{width:"100%",maxWidth:300,justifyContent:"center",fontWeight:800,fontSize:16,height:52}}>
                  {paying ? <><RefreshCw size={15} className="spin"/>{payStep||"Processing…"}</> : <><Lock size={15}/>Pay ${priceNum.toFixed(3)} USDC</>}
                </button>
                {!isAuth&&<p style={{fontSize:11,color:"var(--text-4)",marginTop:10}}>You'll need a wallet to pay. Create one in seconds.</p>}
              </div>
            </div>

            {/* AI teaser for locked articles */}
            <div style={{marginTop:16,padding:"12px 16px",background:"linear-gradient(135deg,var(--brand-muted),rgba(5,150,105,.05))",border:"1px solid var(--brand-border)",borderRadius:"var(--r-lg)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Bot size={16} color="white"/>
              </div>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:2}}>AI Reading Assistant included</p>
                <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.5}}>Unlock to access Summarize, Key Insights, Q&A, Critique and more AI tools.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .article-render{font-family:Georgia,serif;font-size:clamp(14px,2vw,16px);line-height:1.88;color:var(--text-2)}
        .article-render h1{font-family:Outfit,sans-serif;font-size:clamp(22px,4vw,34px);font-weight:900;color:var(--text);line-height:1.1;margin:28px 0 12px;letter-spacing:-.02em}
        .article-render h2{font-family:Outfit,sans-serif;font-size:clamp(18px,3vw,26px);font-weight:800;color:var(--text);line-height:1.2;margin:24px 0 10px;letter-spacing:-.01em}
        .article-render h3{font-family:Outfit,sans-serif;font-size:clamp(15px,2.5vw,20px);font-weight:700;color:var(--text);margin:20px 0 8px}
        .article-render h4{font-family:Outfit,sans-serif;font-size:clamp(14px,2vw,17px);font-weight:700;color:var(--text);margin:16px 0 6px}
        .article-render p{margin:0 0 18px}
        .article-render strong{font-weight:700;color:var(--text)}
        .article-render em{font-style:italic}
        .article-render blockquote{border-left:3px solid var(--brand);padding:4px 0 4px 16px;margin:20px 0;font-style:italic;color:var(--text-3);font-size:1.04em}
        .article-render pre{background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px;font-family:"JetBrains Mono",monospace;font-size:13px;overflow-x:auto;margin:16px 0}
        .article-render code{font-family:"JetBrains Mono",monospace;background:var(--bg-alt);padding:1px 5px;border-radius:3px;font-size:.88em}
        .article-render ul,.article-render ol{padding-left:24px;margin:0 0 16px}
        .article-render li{margin:6px 0;line-height:1.7}
        .article-render a{color:var(--brand);text-decoration:underline}
        .article-render img{max-width:100%;border-radius:var(--r-lg);margin:20px 0;display:block}
        .article-render hr{border:none;border-top:2px solid var(--border);margin:28px 0}
        .article-render table{border-collapse:collapse;width:100%;margin:20px 0;font-size:14px}
        .article-render td,.article-render th{border:1px solid var(--border);padding:8px 12px}
        .article-render th{background:var(--bg-alt);font-weight:700}
      `}</style>
    </div>
  );
}

function Bot({size,color,style}:{size:number;color?:string;style?:React.CSSProperties}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth={2} style={style}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM9 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>;}
function Lock({size,style}:{size:number;style?:React.CSSProperties}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={style}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;}
