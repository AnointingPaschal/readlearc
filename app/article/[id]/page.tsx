"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, Users, Lock, Zap, CheckCircle2, ExternalLink,
  Share2, BookOpen, AlertCircle, RefreshCw, Printer, Download,
  FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import { useAuth, EXPLORER_URL } from "../../../lib/auth";
import { payForArticle, canAfford, formatUsdc, getBalance, PaymentError } from "../../../lib/pay";

interface Article {
  id:string; title:string; blurb:string; content:string|null; price:string;
  category:string; readTime:number; isResearch:boolean;
  authorAddress:string; authorShort:string; status:string;
  reads:number; hasPaid:boolean; timestamp:number;
}

// ── Research paper page-by-page renderer ─────────────────────────
function ResearchView({ content, title }: { content: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  // Split content into sections for page breaks
  const parser = typeof window !== "undefined" ? new DOMParser() : null;

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
<title>${title}</title>
<style>
  @page { size: A4; margin: 2.54cm; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 100%; }
  h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 12pt 0 6pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 14pt 0 6pt; border-bottom: 1px solid #666; padding-bottom: 2pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt; }
  h4 { font-size: 12pt; font-weight: bold; font-style: italic; margin: 8pt 0 4pt; }
  p  { margin: 0 0 8pt; text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
  td, th { border: 1px solid #999; padding: 4pt 8pt; font-size: 10pt; }
  th { background: #f0f0f0; font-weight: bold; }
  blockquote { border-left: 3pt solid #666; padding-left: 12pt; margin: 8pt 0; font-style: italic; }
  img { max-width: 100%; display: block; margin: 10pt auto; }
  ul, ol { padding-left: 20pt; margin: 6pt 0; }
  li { margin: 3pt 0; }
  a { color: #1a0dab; }
  .page-break { page-break-after: always; }
  @media print { body { margin: 0; } }
</style>
</head><body>
<h1>${title}</h1>
${content}
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"#f1f3f4", borderRadius:"var(--r-lg)", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <FileText size={14} style={{ color:"#5f6368" }}/>
          <span style={{ fontSize:12, fontWeight:600, color:"#5f6368" }}>Research Paper</span>
          <span style={{ fontSize:11, color:"#9aa0a6", marginLeft:4 }}>PDF Preview</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={handlePrint} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", border:"1px solid #dadce0", borderRadius:6, background:"white", cursor:"pointer", fontSize:12, fontWeight:600, color:"#3c4043" }}>
            <Printer size={12}/>Print / Save PDF
          </button>
        </div>
      </div>

      {/* A4 page preview */}
      <div style={{ background:"#e8eaed", padding:"20px 12px", borderRadius:"var(--r-lg)", minHeight:400 }}>
        <div
          style={{
            background:"white",
            maxWidth:794, // A4 width in px at 96dpi
            margin:"0 auto",
            padding:"clamp(24px,6vw,96px)", // margins scale down on mobile
            boxShadow:"0 2px 8px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.06)",
            borderRadius:2,
            minHeight:500,
            fontFamily:'"Times New Roman", Times, serif',
            fontSize:"clamp(11px,1.8vw,12pt)",
            lineHeight:1.7,
            color:"#000",
            boxSizing:"border-box" as const,
            wordBreak:"break-word" as const,
          }}
        >
          {/* Paper title */}
          <h1 style={{ fontSize:"clamp(14px,2.5vw,18pt)", fontWeight:700, textAlign:"center", marginBottom:8, fontFamily:'"Times New Roman", Times, serif', lineHeight:1.3 }}>
            {title}
          </h1>
          <hr style={{ border:"none", borderTop:"1px solid #999", margin:"12px 0 20px" }}/>

          {/* Rendered HTML content */}
          <div
            className="research-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      <style>{`
        .research-content h2 {
          font-family: "Times New Roman", Times, serif;
          font-size: clamp(13px, 2vw, 14pt);
          font-weight: bold;
          margin: 20px 0 8px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #333;
          page-break-after: avoid;
        }
        .research-content h3 {
          font-family: "Times New Roman", Times, serif;
          font-size: clamp(12px, 1.8vw, 12pt);
          font-weight: bold;
          margin: 14px 0 6px;
        }
        .research-content h4 {
          font-size: clamp(11px, 1.7vw, 11pt);
          font-weight: bold;
          font-style: italic;
          margin: 10px 0 4px;
        }
        .research-content p {
          margin: 0 0 10px;
          text-align: justify;
          hyphens: auto;
        }
        .research-content strong { font-weight: bold; }
        .research-content em { font-style: italic; }
        .research-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 14px 0;
          font-size: clamp(10px, 1.5vw, 10pt);
        }
        .research-content td, .research-content th {
          border: 1px solid #999;
          padding: 5px 10px;
        }
        .research-content th { background: #f5f5f5; font-weight: bold; text-align: center; }
        .research-content blockquote {
          border-left: 3px solid #666;
          padding-left: 14px;
          margin: 10px 0;
          font-style: italic;
          color: #444;
        }
        .research-content ul, .research-content ol {
          padding-left: 22px;
          margin: 6px 0 10px;
        }
        .research-content li { margin: 3px 0; }
        .research-content img { max-width: 100%; display: block; margin: 14px auto; }
        .research-content a { color: #1a0dab; }
        .research-content pre {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 10px;
          font-family: "Courier New", monospace;
          font-size: 10pt;
          overflow-x: auto;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// ── Regular article renderer ──────────────────────────────────────
function ArticleContent({ html }: { html: string }) {
  return (
    <div className="article-rendered" dangerouslySetInnerHTML={{ __html: html }}/>
  );
}

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

  async function loadArticle() {
    if (!id) return;
    const url = `/api/articles/${id}${address ? `?reader=${address.toLowerCase()}` : ""}`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (d.error) { setLoading(false); return; }
      setArticle(d);
      setPaid(d.hasPaid);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { setLoading(true); loadArticle(); }, [id, address]);

  useEffect(() => {
    if (!signer || !isAuth) { setBalance(null); return; }
    getBalance(signer).then(b => setBalance(formatUsdc(b)));
  }, [signer, isAuth]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth || !signer) { requireAuth(() => handlePay()); return; }
    setError(""); setPaying(true); setPayStep("Checking balance…");
    try {
      const affordable = await canAfford(signer, article.price);
      const bal = await getBalance(signer);
      setBalance(formatUsdc(bal));
      if (!affordable) {
        setError(`Insufficient USDC. You have $${formatUsdc(bal)} but need $${parseFloat(article.price).toFixed(3)}. Get test USDC from faucet.circle.com.`);
        setPaying(false); setPayStep(""); return;
      }
      const confirmed = await requestSign({
        title:"Pay to Read", description:article.title.slice(0,70),
        to:article.authorAddress, amount:`$${parseFloat(article.price).toFixed(3)}`,
        token:"USDC", type:"USDC Transfer",
      });
      if (!confirmed) { setPaying(false); setPayStep(""); return; }
      setPayStep("Signing transaction…");
      const { txHash:hash } = await payForArticle(signer, article.id, article.authorAddress, article.price);
      setPayStep("Unlocking content…");
      setTxHash(hash);
      const r = await fetch(`/api/articles/${id}/pay`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ readerAddress:address.toLowerCase(), txHash:hash, amountPaid:article.price }),
      });
      const d = await r.json();
      if (d.content) setArticle(prev => prev ? {...prev, content:d.content} : prev);
      setPaid(true); setPayStep(""); refresh();
    } catch(e:any) {
      setError(e instanceof PaymentError ? e.message : "Unexpected error. Please try again.");
      setPayStep("");
    }
    setPaying(false);
  }

  function share() { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h) + 40px) 16px"}}>
        {[80,24,24,18,18,18].map((h,i)=><div key={i} className="skeleton" style={{height:h,marginBottom:14,borderRadius:"var(--r)",width:i>2?`${70+i*5}%`:"100%"}}/>)}
      </div>
    </div>
  );

  if (!article) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:820,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 16px",textAlign:"center"}}>
        <BookOpen size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <p style={{fontSize:16,color:"var(--text-3)",marginBottom:16}}>Article not found.</p>
        <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
      </div>
    </div>
  );

  const isPending  = article.status === "pending";
  const isAuthor   = address?.toLowerCase() === article.authorAddress?.toLowerCase();
  const unlocked   = paid || isAuthor;
  const priceNum   = parseFloat(article.price);
  const isResearch = article.isResearch;

  // Split content at ~50% word count for paywall
  const fullHtml = article.content || "";
  const words    = fullHtml.replace(/<[^>]+>/g," ").split(/\s+/).filter(Boolean);
  const half     = Math.floor(words.length * 0.5);
  // For preview, strip first half of text from HTML carefully
  // Better: find the ~middle HTML position
  const plainLen = fullHtml.length;
  const previewHtml  = fullHtml.slice(0, Math.floor(plainLen * 0.45));
  const lockedHtml   = fullHtml.slice(Math.floor(plainLen * 0.45));

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth: isResearch&&unlocked ? 900 : 820, margin:"0 auto", padding:"calc(var(--header-h) + 20px) 12px 80px"}}>

        <Link href="/explore" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-3)",textDecoration:"none",marginBottom:20}}>
          <ArrowLeft size={14}/>Explore
        </Link>

        {isPending&&(
          <div style={{padding:"10px 14px",background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",marginBottom:16,fontSize:13,color:"#d97706"}}>
            ⏳ Pending review — only visible to you until approved.
          </div>
        )}

        {/* Meta badges */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <span className="badge badge-brand">{article.category}</span>
          {isResearch&&<span className="badge badge-blue">Research Paper</span>}
          <span className="price-tag">${priceNum.toFixed(3)} USDC</span>
          <span style={{fontSize:11,color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}>
            <Clock size={10}/>{article.readTime}m
            <span style={{opacity:.4}}>·</span>
            <Users size={10}/>{article.reads} reads
          </span>
        </div>

        {/* Title */}
        <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(22px,5vw,38px)",fontWeight:900,color:"var(--text)",lineHeight:1.08,letterSpacing:"-.03em",marginBottom:18}}>
          {article.title}
        </h1>

        {/* Author row */}
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

        {/* Blurb */}
        {article.blurb&&(
          <blockquote style={{borderLeft:"3px solid var(--brand)",paddingLeft:16,marginBottom:24,fontStyle:"italic",fontSize:"clamp(13px,2vw,16px)",color:"var(--text-2)",lineHeight:1.75}}>
            {article.blurb}
          </blockquote>
        )}

        {/* ── UNLOCKED ── */}
        {unlocked ? (
          <>
            {isResearch ? (
              <ResearchView content={fullHtml} title={article.title}/>
            ) : (
              <div className="article-render">
                <ArticleContent html={fullHtml}/>
              </div>
            )}

            {txHash&&(
              <div style={{marginTop:24,padding:"12px 16px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-lg)",display:"flex",alignItems:"center",gap:12}}>
                <CheckCircle2 size={16} style={{color:"var(--accent)",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:"var(--accent)",marginBottom:3}}>Payment confirmed on Arc Testnet</p>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3}}>
                    {txHash.slice(0,24)}… <ExternalLink size={9}/>
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Free preview */}
            {isResearch ? (
              <div style={{background:"#e8eaed",padding:"16px 12px",borderRadius:"var(--r-lg)",marginBottom:0}}>
                <div style={{background:"white",maxWidth:794,margin:"0 auto",padding:"clamp(20px,5vw,80px)",boxShadow:"0 2px 8px rgba(0,0,0,.2)",borderRadius:2,fontFamily:'"Times New Roman",Times,serif',fontSize:"clamp(11px,1.8vw,12pt)",lineHeight:1.7,color:"#000"}}>
                  <h1 style={{fontSize:"clamp(14px,2.5vw,18pt)",fontWeight:700,textAlign:"center",marginBottom:8,fontFamily:"inherit"}}>{article.title}</h1>
                  <hr style={{border:"none",borderTop:"1px solid #999",margin:"12px 0 16px"}}/>
                  <div className="research-content" dangerouslySetInnerHTML={{__html:previewHtml}}/>
                  <div style={{height:60,background:"linear-gradient(transparent,white)",marginTop:-60,position:"relative"}}/>
                </div>
              </div>
            ) : (
              <div className="article-render">
                <ArticleContent html={previewHtml}/>
              </div>
            )}

            {/* Paywall */}
            <div style={{borderRadius:"var(--r-xl)",overflow:"hidden",border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",marginTop:16}}>
              {/* Blurred continuation */}
              <div style={{position:"relative",maxHeight:120,overflow:"hidden"}}>
                <div style={{padding:"16px 20px 0",filter:"blur(5px)",userSelect:"none",pointerEvents:"none",fontFamily:isResearch?'"Times New Roman",Times,serif':"Georgia,serif",fontSize:isResearch?"12pt":15,lineHeight:1.8,color:isResearch?"#000":"var(--text-2)"}}>
                  <div dangerouslySetInnerHTML={{__html:lockedHtml.slice(0,400)}}/>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,var(--bg-card))"}}/>
              </div>

              {/* CTA */}
              <div style={{padding:"clamp(20px,4vw,32px)",background:"var(--bg-card)",textAlign:"center"}}>
                <Lock size={28} style={{color:"var(--brand)",marginBottom:12}}/>
                <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",marginBottom:8,letterSpacing:"-.02em"}}>
                  {isResearch ? "Read Full Paper" : "Continue Reading"}
                </h3>
                <p style={{fontSize:14,color:"var(--text-3)",marginBottom:6,lineHeight:1.65}}>
                  Unlock {isResearch?"the complete research paper":"the full article"} for{" "}
                  <strong style={{color:"var(--accent)"}}>${priceNum.toFixed(3)} USDC</strong>
                </p>
                {isResearch&&<p style={{fontSize:12,color:"var(--text-4)",marginBottom:12}}>Includes all sections, methodology, results, references · Print & save enabled after unlock</p>}
                {isAuth&&balance!==null&&(
                  <p style={{fontSize:12,color:"var(--text-4)",marginBottom:14}}>
                    Balance: <span style={{fontWeight:700,color:parseFloat(balance)>=priceNum?"var(--accent)":"#dc2626"}}>${balance} USDC</span>
                    {parseFloat(balance)<priceNum&&<> · <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--brand)",fontWeight:600}}>Get USDC ↗</a></>}
                  </p>
                )}
                {error&&(
                  <div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)",marginBottom:14,fontSize:12,color:"#dc2626",textAlign:"left",display:"flex",gap:7}}>
                    <AlertCircle size={13} style={{flexShrink:0,marginTop:1}}/>{error}
                  </div>
                )}
                <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                  style={{width:"100%",maxWidth:300,justifyContent:"center",fontWeight:800,fontSize:16,height:52}}>
                  {paying
                    ? <><RefreshCw size={15} className="spin"/>{payStep||"Processing…"}</>
                    : <><Lock size={15}/>Pay ${priceNum.toFixed(3)} USDC</>}
                </button>
                {!isAuth&&<p style={{fontSize:11,color:"var(--text-4)",marginTop:10}}>You'll be asked to create or unlock your wallet first.</p>}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        /* Regular article styles */
        .article-render { font-family: Georgia, serif; font-size: clamp(14px,2vw,16px); line-height: 1.85; color: var(--text-2); }
        .article-render h1 { font-family: Outfit, sans-serif; font-size: clamp(22px,4vw,36px); font-weight: 900; color: var(--text); line-height: 1.15; margin: 28px 0 12px; letter-spacing: -.02em; }
        .article-render h2 { font-family: Outfit, sans-serif; font-size: clamp(18px,3vw,26px); font-weight: 800; color: var(--text); line-height: 1.2; margin: 24px 0 10px; letter-spacing: -.01em; }
        .article-render h3 { font-family: Outfit, sans-serif; font-size: clamp(16px,2.5vw,20px); font-weight: 700; color: var(--text); margin: 20px 0 8px; }
        .article-render p  { margin: 0 0 18px; }
        .article-render strong { font-weight: 700; color: var(--text); }
        .article-render em  { font-style: italic; color: var(--text-2); }
        .article-render blockquote { border-left: 3px solid var(--brand); padding: 4px 0 4px 16px; margin: 20px 0; font-style: italic; color: var(--text-3); font-size: 1.05em; }
        .article-render pre { background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--r-md); padding: 14px 16px; font-family: "JetBrains Mono", monospace; font-size: 13px; overflow-x: auto; margin: 16px 0; }
        .article-render code { font-family: "JetBrains Mono", monospace; background: var(--bg-alt); padding: 1px 5px; border-radius: 3px; font-size: .9em; }
        .article-render ul, .article-render ol { padding-left: 24px; margin: 0 0 16px; }
        .article-render li { margin: 6px 0; }
        .article-render a  { color: var(--brand); text-decoration: underline; }
        .article-render img { max-width: 100%; border-radius: var(--r-lg); margin: 20px 0; display: block; }
        .article-render hr { border: none; border-top: 2px solid var(--border); margin: 28px 0; }
        .article-render table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
        .article-render td, .article-render th { border: 1px solid var(--border); padding: 8px 12px; }
        .article-render th { background: var(--bg-alt); font-weight: 700; }
      `}</style>
    </div>
  );
}
