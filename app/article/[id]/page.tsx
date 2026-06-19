"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Lock, Unlock, CheckCircle2, Zap, Coins, ArrowLeft,
  AlertCircle, Heart, ExternalLink, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import Reactions from "../../../components/social/Reactions";
import Comments from "../../../components/social/Comments";
import ShareButton from "../../../components/social/ShareButton";
import {
  fetchArticle, fetchFullArticle, checkReadReceipt,
  CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ABI,
  EXPLORER_URL, IS_CONFIGURED, type Article,
} from "../../../lib/chain";
import { getStatus } from "../../../lib/moderation";
import { useWallet } from "../../../lib/wallet";

// ─── Render markdown-ish content ──────────────────────────────────
function renderContent(text: string): string {
  return text.trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .split("\n\n")
    .map(p => {
      if (p.startsWith("<h") || p.startsWith("<blockquote")) return p;
      if (p.startsWith("- ") || p.startsWith("• ")) {
        const items = p.split("\n").map(l => l.replace(/^[-•]\s*/,"")).filter(Boolean);
        return `<ul>${items.map(i=>`<li>${i}</li>`).join("")}</ul>`;
      }
      return `<p>${p}</p>`;
    }).join("");
}

// ─── Half paywall — shows 50% then blurs ─────────────────────────
function HalfContent({ text }: { text: string }) {
  // Show first 50% of content
  const half = Math.floor(text.length * 0.50);
  // Find a clean paragraph break near the 50% mark
  const breakAt = text.lastIndexOf("\n\n", half) || half;
  const preview = text.slice(0, breakAt || half);

  return (
    <div style={{ position:"relative" }}>
      {/* Visible half */}
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: renderContent(preview) }}
      />
      {/* Blurred continuation (fake a few lines) */}
      <div style={{ position:"relative", marginTop:20 }}>
        <div className="article-body" style={{ filter:"blur(6px)", userSelect:"none", pointerEvents:"none", opacity:.7 }}>
          <p>The analysis reveals several critical insights that fundamentally reshape our understanding of the subject matter at hand. These findings have significant implications across multiple domains.</p>
          <p>Furthermore, the data consistently demonstrates patterns that align with our theoretical framework, providing strong evidence for the conclusions drawn throughout this piece.</p>
          <p>What emerges from this comprehensive examination is a picture far more nuanced than initially anticipated, with each layer uncovering new dimensions worth exploring.</p>
        </div>
        {/* Gradient overlay */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"100%", background:"linear-gradient(to bottom, transparent 0%, var(--bg) 60%)" }}/>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, provider, signer, connect } = useWallet();

  const [article,   setArticle]   = useState<Article | null>(null);
  const [isPaid,    setIsPaid]    = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [payStep,   setPayStep]   = useState("");
  const [payErr,    setPayErr]    = useState("");
  const [txHash,    setTxHash]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [tipAmt,    setTipAmt]    = useState(0);
  const [tipping,   setTipping]   = useState(false);
  const [tipHash,   setTipHash]   = useState("");
  const [tipErr,    setTipErr]    = useState("");
  const [modStatus, setModStatus] = useState("live");
  const confirmingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const prov = provider || undefined;

      // Check moderation (localStorage — instant)
      const localStatus = getStatus(id);
      setModStatus(localStatus);

      const meta = await fetchArticle(id, prov);
      if (cancelled) return;
      setArticle(meta);

      if (isConnected && address && meta) {
        const paid = await checkReadReceipt(address, id, prov);
        if (cancelled) return;
        setIsPaid(paid);
        if (paid) {
          const full = await fetchFullArticle(id, prov);
          if (!cancelled && full) setArticle(full);
        }
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, isConnected, address, provider]);

  async function handlePay() {
    if (!signer || !article || !IS_CONFIGURED) return;
    setPaying(true); setPayErr(""); setTxHash("");

    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const c    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // ── Step 1: approve if needed ──
      setPayStep("Checking USDC approval…");
      const allowance = await usdc.allowance(address, CONTRACT_ADDRESS);

      if (allowance < article.priceRaw) {
        setPayStep("Approve USDC in your wallet…");
        const appTx = await usdc.approve(CONTRACT_ADDRESS, article.priceRaw);
        setPayStep("Waiting for approval confirmation…");
        await appTx.wait();
      }

      // ── Step 2: submit payToRead ──
      setPayStep("Sign payment in your wallet…");
      const tx = await c.payToRead(id, ethers.ZeroAddress);
      setTxHash(tx.hash);

      // ── INSTANT UNLOCK — right after tx is submitted, don't wait for confirm ──
      setPayStep("Unlocking article…");
      const full = await fetchFullArticle(id, provider || undefined);
      if (full) setArticle(full);
      setIsPaid(true);         // show content immediately
      setPaying(false);
      setPayStep("");

      // ── Confirm in background (non-blocking) ──
      confirmingRef.current = true;
      tx.wait().catch((e: any) => {
        // Tx failed — revert optimistic unlock
        if (confirmingRef.current) {
          setIsPaid(false);
          setPayErr("Transaction failed after submission: " + (e.reason || e.message || "unknown"));
        }
      }).finally(() => { confirmingRef.current = false; });

    } catch (e: any) {
      // Parse friendly error
      const reason = e.reason || e.message || "";

      // Detect the wrong-USDC-address error
      if (reason.includes("missing revert data") || reason.includes("CALL_EXCEPTION") || reason.includes("estimateGas")) {
        setPayErr(
          "Contract configuration error: the deployed contract has the wrong USDC address. " +
          "Please redeploy Readlearc.sol with _usdc = 0x3600000000000000000000000000000000000000 " +
          "and update NEXT_PUBLIC_CONTRACT_ADDRESS in Vercel."
        );
      } else if (reason.includes("Already paid") || reason.includes("already")) {
        // Already paid on-chain — just unlock
        const full = await fetchFullArticle(id, provider || undefined).catch(()=>null);
        if (full) setArticle(full);
        setIsPaid(true);
      } else if (reason.includes("rejected") || reason.includes("denied") || reason.includes("user rejected")) {
        setPayErr("Transaction cancelled.");
      } else {
        setPayErr(reason.slice(0, 200));
      }

      setPaying(false); setPayStep("");
    }
  }

  async function handleTip() {
    if (!signer || !article || !tipAmt) return;
    setTipping(true); setTipErr(""); setTipHash("");
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const tx   = await usdc.transfer(article.authorAddress, ethers.parseUnits(tipAmt.toString(), dec));
      await tx.wait();
      setTipHash(tx.hash);
    } catch (e: any) { setTipErr(e.reason || e.message); }
    finally { setTipping(false); }
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <div style={{ width:36,height:36,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%" }} className="spin"/>
      <p style={{ color:"var(--text-3)", fontSize:14, fontWeight:500 }}>Loading from Arc blockchain…</p>
    </div>
  );

  // ── Not found ──
  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:20 }}>
      <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:800, color:"var(--text)" }}>Article not found</h2>
      <p style={{ color:"var(--text-3)", fontSize:14 }}>This article doesn't exist on the blockchain.</p>
      <Link href="/explore" className="btn btn-primary btn-sm">← Back to Explore</Link>
    </div>
  );

  // ── Removed ──
  if (modStatus === "removed") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="card" style={{ maxWidth:420, width:"100%", padding:"clamp(32px,5vw,52px) clamp(24px,4vw,40px)", textAlign:"center" }}>
        <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(220,38,38,.08)",border:"1.5px solid rgba(220,38,38,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
          <AlertCircle size={26} style={{ color:"#dc2626" }}/>
        </div>
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:10 }}>Content Removed</h2>
        <p style={{ color:"var(--text-3)", fontSize:14, lineHeight:1.65, marginBottom:24 }}>This article has been removed by platform moderators and is no longer available.</p>
        <Link href="/explore" className="btn btn-secondary">Browse other articles</Link>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"clamp(76px,12vw,96px) clamp(14px,4vw,20px) 60px" }}>

        {/* Back */}
        <motion.div initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }} style={{ marginBottom:28 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={13}/>Explore</Link>
        </motion.div>

        {/* Error */}
        {payErr && (
          <div style={{ marginBottom:20, padding:"14px 16px", background:"rgba(220,38,38,.05)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r-md)", display:"flex", gap:10 }}>
            <AlertCircle size={15} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:13, color:"#dc2626", lineHeight:1.6 }}>{payErr}</span>
          </div>
        )}

        {/* Tags */}
        <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", marginBottom:14 }}>
            <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{article.category}</span>
            <span className="price-tag">${article.price} USDC</span>
            <span style={{ fontSize:12, color:"var(--text-4)" }}>{article.readTime} min read · {article.reads} reads</span>
            {modStatus==="featured" && <span className="badge badge-star">Featured</span>}
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:.06 }}
          style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(26px,5.5vw,48px)", fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.08, color:"var(--text)", marginBottom:28 }}>
          {article.title}
        </motion.h1>

        {/* Author bar */}
        <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }}
          className="card-flat" style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, flexWrap:"wrap", gap:10, borderRadius:"var(--r-md)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",flexShrink:0 }}/>
            <div>
              <Link href={`/profile/${article.authorAddress}`} style={{ fontWeight:700, fontSize:13, color:"var(--text)", textDecoration:"none" }}>
                {article.authorShort}
              </Link>
              <div style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>
                {new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <ShareButton title={article.title}/>
            <a href={`${EXPLORER_URL}/address/${article.authorAddress}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:"var(--text-4)", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
              On-chain <ExternalLink size={10}/>
            </a>
          </div>
        </motion.div>

        {/* Blurb */}
        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.12 }}
          style={{ fontSize:"clamp(15px,2vw,17px)", color:"var(--text-2)", lineHeight:1.78, marginBottom:30, borderLeft:"3px solid var(--brand)", paddingLeft:18, fontStyle:"italic" }}>
          {article.blurb}
        </motion.p>
        <hr className="divider" style={{ marginBottom:30 }}/>

        {/* ── LOCKED: show first 50% ── */}
        {!isPaid && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.15 }}>
            {/* Half content preview */}
            {article.content && <HalfContent text={article.content}/>}

            {/* Paywall card */}
            <div style={{ height:32 }}/>
            <div className="card" style={{ padding:"clamp(28px,5vw,48px) clamp(20px,4vw,36px)", textAlign:"center", borderColor:"var(--brand-border)", boxShadow:"var(--shadow-brand)", marginTop:8 }}>
              <div style={{ width:52,height:52,borderRadius:"50%",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                <Lock size={22} style={{ color:"var(--brand)" }}/>
              </div>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,26px)", fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.02em" }}>
                Continue reading
              </h3>
              <p style={{ color:"var(--text-3)", fontSize:14, lineHeight:1.68, maxWidth:360, margin:"0 auto 24px" }}>
                You've read the first <strong style={{ color:"var(--text-2)" }}>50% free</strong>. Pay once in USDC to unlock the full article — permanently on-chain.
              </p>

              {/* Feature pills */}
              <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8, marginBottom:28 }}>
                {[
                  { icon:Zap,           label:"Instant access",    color:"var(--brand)"  },
                  { icon:CheckCircle2,   label:"85% to the writer", color:"var(--accent)" },
                  { icon:Coins,         label:"Proof on Arc",       color:"#0284c7"       },
                ].map(({icon:Icon,label,color})=>(
                  <span key={label} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
                    <Icon size={11} style={{ color }} strokeWidth={2.5}/>{label}
                  </span>
                ))}
              </div>

              {!isConnected ? (
                <button onClick={connect} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:320, justifyContent:"center", margin:"0 auto" }}>
                  Connect Wallet to Unlock
                </button>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                  <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg"
                    style={{ width:"100%", maxWidth:320, justifyContent:"center", position:"relative" }}>
                    {paying ? (
                      <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>
                      <span style={{ fontSize:13 }}>{payStep||"Processing…"}</span></>
                    ) : (
                      <><Unlock size={17}/>Pay ${article.price} USDC</>
                    )}
                  </button>

                  {/* Payment progress */}
                  {paying && (
                    <div style={{ width:"100%", maxWidth:320 }}>
                      {[
                        "Checking USDC approval…",
                        "Approve USDC in your wallet…",
                        "Waiting for approval confirmation…",
                        "Sign payment in your wallet…",
                        "Unlocking article…",
                      ].map((step,i) => {
                        const steps = ["Checking USDC approval…","Approve USDC in your wallet…","Waiting for approval confirmation…","Sign payment in your wallet…","Unlocking article…"];
                        const idx   = steps.indexOf(payStep);
                        const done  = i < idx;
                        const active = i === idx;
                        return (
                          <div key={step} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 0",opacity:done||active?1:.35 }}>
                            <div style={{ width:16,height:16,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                              border:`1.5px solid ${done?"var(--accent)":active?"var(--brand)":"var(--border)"}`,
                              background:done?"var(--accent-muted)":active?"var(--brand-muted)":"transparent" }}>
                              {done ? <CheckCircle2 size={9} style={{ color:"var(--accent)" }}/> : active ? <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--brand)" }}/> : null}
                            </div>
                            <span style={{ fontSize:11, color:active?"var(--brand)":done?"var(--accent)":"var(--text-4)", fontWeight:active?600:400 }}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {txHash && (
                    <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace",textDecoration:"none",display:"flex",alignItems:"center",gap:3 }}>
                      Tx: {txHash.slice(0,16)}… <ExternalLink size={9}/>
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── UNLOCKED ── */}
        {isPaid && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.45 }}>
            {/* Access banner */}
            <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.16)",borderRadius:"var(--r-md)",marginBottom:28 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:"rgba(5,150,105,.1)",border:"1px solid rgba(5,150,105,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <CheckCircle2 size={16} style={{ color:"var(--accent)" }}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:13,color:"var(--text)",marginBottom:1 }}>Full access unlocked</p>
                <p style={{ fontSize:10,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace" }}>
                  On-chain read receipt · Arc Testnet{txHash ? ` · Tx confirming` : " · Confirmed"}
                </p>
              </div>
              {txHash && (
                <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:10,color:"var(--brand)",textDecoration:"none",display:"flex",alignItems:"center",gap:2,flexShrink:0 }}>
                  Proof <ExternalLink size={9}/>
                </a>
              )}
            </div>

            {/* Full content */}
            <div className="article-body" style={{ marginBottom:52 }}
              dangerouslySetInnerHTML={{ __html: renderContent(article.content||"") }}
            />

            {/* Social bar */}
            <div style={{ display:"flex",flexDirection:"column",gap:24,paddingTop:28,borderTop:"1px solid var(--border)" }}>
              <Reactions articleId={id}/>
              <hr className="divider"/>

              {/* Tip */}
              <div className="card-flat" style={{ padding:"clamp(20px,4vw,28px)",textAlign:"center",borderRadius:"var(--r-xl)" }}>
                <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(16px,3vw,20px)",fontWeight:800,color:"var(--text)",marginBottom:4 }}>Support this writer</h3>
                <p style={{ color:"var(--text-3)",fontSize:12,marginBottom:16 }}>100% goes directly to {article.authorShort} — no platform cut</p>
                <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:12 }}>
                  {[0.50,1.00,2.00,5.00].map(amt=>(
                    <button key={amt} onClick={()=>setTipAmt(tipAmt===amt?0:amt)} className={`btn btn-sm ${tipAmt===amt?"btn-primary":"btn-secondary"}`}>
                      ${amt.toFixed(2)}
                    </button>
                  ))}
                </div>
                {tipErr && <div style={{ fontSize:11,color:"#dc2626",marginBottom:8 }}>{tipErr}</div>}
                {tipHash && <div style={{ fontSize:11,color:"var(--accent)",marginBottom:8,fontFamily:"JetBrains Mono,monospace" }}>Tip sent! {tipHash.slice(0,16)}…</div>}
                <button onClick={handleTip} disabled={!tipAmt||tipping||!!tipHash} className="btn btn-primary" style={{ fontWeight:700 }}>
                  {tipping ? <><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>Sending…</>
                  : tipHash ? <>Tip Sent!</>
                  : <><Heart size={14}/>Tip{tipAmt?` $${tipAmt.toFixed(2)} USDC`:""}</>}
                </button>
              </div>

              <hr className="divider"/>
              <Comments articleId={id}/>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
