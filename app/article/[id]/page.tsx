"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Users, Lock, Zap, CheckCircle2, ExternalLink, Share2, Flame } from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import NetworkGuard from "../../../components/ui/NetworkGuard";
import SetupBanner from "../../../components/ui/SetupBanner";
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
  const { isAuth, address, signer, requireAuth, refresh } = useAuth();

  const [article, setArticle] = useState<Article|null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [paid,    setPaid]    = useState(false);
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!id) return;
    const url = `/api/articles/${id}${address ? `?reader=${address}` : ""}`;
    fetch(url).then(r => r.json()).then(d => {
      if (d.error) { setLoading(false); return; }
      setArticle(d);
      setPaid(d.hasPaid);
      setLoading(false);
    });
  }, [id, address]);

  async function handlePay() {
    if (!article) return;
    if (!isAuth || !signer) { requireAuth(); return; }

    setPaying(true); setError("");
    try {
      const price    = ethers.parseUnits(article.price, 6);
      const usdc     = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
      const writer   = article.authorAddress;

      if (CONTRACT_ADDRESS) {
        // Pay via smart contract (atomic splits)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        // First approve
        const approveTx = await usdc.approve(CONTRACT_ADDRESS, price);
        await approveTx.wait();
        // Then payToRead
        const tx = await contract.payToRead(
          parseInt(article.id), writer, price, ethers.ZeroAddress
        );
        await tx.wait();
        setTxHash(tx.hash);
        // Record in DB
        await fetch(`/api/articles/${id}/pay`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ readerAddress:address, txHash:tx.hash, amountPaid:article.price }),
        });
      } else {
        // Direct USDC transfer (no contract deployed yet)
        const tx = await usdc.transfer(writer, price);
        await tx.wait();
        setTxHash(tx.hash);
        const r = await fetch(`/api/articles/${id}/pay`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ readerAddress:address, txHash:tx.hash, amountPaid:article.price }),
        });
        const d = await r.json();
        if (d.content) setArticle(prev => prev ? { ...prev, content:d.content } : prev);
      }
      setPaid(true);
      refresh();
      // Reload to get content
      const r = await fetch(`/api/articles/${id}?reader=${address}`);
      const d = await r.json();
      if (d.content) setArticle(d);
    } catch (e:any) {
      const msg = e.message || "";
      if (msg.includes("insufficient")) setError("Insufficient USDC balance. Get test USDC from the faucet.");
      else if (msg.includes("rejected") || e.code === 4001) setError("Transaction cancelled.");
      else setError(msg.slice(0, 150));
    }
    setPaying(false);
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 40px) 16px" }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:i===1?48:24, marginBottom:16, borderRadius:"var(--r)" }}/>)}
      </div>
    </div>
  );

  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 60px) 16px", textAlign:"center" }}>
        <p style={{ fontSize:16, color:"var(--text-3)" }}>Article not found.</p>
        <Link href="/explore" className="btn btn-primary" style={{ marginTop:16, display:"inline-flex" }}>Browse Articles</Link>
      </div>
    </div>
  );

  const isPending = article.status === "pending";
  const isAuthor  = address?.toLowerCase() === article.authorAddress?.toLowerCase();
  const unlocked  = paid || isAuthor;

  // Split content at 50%
  const words     = (article.content || "").split(/\s+/).filter(Boolean);
  const halfPoint = Math.floor(words.length * 0.5);
  const freeText  = words.slice(0, halfPoint).join(" ");
  const paywalled = words.slice(halfPoint).join(" ");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"calc(var(--header-h) + 24px) 16px 80px" }}>
        {/* Back */}
        <Link href="/explore" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"var(--text-3)", textDecoration:"none", marginBottom:20 }}>
          <ArrowLeft size={14}/>Explore
        </Link>

        {/* Status banner */}
        {isPending && (
          <div style={{ padding:"10px 14px", background:"rgba(217,119,6,.08)", border:"1px solid rgba(217,119,6,.25)", borderRadius:"var(--r-md)", marginBottom:16, fontSize:13, color:"#d97706", display:"flex", gap:8 }}>
            ⏳ This article is pending admin review.
          </div>
        )}

        {/* Meta */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-brand">{article.category}</span>
          {article.isResearch && <span className="badge badge-blue">Research</span>}
          <span className="price-tag">${parseFloat(article.price).toFixed(3)} USDC</span>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)" }}>
            <Clock size={10}/>{article.readTime}m
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)" }}>
            <Users size={10}/>{article.reads} reads
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,5vw,42px)", fontWeight:900, color:"var(--text)", lineHeight:1.1, letterSpacing:"-.03em", marginBottom:20 }}>
          {article.title}
        </h1>

        {/* Author */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <Link href={`/profile/${article.authorAddress}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${parseInt(article.authorAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(article.authorAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))` }}/>
            <div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, color:"var(--brand)" }}>{article.authorShort}</div>
              <div style={{ fontSize:11, color:"var(--text-4)" }}>{new Date(article.timestamp * 1000).toLocaleDateString()}</div>
            </div>
          </Link>
          <button onClick={share} className="btn btn-ghost btn-sm">
            {copied ? <><CheckCircle2 size={12} style={{ color:"var(--accent)" }}/>Copied</> : <><Share2 size={12}/>Share</>}
          </button>
        </div>

        <hr className="divider" style={{ marginBottom:28 }}/>

        {/* Free preview */}
        {article.blurb && (
          <blockquote style={{ borderLeft:"3px solid var(--brand)", paddingLeft:16, marginBottom:24, fontStyle:"italic", fontSize:16, color:"var(--text-2)", lineHeight:1.75 }}>
            {article.blurb}
          </blockquote>
        )}

        <div className="article-body" style={{ fontSize:15, lineHeight:1.9, color:"var(--text-2)" }}>
          <p style={{ whiteSpace:"pre-wrap" }}>{freeText}</p>
        </div>

        {/* Paywall / unlocked */}
        {!unlocked ? (
          <div style={{ margin:"32px 0", borderRadius:"var(--r-xl)", overflow:"hidden", border:"1.5px solid var(--border)", boxShadow:"var(--shadow)" }}>
            {/* Blur preview */}
            <div style={{ position:"relative", maxHeight:140, overflow:"hidden" }}>
              <div className="article-body" style={{ fontSize:15, lineHeight:1.9, color:"var(--text-2)", padding:"24px 24px 0", filter:"blur(4px)", userSelect:"none" }}>
                <p>{paywalled.slice(0, 400)}…</p>
              </div>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(transparent,var(--bg-card))" }}/>
            </div>

            {/* Pay CTA */}
            <div style={{ padding:"24px", background:"var(--bg-card)", textAlign:"center" }}>
              <Lock size={28} style={{ color:"var(--brand)", marginBottom:10 }}/>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)", marginBottom:6 }}>
                Continue Reading
              </h3>
              <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:18, lineHeight:1.65 }}>
                Pay <strong style={{ color:"var(--accent)" }}>${parseFloat(article.price).toFixed(3)} USDC</strong> to unlock the full article. Payment goes directly to the writer.
              </p>

              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:16 }}>
                {[
                  { icon:Zap,          label:"Instant unlock"     },
                  { icon:CheckCircle2, label:"Paid to writer"     },
                  { icon:CheckCircle2, label:"Receipt stored"     },
                ].map(f => (
                  <span key={f.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--accent)", fontWeight:600 }}>
                    <f.icon size={11}/>{f.label}
                  </span>
                ))}
              </div>

              {error && (
                <div style={{ padding:"10px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", marginBottom:12, fontSize:12, color:"#dc2626" }}>
                  {error}
                </div>
              )}

              <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:320, justifyContent:"center", fontWeight:800, fontSize:16 }}>
                {paying
                  ? <><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%" }} className="spin"/>Signing transaction…</>
                  : <><Lock size={15}/>Pay ${parseFloat(article.price).toFixed(3)} USDC</>
                }
              </button>

              {!isAuth && (
                <p style={{ fontSize:11, color:"var(--text-4)", marginTop:10 }}>
                  You'll be asked to create or unlock your wallet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="article-body" style={{ fontSize:15, lineHeight:1.9, color:"var(--text-2)", marginTop:24 }}>
              <p style={{ whiteSpace:"pre-wrap" }}>{paywalled}</p>
            </div>
            {txHash && (
              <div style={{ marginTop:24, padding:"12px 16px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-md)", display:"flex", alignItems:"center", gap:10 }}>
                <CheckCircle2 size={15} style={{ color:"var(--accent)", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--accent)" }}>Payment confirmed on Arc!</p>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--brand)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3 }}>
                    {txHash.slice(0,20)}… <ExternalLink size={9}/>
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
