"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, Users, Lock, Zap, CheckCircle2,
  ExternalLink, Share2, BookOpen, AlertCircle, RefreshCw,
} from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import Comments from "../../../components/social/Comments";
import Reactions from "../../../components/social/Reactions";
import FollowButton from "../../../components/social/FollowButton";
import { useAuth, EXPLORER_URL } from "../../../lib/auth";
import { payForArticle, canAfford, formatUsdc, getBalance, PaymentError } from "../../../lib/pay";
import { ethers } from "ethers";

interface Article {
  id:string; title:string; blurb:string; content:string|null; price:string;
  category:string; readTime:number; isResearch:boolean;
  authorAddress:string; authorShort:string; status:string;
  reads:number; hasPaid:boolean; timestamp:number;
}

export default function ArticlePage() {
  const { id } = useParams<{ id:string }>();
  const { isAuth, address, signer, requireAuth, refresh, requestSign } = useAuth();

  const [article,  setArticle]  = useState<Article|null>(null);
  const [loading,  setLoading]  = useState(true);
  const [paid,     setPaid]     = useState(false);
  const [paying,   setPaying]   = useState(false);
  const [payStep,  setPayStep]  = useState("");  // progress text
  const [txHash,   setTxHash]   = useState("");
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);
  const [balance,  setBalance]  = useState<string|null>(null);

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

  // Load user's USDC balance when authenticated
  useEffect(() => {
    if (!signer || !isAuth) { setBalance(null); return; }
    getBalance(signer).then(b => setBalance(formatUsdc(b)));
  }, [signer, isAuth]);

  async function handlePay() {
    if (!article) return;

    // Not signed in → open auth modal, then retry
    if (!isAuth || !signer) {
      requireAuth(() => handlePay());
      return;
    }

    setError(""); setPaying(true); setPayStep("Checking balance…");

    try {
      // Balance pre-check
      const affordable = await canAfford(signer, article.price);
      const bal = await getBalance(signer);
      setBalance(formatUsdc(bal));

      if (!affordable) {
        setError(
          `Insufficient USDC. You have $${formatUsdc(bal)} but need $${parseFloat(article.price).toFixed(3)}. ` +
          `Get test USDC from faucet.circle.com → select Arc Testnet.`
        );
        setPaying(false); setPayStep("");
        return;
      }

      // Show transaction signing preview
      const confirmed = await requestSign({
        title:       "Pay to Read",
        description: article.title.length > 70
          ? article.title.slice(0, 70) + "…"
          : article.title,
        to:          article.authorAddress,
        amount:      `$${parseFloat(article.price).toFixed(3)}`,
        token:       "USDC",
        type:        "USDC Transfer",
      });

      if (!confirmed) { setPaying(false); setPayStep(""); return; }

      setPayStep("Signing transaction…");

      // Execute payment
      const { txHash: hash } = await payForArticle(
        signer, article.id, article.authorAddress, article.price
      );

      setPayStep("Confirming on Arc…");
      setTxHash(hash);

      // Record in DB and get unlocked content
      setPayStep("Unlocking content…");
      const r = await fetch(`/api/articles/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerAddress: address.toLowerCase(),
          txHash:        hash,
          amountPaid:    article.price,
        }),
      });
      const d = await r.json();
      if (d.content) setArticle(prev => prev ? { ...prev, content: d.content } : prev);

      setPaid(true);
      setPayStep("");
      refresh(); // update navbar balance
    } catch (e: any) {
      if (e instanceof PaymentError) {
        setError(e.message);
      } else {
        setError("Unexpected error. Please try again.");
        console.error(e);
      }
      setPayStep("");
    }

    setPaying(false);
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 40px) 16px" }}>
        {[80,24,24,18,18,18].map((h,i) => (
          <div key={i} className="skeleton" style={{ height:h, marginBottom:14, borderRadius:"var(--r)", width:i>2?`${70+i*5}%`:"100%" }}/>
        ))}
      </div>
    </div>
  );

  // ── Not found ────────────────────────────────────────────────
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
  const priceNum  = parseFloat(article.price);

  // Split content at 50%
  const words      = (article.content || "").split(/\s+/).filter(Boolean);
  const half       = Math.floor(words.length * 0.5);
  const freeText   = words.slice(0, half).join(" ");
  const lockedText = words.slice(half).join(" ");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 24px) 16px 80px" }}>

        {/* Back */}
        <Link href="/explore" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"var(--text-3)", textDecoration:"none", marginBottom:20 }}>
          <ArrowLeft size={14}/>Explore
        </Link>

        {/* Pending banner */}
        {isPending && (
          <div style={{ padding:"10px 14px", background:"rgba(217,119,6,.08)", border:"1px solid rgba(217,119,6,.2)", borderRadius:"var(--r-md)", marginBottom:16, fontSize:13, color:"#d97706", display:"flex", gap:8 }}>
            ⏳ Pending review — only visible to you until approved.
          </div>
        )}

        {/* Meta */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-brand">{article.category}</span>
          {article.isResearch && <span className="badge badge-blue">Research</span>}
          <span className="price-tag">${priceNum.toFixed(3)} USDC</span>
          <span style={{ fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:4 }}>
            <Clock size={10}/>{article.readTime}m
            <span style={{ opacity:.4 }}>·</span>
            <Users size={10}/>{article.reads} reads
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,5vw,42px)", fontWeight:900, color:"var(--text)", lineHeight:1.08, letterSpacing:"-.03em", marginBottom:18 }}>
          {article.title}
        </h1>

        {/* Author + share */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:10 }}>
          <Link href={`/profile/${article.authorAddress}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${parseInt(article.authorAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(article.authorAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))`, flexShrink:0 }}/>
            <div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, color:"var(--brand)" }}>{article.authorShort}</div>
              <div style={{ fontSize:11, color:"var(--text-4)" }}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</div>
            </div>
          </Link>
          <button onClick={share} className="btn btn-ghost btn-sm">
            {copied ? <CheckCircle2 size={12} style={{ color:"var(--accent)" }}/> : <Share2 size={12}/>}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>

        <hr className="divider" style={{ marginBottom:28 }}/>

        {/* Blurb */}
        {article.blurb && (
          <blockquote style={{ borderLeft:"3px solid var(--brand)", paddingLeft:16, marginBottom:28, fontStyle:"italic", fontSize:"clamp(14px,2vw,17px)", color:"var(--text-2)", lineHeight:1.75 }}>
            {article.blurb}
          </blockquote>
        )}

        {/* Free content */}
        {freeText && (
          <div className="article-body" style={{ fontSize:15, lineHeight:1.9, color:"var(--text-2)", marginBottom:24 }}>
            <p style={{ whiteSpace:"pre-wrap" }}>{freeText}</p>
          </div>
        )}

        {/* Paywall OR unlocked content */}
        {!unlocked ? (
          <div style={{ borderRadius:"var(--r-xl)", overflow:"hidden", border:"1.5px solid var(--border)", boxShadow:"var(--shadow)" }}>
            {/* Blur preview */}
            <div style={{ position:"relative", maxHeight:140, overflow:"hidden" }}>
              <div style={{ padding:"24px 24px 0", filter:"blur(5px)", userSelect:"none", fontSize:15, lineHeight:1.9, color:"var(--text-2)", pointerEvents:"none" }}>
                <p>{lockedText.slice(0, 500)}</p>
              </div>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(transparent,var(--bg-card))" }}/>
            </div>

            {/* Payment CTA */}
            <div style={{ padding:"clamp(20px,4vw,32px)", background:"var(--bg-card)", textAlign:"center" }}>
              <Lock size={28} style={{ color:"var(--brand)", marginBottom:12 }}/>

              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:"var(--text)", marginBottom:8, letterSpacing:"-.02em" }}>
                Continue Reading
              </h3>

              <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:6, lineHeight:1.65 }}>
                Unlock the full article for{" "}
                <strong style={{ color:"var(--accent)" }}>${priceNum.toFixed(3)} USDC</strong>
                {" "}— paid directly to the writer.
              </p>

              {/* User balance (if signed in) */}
              {isAuth && balance !== null && (
                <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:16 }}>
                  Your balance: <span style={{ fontWeight:700, color:parseFloat(balance)>=priceNum?"var(--accent)":"#dc2626" }}>${balance} USDC</span>
                  {parseFloat(balance) < priceNum && (
                    <> · <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)", fontWeight:600 }}>Get test USDC ↗</a></>
                  )}
                </p>
              )}

              {/* Feature list */}
              <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap", marginBottom:20 }}>
                {[
                  { icon:Zap,          label:"Instant access"      },
                  { icon:CheckCircle2, label:"Writer gets 85%"     },
                  { icon:CheckCircle2, label:"Proof on Arc chain"  },
                ].map(f => (
                  <span key={f.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--accent)", fontWeight:600 }}>
                    <f.icon size={11}/>{f.label}
                  </span>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding:"11px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.2)", borderRadius:"var(--r-md)", marginBottom:14, fontSize:12, color:"#dc2626", textAlign:"left", display:"flex", gap:8 }}>
                  <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>
                  <span style={{ lineHeight:1.6 }}>{error}</span>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={paying}
                className="btn btn-primary btn-lg"
                style={{ width:"100%", maxWidth:320, justifyContent:"center", fontWeight:800, fontSize:16, height:54 }}
              >
                {paying ? (
                  <>
                    <RefreshCw size={15} className="spin"/>
                    {payStep || "Processing…"}
                  </>
                ) : (
                  <>
                    <Lock size={15}/>
                    Pay ${priceNum.toFixed(3)} USDC
                  </>
                )}
              </button>

              {!isAuth && (
                <p style={{ fontSize:11, color:"var(--text-4)", marginTop:10 }}>
                  You'll be asked to create or unlock your wallet first.
                </p>
              )}
            </div>
          </div>

        ) : (
          <>
            {/* Unlocked content */}
            <div className="article-body" style={{ fontSize:15, lineHeight:1.9, color:"var(--text-2)" }}>
              <p style={{ whiteSpace:"pre-wrap" }}>{lockedText}</p>
            </div>

            {/* Tx confirmation */}
            {txHash && (
              <div style={{ marginTop:28, padding:"14px 16px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-lg)", display:"flex", alignItems:"center", gap:12 }}>
                <CheckCircle2 size={18} style={{ color:"var(--accent)", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"var(--accent)", marginBottom:3 }}>Payment confirmed on Arc Testnet</p>
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--brand)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3 }}
                  >
                    {txHash.slice(0,24)}… <ExternalLink size={9}/>
                  </a>
                </div>
              </div>
            )}

            {/* Bottom nav */}
            <div style={{ marginTop:36, paddingTop:24, borderTop:"1px solid var(--border)", display:"flex", gap:10, flexWrap:"wrap" }}>
              <Link href="/explore" className="btn btn-secondary btn-sm">Browse More</Link>
              <Link href={`/profile/${article.authorAddress}`} className="btn btn-ghost btn-sm">View Author</Link>
            </div>
          {/* ── Social section ── */}
          <div style={{ marginTop:48 }}>
            <Reactions articleId={article.id}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 0", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", margin:"24px 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${parseInt(article.authorAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(article.authorAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))`, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", fontFamily:"Outfit,sans-serif" }}>{article.authorShort}</div>
                  <div style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>Article author</div>
                </div>
              </div>
              {!isAuthor && <FollowButton targetAddress={article.authorAddress}/>}
            </div>
            <Comments articleId={article.id}/>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
