"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { Lock, Unlock, CheckCircle2, Zap, Coins, ArrowLeft, AlertCircle, Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import Reactions from "../../../components/social/Reactions";
import Comments from "../../../components/social/Comments";
import ShareButton from "../../../components/social/ShareButton";
import { fetchArticle, fetchFullArticle, checkReadReceipt, CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ABI, EXPLORER_URL, IS_CONFIGURED, type Article } from "../../../lib/chain";
import { useWallet } from "../../../lib/wallet";

// Show first 25% of content before paywall
function QuarterContent({ text }: { text: string }) {
  const quarter = Math.floor(text.length * 0.25);
  const preview = text.slice(0, quarter);
  return (
    <div style={{ position:"relative" }}>
      <div style={{ fontSize:"clamp(15px,1.8vw,17px)", lineHeight:1.85, color:"var(--text-2)" }}
        dangerouslySetInnerHTML={{ __html: renderContent(preview) }}
      />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:180, background:"linear-gradient(to bottom, transparent, var(--bg))", display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:20 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--brand-muted)", border:"1.5px solid var(--border-brand)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
            <Lock size={18} style={{ color:"var(--brand)" }}/>
          </div>
          <p style={{ fontSize:12, color:"var(--text-4)", fontWeight:600 }}>Continue reading below</p>
        </div>
      </div>
    </div>
  );
}

function renderContent(text: string): string {
  return text.trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text);font-weight:700'>$1</strong>")
    .replace(/^# (.+)$/gm, "<h2 style='font-family:Outfit,sans-serif;font-size:1.5em;font-weight:800;color:var(--text);margin:2em 0 .6em;letter-spacing:-.02em'>$1</h2>")
    .replace(/^## (.+)$/gm, "<h3 style='font-family:Outfit,sans-serif;font-size:1.2em;font-weight:700;color:var(--text);margin:1.5em 0 .5em'>$1</h3>")
    .split("\n\n")
    .map(p => {
      if (p.startsWith("<h")) return p;
      if (p.startsWith("- ")) return `<ul style='padding-left:22px;margin:14px 0'><li style='margin:6px 0'>${p.split("\n").map(l=>l.replace(/^- ?/,"")).join("</li><li style='margin:6px 0'>")}</li></ul>`;
      return `<p style='margin-bottom:18px'>${p}</p>`;
    })
    .join("");
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, provider, signer, connect } = useWallet();

  const [article, setArticle] = useState<Article | null>(null);
  const [isPaid,  setIsPaid]  = useState(false);
  const [paying,  setPaying]  = useState(false);
  const [payStep, setPayStep] = useState("");
  const [payErr,  setPayErr]  = useState("");
  const [txHash,  setTxHash]  = useState("");
  const [loading, setLoading] = useState(true);
  const [tipAmt,  setTipAmt]  = useState(0);
  const [tipping, setTipping] = useState(false);
  const [tipHash, setTipHash] = useState("");
  const [tipErr,  setTipErr]  = useState("");
  const [modStatus, setModStatus] = useState("live");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const prov = provider || undefined;
      const [meta, modRes] = await Promise.all([
        fetchArticle(id, prov),
        fetch(`/api/moderation?id=${id}`).then(r=>r.json()).catch(()=>({ status:"live" })),
      ]);
      setArticle(meta);
      setModStatus(modRes?.status || "live");
      if (isConnected && address && meta) {
        const paid = await checkReadReceipt(address, id, prov);
        setIsPaid(paid);
        if (paid) { const full = await fetchFullArticle(id, prov); if (full) setArticle(full); }
      }
      setLoading(false);
    }
    load();
  }, [id, isConnected, address, provider]);

  async function handlePay() {
    if (!signer || !article || !IS_CONFIGURED) return;
    setPaying(true); setPayErr(""); setTxHash("");
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const c    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setPayStep("Checking USDC approval…");
      const allowance = await usdc.allowance(address, CONTRACT_ADDRESS);
      if (allowance < article.priceRaw) {
        setPayStep("Approve USDC in wallet…");
        const appTx = await usdc.approve(CONTRACT_ADDRESS, article.priceRaw);
        setPayStep("Confirming approval…");
        await appTx.wait();
      }
      setPayStep("Sign payment in wallet…");
      const tx = await c.payToRead(id, ethers.ZeroAddress);
      setPayStep("Confirming on Arc…");
      setTxHash(tx.hash);
      await tx.wait();
      const full = await fetchFullArticle(id, provider || undefined);
      if (full) setArticle(full);
      setIsPaid(true);
    } catch (e: any) { setPayErr(e.reason || e.message || "Transaction failed"); }
    finally { setPaying(false); setPayStep(""); }
  }

  async function handleTip() {
    if (!signer || !article || !tipAmt || !IS_CONFIGURED) return;
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

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%" }} className="spin"/>
      <p style={{ color:"var(--text-3)", fontSize:14 }}>Loading from Arc…</p>
    </div>
  );

  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:"var(--text)" }}>Article not found</h2>
      <Link href="/explore" className="btn btn-primary btn-sm">← Explore</Link>
    </div>
  );

  if (modStatus === "removed") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:420 }}>
        <AlertCircle size={40} style={{ color:"#dc2626", marginBottom:16 }}/>
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:8 }}>Content Removed</h2>
        <p style={{ color:"var(--text-3)", fontSize:14, marginBottom:20 }}>This article has been removed by the platform moderators.</p>
        <Link href="/explore" className="btn btn-secondary">Browse other articles</Link>
      </div>
    </div>
  );

  const CONTENT_TYPE = article.category === "Research" ? "research" : "article";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth:740, margin:"0 auto", padding:"76px 16px 60px" }}>

        <motion.div initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} style={{ marginBottom:28 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={14}/>Explore</Link>
        </motion.div>

        {payErr && <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", display:"flex", gap:10 }}>
          <AlertCircle size={14} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/><span style={{ fontSize:13, color:"#dc2626" }}>{payErr}</span></div>}

        <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", marginBottom:12 }}>
            <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{article.category}</span>
            <span className="price-tag">${article.price} USDC</span>
            {CONTENT_TYPE==="research" && <span className="badge badge-neutral">Research Paper</span>}
            <span style={{ fontSize:12, color:"var(--text-4)" }}>{article.readTime} min · {article.reads} reads</span>
            {modStatus === "featured" && <span className="badge" style={{ background:"rgba(253,186,7,.08)", color:"#d97706", border:"1px solid rgba(253,186,7,.2)" }}>⭐ Featured</span>}
          </div>

          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,5vw,44px)", fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.1, color:"var(--text)", marginBottom:22 }}>{article.title}</h1>
        </motion.div>

        {/* Author + actions */}
        <div className="card-flat" style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, borderRadius:"var(--r)", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",flexShrink:0 }}/>
            <div>
              <Link href={`/profile/${article.authorAddress}`} style={{ fontWeight:700, fontSize:13, color:"var(--text)", textDecoration:"none" }}>{article.authorShort}</Link>
              <div style={{ fontSize:10, color:"var(--text-4)" }}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <ShareButton title={article.title}/>
            <a href={`${EXPLORER_URL}/address/${article.authorAddress}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)", textDecoration:"none" }}>On-chain <ExternalLink size={10}/></a>
          </div>
        </div>

        {/* Blurb */}
        <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"var(--text-2)", lineHeight:1.75, marginBottom:28, borderLeft:"3px solid var(--brand)", paddingLeft:18 }}>{article.blurb}</p>
        <hr className="divider" style={{ marginBottom:28 }}/>

        {/* ── LOCKED — show first 25% ── */}
        {!isPaid ? (<>
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.15 }}>
            {article.content ? <QuarterContent text={article.content}/> : null}
            <div style={{ height:60 }}/>
            <div className="card" style={{ padding:"clamp(24px,5vw,44px) clamp(18px,4vw,32px)", textAlign:"center", borderColor:"var(--border-brand)", marginTop:8 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,26px)", fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.02em" }}>Keep reading for ${article.price} USDC</h3>
              <p style={{ color:"var(--text-3)", fontSize:13, lineHeight:1.65, maxWidth:340, margin:"0 auto 24px" }}>You've seen the first 25% for free. Pay once and unlock the full article permanently on-chain.</p>
              <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:7, marginBottom:24 }}>
                {[{icon:Zap,label:"Sub-second",color:"var(--brand)"},{icon:CheckCircle2,label:"85% to writer",color:"var(--accent)"},{icon:Coins,label:"Proof on-chain",color:"#0284c7"}].map(({icon:Icon,label,color})=>(
                  <span key={label} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--rfull)", fontSize:11, fontWeight:600, color:"var(--text-3)" }}>
                    <Icon size={11} style={{ color }} strokeWidth={2.5}/>{label}
                  </span>
                ))}
              </div>
              {!isConnected ? (
                <button onClick={connect} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:300, justifyContent:"center" }}>Connect Wallet to Unlock</button>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:300, justifyContent:"center" }}>
                    {paying ? <><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>{payStep||"Processing…"}</> : <><Unlock size={17}/>Pay ${article.price} USDC</>}
                  </button>
                  {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none" }}>Tx: {txHash.slice(0,16)}… <ExternalLink size={9}/></a>}
                </div>
              )}
            </div>
          </motion.div>
        </>) : (
        /* ── UNLOCKED ── */
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.16)", borderRadius:"var(--r)", marginBottom:28 }}>
              <CheckCircle2 size={16} style={{ color:"#059669", flexShrink:0 }}/>
              <div>
                <p style={{ fontWeight:700, fontSize:12, color:"var(--text)", marginBottom:1 }}>Full access — on-chain read receipt</p>
                <p style={{ fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace" }}>Arc Testnet · Permanent</p>
              </div>
              {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", fontSize:10, color:"var(--brand)", textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}>Proof <ExternalLink size={9}/></a>}
            </div>

            <div style={{ fontSize:"clamp(15px,1.8vw,17px)", lineHeight:1.85, color:"var(--text-2)", marginBottom:48 }}
              dangerouslySetInnerHTML={{ __html: renderContent(article.content||"") }}
            />

            {/* Social section */}
            <div style={{ display:"flex", flexDirection:"column", gap:24, paddingTop:28, borderTop:"1px solid var(--border)" }}>
              <Reactions articleId={id}/>
              <hr className="divider"/>

              {/* Tip section */}
              <div className="card-flat" style={{ padding:"clamp(20px,4vw,28px)", textAlign:"center", borderRadius:"var(--r3)" }}>
                <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(16px,3vw,20px)", fontWeight:800, color:"var(--text)", marginBottom:4 }}>Support the writer</h3>
                <p style={{ color:"var(--text-3)", fontSize:12, marginBottom:16 }}>100% goes directly to {article.authorShort}</p>
                <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8, marginBottom:12 }}>
                  {[0.50,1.00,2.00,5.00].map(amt=>(
                    <button key={amt} onClick={()=>setTipAmt(tipAmt===amt?0:amt)} className={`btn btn-sm ${tipAmt===amt?"btn-primary":"btn-secondary"}`}>${amt.toFixed(2)}</button>
                  ))}
                </div>
                {tipErr && <div style={{ fontSize:11, color:"#dc2626", marginBottom:7 }}>{tipErr}</div>}
                {tipHash && <div style={{ fontSize:11, color:"#059669", marginBottom:7, fontFamily:"JetBrains Mono,monospace" }}>✓ Sent! {tipHash.slice(0,16)}…</div>}
                <button onClick={handleTip} disabled={!tipAmt||tipping||!!tipHash} className="btn btn-primary" style={{ fontWeight:700 }}>
                  {tipping?<><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</>:tipHash?<>✓ Tip Sent!</>:<><Heart size={14}/>Tip{tipAmt?` $${tipAmt.toFixed(2)} USDC`:""}</>}
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
