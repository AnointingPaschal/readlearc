"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Users, Lock, Zap, CheckCircle2, ExternalLink, Share2, BookOpen } from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import { useAuth, CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL } from "../../../lib/auth";
import { ethers } from "ethers";
import { USDC_ADDR, USDC_ABI } from "../../../lib/internal-wallet";

interface Article {
  id:string; title:string; blurb:string; content:string|null; price:string;
  category:string; readTime:number; isResearch:boolean;
  authorAddress:string; authorShort:string; status:string;
  reads:number; hasPaid:boolean; timestamp:number;
}

export default function ArticlePage() {
  const { id } = useParams<{ id:string }>();
  const { isAuth, address, signer, requireAuth, refresh, requestSign } = useAuth();

  const [article, setArticle] = useState<Article|null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [paid,    setPaid]    = useState(false);
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  async function loadArticle() {
    if (!id) return;
    const url = `/api/articles/${id}${address ? `?reader=${address.toLowerCase()}` : ""}`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.error) { setLoading(false); return; }
    setArticle(d); setPaid(d.hasPaid); setLoading(false);
  }

  useEffect(() => { setLoading(true); loadArticle(); }, [id, address]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth || !signer) {
      requireAuth(() => handlePay()); // re-call after auth
      return;
    }

    // Show transaction signing preview
    let writer: string;
    try {
      writer = ethers.getAddress(article.authorAddress);
    } catch {
      writer = article.authorAddress;
    }

    const confirmed = await requestSign({
      title:       "Pay to Read",
      description: article.title.slice(0, 80) + (article.title.length > 80 ? "…" : ""),
      to:          writer,
      amount:      `$${parseFloat(article.price).toFixed(3)}`,
      token:       "USDC",
      type:        "USDC Transfer",
    });
    if (!confirmed) return;

    setPaying(true); setError("");
    try {
      const price = ethers.parseUnits(article.price, 6);
      const usdc  = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);

      let txHash: string;

      if (CONTRACT_ADDRESS) {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const approveConfirmed = await requestSign({
          title:"Approve USDC", description:"Allow contract to spend USDC for this article",
          to:CONTRACT_ADDRESS, amount:`$${parseFloat(article.price).toFixed(3)}`, token:"USDC", type:"ERC-20 Approval",
        });
        if (!approveConfirmed) { setPaying(false); return; }
        const approveTx = await usdc.approve(CONTRACT_ADDRESS, price);
        await approveTx.wait();
        const tx = await contract.payToRead(parseInt(article.id), writer, price, ethers.ZeroAddress);
        await tx.wait();
        txHash = tx.hash;
      } else {
        // Direct transfer
        const tx = await usdc.transfer(writer, price);
        await tx.wait();
        txHash = tx.hash;
      }

      // Record in DB + get full content
      const r = await fetch(`/api/articles/${id}/pay`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ readerAddress:address.toLowerCase(), txHash, amountPaid:article.price }),
      });
      const d = await r.json();
      if (d.content) setArticle(prev => prev ? { ...prev, content:d.content } : prev);
      setTxHash(txHash); setPaid(true); refresh();
    } catch (e:any) {
      const msg = e.message || "";
      if (msg.includes("insufficient")) setError("Insufficient USDC. Get test USDC from faucet.circle.com → Arc Testnet.");
      else if (msg.includes("rejected") || e.code === 4001) setError("Transaction cancelled.");
      else setError(msg.slice(0, 200));
    }
    setPaying(false);
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 40px) 16px" }}>
        {[80,24,24,16].map((h,i) => <div key={i} className="skeleton" style={{ height:h, marginBottom:16, borderRadius:"var(--r)" }}/>)}
      </div>
    </div>
  );

  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 60px) 16px", textAlign:"center" }}>
        <BookOpen size={40} style={{ color:"var(--text-4)", marginBottom:14 }}/>
        <p style={{ fontSize:16, color:"var(--text-3)", marginBottom:16 }}>Article not found.</p>
        <Link href="/explore" className="btn btn-primary">Browse Articles</Link>
      </div>
    </div>
  );

  const isPending = article.status === "pending";
  const isAuthor  = address?.toLowerCase() === article.authorAddress?.toLowerCase();
  const unlocked  = paid || isAuthor;

  const words     = (article.content || "").split(/\s+/).filter(Boolean);
  const halfIdx   = Math.floor(words.length * 0.5);
  const freeText  = words.slice(0, halfIdx).join(" ");
  const lockedText= words.slice(halfIdx).join(" ");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 24px) 16px 80px" }}>

        <Link href="/explore" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"var(--text-3)", textDecoration:"none", marginBottom:20 }}>
          <ArrowLeft size={14}/>Explore
        </Link>

        {isPending && (
          <div style={{ padding:"10px 14px", background:"rgba(217,119,6,.08)", border:"1px solid rgba(217,119,6,.2)", borderRadius:"var(--r-md)", marginBottom:16, fontSize:13, color:"#d97706" }}>
            ⏳ Pending admin review. Only you can see this.
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-brand">{article.category}</span>
          {article.isResearch && <span className="badge badge-blue">Research</span>}
          <span className="price-tag">${parseFloat(article.price).toFixed(3)} USDC</span>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)" }}>
            <Clock size={10}/>{article.readTime}m · <Users size={10}/>{article.reads} reads
          </span>
        </div>

        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,5vw,42px)", fontWeight:900, color:"var(--text)", lineHeight:1.1, letterSpacing:"-.03em", marginBottom:18 }}>
          {article.title}
        </h1>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:10 }}>
          <Link href={`/profile/${article.authorAddress}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${parseInt(article.authorAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(article.authorAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))` }}/>
            <div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, color:"var(--brand)" }}>{article.authorShort}</div>
              <div style={{ fontSize:11, color:"var(--text-4)" }}>{new Date(article.timestamp*1000).toLocaleDateString()}</div>
            </div>
          </Link>
          <button onClick={share} className="btn btn-ghost btn-sm">
            {copied?<CheckCircle2 size={12} style={{ color:"var(--accent)" }}/>:<Share2 size={12}/>}
            {copied?"Copied":"Share"}
          </button>
        </div>

        <hr className="divider" style={{ marginBottom:28 }}/>

        {article.blurb && (
          <blockquote style={{ borderLeft:"3px solid var(--brand)", paddingLeft:16, marginBottom:24, fontStyle:"italic", fontSize:16, color:"var(--text-2)", lineHeight:1.75 }}>
            {article.blurb}
          </blockquote>
        )}

        <div className="article-body">
          <p style={{ whiteSpace:"pre-wrap", lineHeight:1.9, fontSize:15, color:"var(--text-2)" }}>{freeText}</p>
        </div>

        {!unlocked ? (
          <div style={{ margin:"32px 0", borderRadius:"var(--r-xl)", overflow:"hidden", border:"1.5px solid var(--border)", boxShadow:"var(--shadow)" }}>
            <div style={{ position:"relative", maxHeight:130, overflow:"hidden" }}>
              <div style={{ padding:"24px 24px 0", filter:"blur(4px)", userSelect:"none", fontSize:15, lineHeight:1.9, color:"var(--text-2)" }}>
                <p>{lockedText.slice(0, 400)}…</p>
              </div>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:70, background:"linear-gradient(transparent,var(--bg-card))" }}/>
            </div>
            <div style={{ padding:"28px 24px", background:"var(--bg-card)", textAlign:"center" }}>
              <Lock size={28} style={{ color:"var(--brand)", marginBottom:10 }}/>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)", marginBottom:6 }}>Continue Reading</h3>
              <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:18, lineHeight:1.65 }}>
                Unlock with <strong style={{ color:"var(--accent)" }}>${parseFloat(article.price).toFixed(3)} USDC</strong> — paid directly to the writer.
              </p>
              {error && <div style={{ padding:"10px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", marginBottom:14, fontSize:12, color:"#dc2626" }}>{error}</div>}
              <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:300, justifyContent:"center", fontWeight:800, fontSize:16 }}>
                {paying
                  ? <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</>
                  : <><Lock size={15}/>Pay ${parseFloat(article.price).toFixed(3)} USDC</>}
              </button>
              {!isAuth && <p style={{ fontSize:11, color:"var(--text-4)", marginTop:8 }}>You'll be asked to create or unlock your wallet first.</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="article-body" style={{ marginTop:24 }}>
              <p style={{ whiteSpace:"pre-wrap", lineHeight:1.9, fontSize:15, color:"var(--text-2)" }}>{lockedText}</p>
            </div>
            {txHash && (
              <div style={{ marginTop:24, padding:"12px 16px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-md)", display:"flex", alignItems:"center", gap:10 }}>
                <CheckCircle2 size={15} style={{ color:"var(--accent)", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--accent)" }}>Transaction confirmed on Arc!</p>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--brand)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3 }}>
                    {txHash.slice(0,24)}… <ExternalLink size={9}/>
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
