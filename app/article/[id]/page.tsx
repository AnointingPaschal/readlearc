"use client";
import { useState, useEffect, useRef } from "react";
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
import { USDC_ADDRESS, USDC_ABI, EXPLORER_URL, type DBArticle, dbFetchArticle, dbRecordPayment } from "../../../lib/chain";
import { useWallet } from "../../../lib/wallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";

function renderContent(text: string): string {
  return text.trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^# (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^> (.+)$/gm,  "<blockquote>$1</blockquote>")
    .split("\n\n").map(p => {
      if (p.startsWith("<h") || p.startsWith("<blockquote")) return p;
      if (p.startsWith("- ") || p.startsWith("• ")) {
        const items = p.split("\n").map(l => l.replace(/^[-•]\s*/, "")).filter(Boolean);
        return `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
      }
      return `<p>${p}</p>`;
    }).join("");
}

function HalfContent({ text }: { text: string }) {
  const half    = Math.floor(text.length * 0.50);
  const breakAt = text.lastIndexOf("\n\n", half) || half;
  const preview = text.slice(0, breakAt || half);
  return (
    <div style={{ position: "relative" }}>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: renderContent(preview) }}/>
      <div style={{ position: "relative", marginTop: 20 }}>
        <div className="article-body" style={{ filter:"blur(5px)", userSelect:"none", pointerEvents:"none", opacity:.6 }}>
          <p>The analysis reveals several critical insights that reshape our understanding. These findings carry significant implications across multiple dimensions worth exploring.</p>
          <p>Furthermore, the evidence consistently demonstrates compelling patterns that align with the theoretical framework, providing strong support for the key conclusions throughout.</p>
        </div>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"100%", background:"linear-gradient(to bottom, transparent 0%, var(--bg) 65%)" }}/>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, signer } = useWallet();
  const { openConnectModal } = useConnectModal();

  const [article, setArticle] = useState<DBArticle | null>(null);
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
  const bgRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const a = await dbFetchArticle(id, address || undefined);
      if (cancelled) return;
      setArticle(a);
      if (a) {
        // hasPaid comes from the DB (server checked read_receipts)
        const paid = a.hasPaid || (!!a.content && a.authorAddress?.toLowerCase() === address?.toLowerCase());
        setIsPaid(paid);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, address]);

  async function handlePay() {
    if (!article) return;
    if (!isConnected || !signer) { openConnectModal?.(); return; }
    if (!USDC_ADDRESS) { setPayErr("USDC address not configured."); return; }
    setPaying(true); setPayErr(""); setTxHash("");
    try {
      const usdc       = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec        = await usdc.decimals();
      const priceUnits = ethers.parseUnits(parseFloat(article.price).toFixed(Number(dec)), dec);

      setPayStep("Sign USDC transfer in wallet…");
      const tx = await usdc.transfer(article.authorAddress, priceUnits);
      setTxHash(tx.hash);

      setPayStep("Recording in database…");
      const result = await dbRecordPayment(id, address, tx.hash, article.price);
      if (result.content) {
        setArticle(prev => prev ? { ...prev, content: result.content } : prev);
        setIsPaid(true);
      }
      setPaying(false); setPayStep("");

      bgRef.current = true;
      tx.wait().catch((e: any) => {
        if (bgRef.current) setPayErr("Tx may have failed: " + (e.reason || e.message));
      }).finally(() => { bgRef.current = false; });
    } catch (e: any) {
      const msg = e.reason || e.message || "";
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("user rejected"))
        setPayErr("Transaction cancelled.");
      else
        setPayErr(msg.slice(0, 200));
      setPaying(false); setPayStep("");
    }
  }

  async function handleTip() {
    if (!signer || !article || !tipAmt || !USDC_ADDRESS) return;
    setTipping(true); setTipErr(""); setTipHash("");
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const tx   = await usdc.transfer(article.authorAddress, ethers.parseUnits(tipAmt.toString(), Number(dec)));
      await tx.wait();
      setTipHash(tx.hash);
    } catch (e: any) { setTipErr(e.reason || e.message); }
    finally { setTipping(false); }
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <div style={{ width:36,height:36,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%" }} className="spin"/>
      <p style={{ color:"var(--text-3)", fontSize:14 }}>Loading…</p>
    </div>
  );

  if (!article) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:20 }}>
      <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:800, color:"var(--text)" }}>Article not found</h2>
      <Link href="/explore" className="btn btn-primary btn-sm">← Explore</Link>
    </div>
  );

  // Hidden articles (rejected by admin, or still pending)
  if (article.status === "rejected" || article.status === "pending") {
    const isPendingAndOwn = article.status === "pending" && address?.toLowerCase() === article.authorAddress?.toLowerCase();
    if (!isPendingAndOwn) return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div className="card" style={{ maxWidth:420, width:"100%", padding:"clamp(32px,5vw,52px)", textAlign:"center" }}>
          <AlertCircle size={36} style={{ color:"#dc2626", marginBottom:16 }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>
            {article.status === "pending" ? "Awaiting Approval" : "Content Unavailable"}
          </h2>
          <p style={{ color:"var(--text-3)", fontSize:14, marginBottom:20 }}>
            {article.status === "pending" ? "This article is under review and will appear once approved." : "This article has been removed by moderators."}
          </p>
          <Link href="/explore" className="btn btn-secondary">Browse articles</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"calc(var(--header-h) + 32px) 14px 60px" }}>

        <div style={{ marginBottom:24 }}><Link href="/explore" className="btn btn-ghost btn-sm"><ArrowLeft size={13}/>Explore</Link></div>

        {payErr && (
          <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(220,38,38,.05)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r-md)", display:"flex", gap:9 }}>
            <AlertCircle size={14} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:13, color:"#dc2626" }}>{payErr}</span>
          </div>
        )}

        {/* Pending banner for author */}
        {article.status === "pending" && (
          <div style={{ marginBottom:16, padding:"10px 14px", background:"rgba(217,119,6,.06)", border:"1px solid rgba(217,119,6,.2)", borderRadius:"var(--r-md)", fontSize:13, color:"#d97706", fontWeight:600 }}>
            Your article is pending admin approval — only you can see this preview.
          </div>
        )}

        <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", marginBottom:14 }}>
          <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{article.category}</span>
          <span className="price-tag">${parseFloat(article.price).toFixed(3)} USDC</span>
          {article.isResearch && <span className="badge badge-blue">Research</span>}
          {article.featured   && <span className="badge badge-star">Featured</span>}
          <span style={{ fontSize:12, color:"var(--text-4)" }}>{article.readTime}m · {article.reads} reads</span>
        </div>

        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(26px,5.5vw,48px)", fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.08, color:"var(--text)", marginBottom:26 }}>{article.title}</h1>

        <div className="card-flat" style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:10, borderRadius:"var(--r-md)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",flexShrink:0 }}/>
            <div>
              <Link href={`/profile/${article.authorAddress}`} style={{ fontWeight:700, fontSize:13, color:"var(--text)", textDecoration:"none" }}>{article.authorShort}</Link>
              <div style={{ fontSize:10, color:"var(--text-4)", marginTop:1 }}>{new Date(article.timestamp*1000).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <ShareButton title={article.title}/>
        </div>

        <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"var(--text-2)", lineHeight:1.78, marginBottom:28, borderLeft:"3px solid var(--brand)", paddingLeft:18, fontStyle:"italic" }}>{article.blurb}</p>
        <hr className="divider" style={{ marginBottom:28 }}/>

        {/* ── LOCKED ── */}
        {!isPaid && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.12 }}>
            {article.content && <HalfContent text={article.content}/>}
            <div style={{ height:28 }}/>
            <div className="card" style={{ padding:"clamp(28px,5vw,48px) clamp(18px,4vw,32px)", textAlign:"center", borderColor:"var(--brand-border)", boxShadow:"var(--shadow-brand)" }}>
              <div style={{ width:52,height:52,borderRadius:"50%",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                <Lock size={22} style={{ color:"var(--brand)" }}/>
              </div>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(18px,4vw,26px)",fontWeight:900,color:"var(--text)",marginBottom:10,letterSpacing:"-0.02em" }}>Keep reading</h3>
              <p style={{ color:"var(--text-3)",fontSize:14,lineHeight:1.68,maxWidth:360,margin:"0 auto 24px" }}>
                You've read the first <strong style={{ color:"var(--text-2)" }}>50% free</strong>. Pay once in USDC — goes directly to the writer.
              </p>
              <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:7,marginBottom:24 }}>
                {[{icon:Zap,label:"Instant unlock",color:"var(--brand)"},{icon:CheckCircle2,label:"Paid to writer",color:"var(--accent)"},{icon:Coins,label:"Receipt stored",color:"#0284c7"}].map(({icon:Icon,label,color})=>(
                  <span key={label} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
                    <Icon size={11} style={{ color }} strokeWidth={2.5}/>{label}
                  </span>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-lg" style={{ width:"100%",maxWidth:300,justifyContent:"center" }}>
                  {paying
                    ? <><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>{payStep||"Processing…"}</>
                    : <><Unlock size={17}/>Pay ${parseFloat(article.price).toFixed(3)} USDC</>}
                </button>
                {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"var(--text-4)",fontFamily:"JetBrains Mono,monospace",textDecoration:"none",display:"flex",alignItems:"center",gap:3 }}>Tx: {txHash.slice(0,16)}… <ExternalLink size={9}/></a>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── UNLOCKED ── */}
        {isPaid && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.4 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 15px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.16)",borderRadius:"var(--r-md)",marginBottom:28 }}>
              <CheckCircle2 size={16} style={{ color:"var(--accent)",flexShrink:0 }}/>
              <div>
                <p style={{ fontWeight:700,fontSize:12,color:"var(--text)" }}>Full access unlocked</p>
                <p style={{ fontSize:10,color:"var(--text-4)" }}>Receipt stored in database · permanent access</p>
              </div>
              {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto",fontSize:10,color:"var(--brand)",textDecoration:"none",display:"flex",alignItems:"center",gap:2 }}>Proof <ExternalLink size={9}/></a>}
            </div>

            <div className="article-body" style={{ marginBottom:48 }}
              dangerouslySetInnerHTML={{ __html: renderContent(article.content||"") }}/>

            <div style={{ display:"flex",flexDirection:"column",gap:24,paddingTop:28,borderTop:"1px solid var(--border)" }}>
              <Reactions articleId={id}/>
              <hr className="divider"/>
              <div className="card-flat" style={{ padding:"clamp(20px,4vw,28px)",textAlign:"center",borderRadius:"var(--r-xl)" }}>
                <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(16px,3vw,20px)",fontWeight:800,color:"var(--text)",marginBottom:4 }}>Support this writer</h3>
                <p style={{ color:"var(--text-3)",fontSize:12,marginBottom:16 }}>100% goes directly to {article.authorShort}</p>
                <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginBottom:12 }}>
                  {[0.50,1.00,2.00,5.00].map(amt=>(
                    <button key={amt} onClick={()=>setTipAmt(tipAmt===amt?0:amt)} className={`btn btn-sm ${tipAmt===amt?"btn-primary":"btn-secondary"}`}>${amt.toFixed(2)}</button>
                  ))}
                </div>
                {tipErr  && <div style={{ fontSize:11,color:"#dc2626",marginBottom:8 }}>{tipErr}</div>}
                {tipHash && <div style={{ fontSize:11,color:"var(--accent)",marginBottom:8,fontFamily:"JetBrains Mono,monospace" }}>Tip sent! {tipHash.slice(0,16)}…</div>}
                <button onClick={handleTip} disabled={!tipAmt||tipping||!!tipHash} className="btn btn-primary" style={{ fontWeight:700 }}>
                  {tipping?<><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>Sending…</>:tipHash?"Tip Sent!":<><Heart size={14}/>Tip{tipAmt?` $${tipAmt.toFixed(2)} USDC`:""}</>}
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
