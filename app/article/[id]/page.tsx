"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { Lock, Unlock, CheckCircle2, Zap, Coins, ArrowLeft, Share2, ExternalLink, Heart, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import { fetchArticle, fetchFullArticle, checkReadReceipt, CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ABI, EXPLORER_URL, IS_CONFIGURED, type Article } from "../../../lib/chain";
import { useWallet } from "../../../lib/wallet";

export default function ArticlePage() {
  const { id }  = useParams<{ id: string }>();
  const { address, isConnected, provider, signer, connect } = useWallet();

  const [article,   setArticle]   = useState<Article | null>(null);
  const [isPaid,    setIsPaid]    = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [payStep,   setPayStep]   = useState("");
  const [payErr,    setPayErr]    = useState("");
  const [txHash,    setTxHash]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [tipping,   setTipping]   = useState(false);
  const [tipAmt,    setTipAmt]    = useState(0);
  const [tipHash,   setTipHash]   = useState("");
  const [tipErr,    setTipErr]    = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const prov = provider || undefined;
        const meta = await fetchArticle(id, prov);
        setArticle(meta);
        if (isConnected && address && meta) {
          const paid = await checkReadReceipt(address, id, prov);
          setIsPaid(paid);
          if (paid) {
            const full = await fetchFullArticle(id, prov);
            if (full) setArticle(full);
          }
        }
      } finally { setLoading(false); }
    }
    load();
  }, [id, isConnected, address, provider]);

  async function handlePay() {
    if (!signer || !article || !IS_CONFIGURED) return;
    setPaying(true); setPayErr(""); setTxHash("");
    try {
      const usdc  = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const c     = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

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
    } catch (e: any) {
      setPayErr(e.reason || e.message || "Transaction failed");
    } finally { setPaying(false); setPayStep(""); }
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
      <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%" }} className="spin" />
      <p style={{ color:"var(--text-3)", fontSize:14 }}>Loading from Arc blockchain…</p>
    </div>
  );

  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:"var(--text)" }}>Article not found</h2>
      <Link href="/explore" className="btn btn-primary btn-sm">← Back to Explore</Link>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner />
      <Navbar />
      <div style={{ maxWidth:740, margin:"0 auto", padding:"76px 16px 60px" }}>

        <motion.div initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} style={{ marginBottom:28 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={14}/> Explore</Link>
        </motion.div>

        {payErr && (
          <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", display:"flex", gap:10, alignItems:"flex-start" }}>
            <AlertCircle size={15} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }} />
            <span style={{ fontSize:13, color:"#dc2626" }}>{payErr}</span>
          </div>
        )}

        <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginBottom:14 }}>
          <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{article.category}</span>
          <span className="price-tag">${article.price} USDC</span>
          <span style={{ fontSize:12, color:"var(--text-4)" }}>{article.readTime} min read · {article.reads} reads</span>
        </motion.div>

        <motion.h1 initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:.07 }} style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,5vw,44px)", fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.1, color:"var(--text)", marginBottom:24 }}>
          {article.title}
        </motion.h1>

        {/* Author row */}
        <div className="card-flat" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, borderRadius:"var(--r)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,var(--brand),var(--accent))", flexShrink:0 }} />
            <div>
              <Link href={`/profile/${article.authorAddress}`} style={{ fontWeight:700, fontSize:14, color:"var(--text)", textDecoration:"none" }}>{article.authorShort}</Link>
              <div style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <a href={`${EXPLORER_URL}/address/${article.authorAddress}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--text-4)", textDecoration:"none" }}>
              On-chain <ExternalLink size={10}/>
            </a>
            <button onClick={() => navigator.share?.({title:article.title,url:location.href}) ?? navigator.clipboard.writeText(location.href)} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-card)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
              <Share2 size={14}/>
            </button>
          </div>
        </div>

        {/* Blurb */}
        <p style={{ fontSize:"clamp(15px,2vw,18px)", color:"var(--text-2)", lineHeight:1.75, marginBottom:32, borderLeft:"3px solid var(--brand)", paddingLeft:18 }}>{article.blurb}</p>
        <hr className="divider" style={{ marginBottom:32 }} />

        {/* ── Locked ── */}
        {!isPaid ? (
          <motion.div initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ delay:.2 }}>
            {/* Preview blur */}
            <div style={{ position:"relative", borderRadius:"var(--r3)", overflow:"hidden", marginBottom:28 }}>
              <div className="blur-content" style={{ padding:"24px 20px", background:"var(--bg-alt)", fontSize:15, lineHeight:1.85, color:"var(--text-2)" }}>
                <p>The economics of internet publishing have been broken from the start. Platforms extract 70–90% of creator revenue through advertising, turning readers into products.</p>
                <p style={{ marginTop:14 }}>What you're about to read changes that equation fundamentally. Every cent goes directly to the writer, settled in under a second on Arc blockchain…</p>
              </div>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 30%,var(--bg) 100%)", display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:24 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--brand-muted)", border:"1.5px solid var(--border-brand)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Lock size={20} style={{ color:"var(--brand)" }}/>
                </div>
              </div>
            </div>

            {/* Paywall */}
            <div className="card" style={{ padding:"clamp(28px,5vw,48px) clamp(20px,4vw,36px)", textAlign:"center", borderColor:"var(--border-brand)" }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.02em" }}>Unlock Full Article</h3>
              <p style={{ color:"var(--text-3)", fontSize:14, lineHeight:1.65, maxWidth:380, margin:"0 auto 28px" }}>Pay once in USDC and own permanent on-chain read access. 85% goes directly to the writer.</p>
              <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8, marginBottom:28 }}>
                {[{icon:Zap,label:"Sub-second settlement",color:"var(--brand)"},{icon:CheckCircle2,label:"85% to writer",color:"var(--accent)"},{icon:Coins,label:"On-chain receipt",color:"#0284c7"}].map(({icon:Icon,label,color}) => (
                  <span key={label} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"6px 12px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--rfull)", fontSize:12, fontWeight:600, color:"var(--text-3)" }}>
                    <Icon size={12} style={{ color }} strokeWidth={2.5}/>{label}
                  </span>
                ))}
              </div>

              {!isConnected ? (
                <button onClick={connect} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:320, justifyContent:"center" }}>Connect Wallet to Unlock</button>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{ width:"100%", maxWidth:320, justifyContent:"center" }}>
                    {paying
                      ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%" }} className="spin" />{payStep || "Processing…"}</>
                      : <><Unlock size={17}/> Pay ${article.price} USDC</>
                    }
                  </button>
                  {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>Tx: {txHash.slice(0,14)}… <ExternalLink size={9}/></a>}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          /* ── Unlocked ── */
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.18)", borderRadius:"var(--r)", marginBottom:28 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(5,150,105,.1)", border:"1px solid rgba(5,150,105,.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <CheckCircle2 size={18} style={{ color:"#059669" }}/>
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:13, color:"var(--text)", marginBottom:1 }}>Access granted on-chain</p>
                <p style={{ fontSize:11, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace" }}>Verified Read Receipt · Arc Testnet</p>
              </div>
              {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", fontSize:11, color:"var(--brand)", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>View proof <ExternalLink size={10}/></a>}
            </div>

            {/* Content */}
            <div style={{ fontSize:"clamp(15px,1.8vw,17px)", lineHeight:1.85, color:"var(--text-2)", marginBottom:48 }}
              dangerouslySetInnerHTML={{ __html: (article.content||"").trim()
                .replace(/\*\*(.*?)\*\*/g,"<strong style='color:var(--text);font-weight:700'>$1</strong>")
                .replace(/^# (.+)$/gm,"<h2 style='font-family:Outfit,sans-serif;font-size:1.5em;font-weight:800;color:var(--text);margin:2em 0 .6em;letter-spacing:-.02em'>$1</h2>")
                .replace(/^## (.+)$/gm,"<h3 style='font-family:Outfit,sans-serif;font-size:1.2em;font-weight:700;color:var(--text);margin:1.6em 0 .5em'>$1</h3>")
                .split("\n\n").map(p => p.startsWith("<h") ? p : p.startsWith("- ") ? `<ul style='padding-left:22px;margin:14px 0'><li style='margin:6px 0'>${p.split("\n").map(l=>l.replace(/^- ?/,"")).join("</li><li style='margin:6px 0'>")}</li></ul>` : `<p style='margin-bottom:18px'>${p}</p>`).join("")
              }}
            />

            {/* Tip section */}
            <div className="card-flat" style={{ padding:"clamp(24px,4vw,36px)", textAlign:"center", borderRadius:"var(--r3)" }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,3vw,24px)", fontWeight:800, color:"var(--text)", marginBottom:6 }}>Loved this article?</h3>
              <p style={{ color:"var(--text-3)", fontSize:13, marginBottom:18 }}>100% goes directly to {article.authorShort} — no platform cut.</p>
              <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8, marginBottom:14 }}>
                {[0.50,1.00,2.00,5.00].map(amt => (
                  <button key={amt} onClick={() => setTipAmt(tipAmt===amt?0:amt)} className={`btn btn-sm ${tipAmt===amt?"btn-primary":"btn-secondary"}`}>${amt.toFixed(2)}</button>
                ))}
              </div>
              {tipErr && <div style={{ fontSize:12, color:"#dc2626", marginBottom:8 }}>{tipErr}</div>}
              {tipHash && <div style={{ fontSize:11, color:"#059669", marginBottom:8, fontFamily:"JetBrains Mono,monospace" }}>✓ Tip sent! {tipHash.slice(0,16)}…</div>}
              <button onClick={handleTip} disabled={!tipAmt||tipping||!!tipHash} className="btn btn-primary" style={{ fontWeight:700 }}>
                {tipping ? <><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</> : tipHash ? <>✓ Tip Sent!</> : <><Heart size={14}/> Tip {tipAmt?`$${tipAmt.toFixed(2)} USDC`:""}</>}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
