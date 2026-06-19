"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import {
  Lock, Unlock, Zap, Clock, Users, ArrowLeft,
  Heart, Share2, CheckCircle2, Coins, AlertCircle, ExternalLink,
} from "lucide-react";
import {
  READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI, ARC_EXPLORER, getReadProvider,
} from "../../../lib/web3";
import { useWallet } from "../../../lib/web3Context";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";

export default function ArticlePage() {
  const params    = useParams();
  const articleId = params.id as string;
  const { address, isConnected, provider, signer, connect } = useWallet();

  const [article,     setArticle]     = useState<any>(null);
  const [fullContent, setFullContent] = useState("");
  const [isPaid,      setIsPaid]      = useState(false);
  const [isPaying,    setIsPaying]    = useState(false);
  const [payStep,     setPayStep]     = useState("");
  const [payErr,      setPayErr]      = useState("");
  const [payTxHash,   setPayTxHash]   = useState("");
  const [loading,     setLoading]     = useState(true);

  // Tip state
  const [tipAmount,   setTipAmount]   = useState<number | null>(null);
  const [tipping,     setTipping]     = useState(false);
  const [tipStep,     setTipStep]     = useState("");
  const [tipErr,      setTipErr]      = useState("");
  const [tipTxHash,   setTipTxHash]   = useState("");

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      try {
        if (!READLEARC_ADDRESS) return;

        const prov = provider || getReadProvider();
        const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
        const meta = await c.getArticleMetadata(articleId);

        setArticle({
          id:          meta.id.toString(),
          title:       meta.title,
          blurb:       meta.blurb,
          price:       ethers.formatUnits(meta.price, 6),
          priceRaw:    meta.price,
          category:    meta.category,
          readTime:    meta.readTime.toString(),
          timestamp:   meta.timestamp.toString(),
          reads:       meta.reads.toString(),
          publishedAt: new Date(Number(meta.timestamp) * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          author: {
            address: meta.author,
            handle:  meta.author.slice(0, 6) + "…" + meta.author.slice(-4),
          },
        });

        if (isConnected && address) {
          const paid = await c.hasReadReceipt(address, articleId);
          setIsPaid(paid);
          if (paid) {
            const full = await c.getFullArticle(articleId);
            setFullContent(full.content);
          }
        }
      } catch (err) {
        console.error("Article load:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId, isConnected, address, provider]);

  async function handlePay() {
    if (!signer || !article || !USDC_ADDRESS) return;
    setIsPaying(true);
    setPayErr("");
    try {
      const usdc      = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const contract  = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);
      const price     = article.priceRaw;

      setPayStep("Checking USDC approval…");
      const allowance = await usdc.allowance(address, READLEARC_ADDRESS);
      if (allowance < price) {
        setPayStep("Approve USDC spend in wallet…");
        const approveTx = await usdc.approve(READLEARC_ADDRESS, price);
        setPayStep("Confirming approval…");
        await approveTx.wait();
      }

      setPayStep("Sign payment in wallet…");
      const tx = await contract.payToRead(articleId, ethers.ZeroAddress);
      setPayStep("Confirming on Arc…");
      setPayTxHash(tx.hash);
      await tx.wait();

      // Load full content
      const fullTx = await contract.getFullArticle(articleId);
      setFullContent(fullTx.content);
      setIsPaid(true);
    } catch (err: any) {
      setPayErr(err.reason || err.message || "Transaction failed");
    } finally {
      setIsPaying(false);
      setPayStep("");
    }
  }

  async function handleTip() {
    if (!signer || !article || !tipAmount || !USDC_ADDRESS) return;
    setTipping(true);
    setTipErr("");
    setTipTxHash("");
    try {
      const usdc    = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec     = await usdc.decimals();
      const tipBig  = ethers.parseUnits(tipAmount.toString(), dec);

      setTipStep("Approve tip in wallet…");
      const allowance = await usdc.allowance(address, article.author.address);
      if (allowance < tipBig) {
        // Just approve and then transfer directly to the author
      }

      setTipStep("Sign tip transaction…");
      // Direct USDC transfer to author (100% to writer, no split for tips)
      const tx = await usdc.transfer(article.author.address, tipBig);
      setTipStep("Confirming on Arc…");
      await tx.wait();
      setTipTxHash(tx.hash);
      setTipStep("Sent! ✓");
    } catch (err: any) {
      setTipErr(err.reason || err.message || "Tip failed");
    } finally {
      setTipping(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ width: 34, height: 34, border: "3px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Loading from Arc blockchain…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Article not found</h2>
        <Link href="/explore" className="btn btn-primary btn-sm">← Back to Explore</Link>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .rl-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}`}</style>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "80px 16px 80px" }}>

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 28 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color: "var(--text-3)" }}>
            <ArrowLeft size={14} /> Back to Explore
          </Link>
        </motion.div>

        {/* Pay error */}
        {payErr && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "var(--radius)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: "#ef4444" }}>{payErr}</span>
          </div>
        )}

        {/* Meta */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <span className="badge badge-brand" style={{ textTransform: "capitalize" }}>{article.category}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-4)" }}>
            <Clock size={12} /> {article.readTime} min
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-4)" }}>
            <Users size={12} /> {parseInt(article.reads).toLocaleString()} reads
          </span>
          <span className="price-tag">${article.price} USDC</span>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(24px,5vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text)", marginBottom: 24 }}
        >
          {article.title}
        </motion.h1>

        {/* Author row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="card-flat"
          style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderRadius: "var(--radius)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--accent))", flexShrink: 0 }} />
            <div>
              <Link href={`/profile/${article.author.address}`} style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                {article.author.handle}
                <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />
              </Link>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{article.publishedAt}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`${ARC_EXPLORER}/address/${article.author.address}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-4)", textDecoration: "none" }}>
              On-chain <ExternalLink size={10} />
            </a>
            <button onClick={() => navigator.share?.({ title: article.title, url: window.location.href }) ?? navigator.clipboard.writeText(window.location.href)}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}
            ><Share2 size={14} /></button>
          </div>
        </motion.div>

        {/* Blurb */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ fontSize: "clamp(15px,2vw,18px)", color: "var(--text-2)", lineHeight: 1.75, marginBottom: 32, borderLeft: "3px solid var(--brand)", paddingLeft: 18 }}
        >
          {article.blurb}
        </motion.p>

        <hr className="divider" style={{ marginBottom: 32 }} />

        {/* ── Locked ─────────────────────────────────────────────── */}
        {!isPaid ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            {/* Blurred preview */}
            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 28 }}>
              <div className="paywall-blur" style={{ padding: "24px 20px", background: "var(--bg-alt)", fontSize: 15, lineHeight: 1.85, color: "var(--text-2)" }}>
                <p>The economics of the internet were always broken for creators. Advertising turned readers into products, and content into a vehicle for data extraction rather than genuine connection.</p>
                <p style={{ marginTop: 14 }}>When you pay $0.02 to read one article, something profound shifts. The writer knows their work has direct monetary value — not because a platform decided to show it…</p>
                <p style={{ marginTop: 14, opacity: 0.5 }}>Every cryptographic read receipt is permanently stored on Arc blockchain, meaning your access to this content is owned by you, not any platform…</p>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 20%, var(--bg) 100%)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--brand-muted)", border: "1.5px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={20} style={{ color: "var(--brand)" }} />
                </div>
              </div>
            </div>

            {/* Paywall card */}
            <div className="card" style={{ padding: "clamp(28px,5vw,48px) clamp(20px,5vw,36px)", textAlign: "center", borderColor: "var(--border-brand)" }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,28px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Unlock Full Article
              </h3>
              <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, maxWidth: 380, margin: "0 auto 24px" }}>
                Pay once in USDC and own permanent on-chain read access. 85% goes directly to the writer.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                {[
                  { icon: Zap,          label: "Sub-second settlement", color: "var(--brand)" },
                  { icon: CheckCircle2, label: "85% to writer",         color: "var(--accent)" },
                  { icon: Coins,        label: "On-chain read receipt", color: "#0284c7" },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                    <Icon size={12} style={{ color }} strokeWidth={2.5} /> {label}
                  </span>
                ))}
              </div>

              {!isConnected ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <button onClick={connect} className="btn btn-primary" style={{ width: "100%", maxWidth: 320, height: 52, fontSize: 15, fontWeight: 800, justifyContent: "center" }}>
                    Connect Wallet to Unlock
                  </button>
                  <p style={{ fontSize: 12, color: "var(--text-4)" }}>MetaMask or any EIP-1193 wallet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <button onClick={handlePay} disabled={isPaying} className="btn btn-primary" style={{ width: "100%", maxWidth: 320, height: 52, fontSize: 15, fontWeight: 800, justifyContent: "center" }}>
                    {isPaying
                      ? <><div className="rl-spinner" /> {payStep || "Processing…"}</>
                      : <><Unlock size={17} /> Pay ${article.price} USDC</>
                    }
                  </button>
                  {payTxHash && (
                    <a href={`${ARC_EXPLORER}/tx/${payTxHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      Tx: {payTxHash.slice(0,14)}… <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          /* ── Unlocked ─────────────────────────────────────────── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

            {/* Access badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.18)", borderRadius: "var(--radius)", marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 size={18} style={{ color: "#059669" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 1 }}>Access granted on-chain</p>
                <p style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>Verified Read Receipt · Arc Testnet</p>
              </div>
              <a href={`${ARC_EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", fontSize: 11, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                View proof <ExternalLink size={10} />
              </a>
            </div>

            {/* Full content */}
            <div style={{ fontSize: "clamp(15px,1.8vw,17px)", lineHeight: 1.85, color: "var(--text-2)", marginBottom: 48 }}
              dangerouslySetInnerHTML={{ __html:
                fullContent.trim()
                  .replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text);font-weight:700'>$1</strong>")
                  .replace(/^# (.+)$/gm, "<h2 style='font-family:Outfit,sans-serif;font-size:1.5em;font-weight:800;color:var(--text);margin:2em 0 0.6em;letter-spacing:-0.02em'>$1</h2>")
                  .replace(/^## (.+)$/gm, "<h3 style='font-family:Outfit,sans-serif;font-size:1.25em;font-weight:700;color:var(--text);margin:1.6em 0 0.5em'>$1</h3>")
                  .split("\n\n")
                  .map(p => p.startsWith("<h") ? p : p.startsWith("- ")
                    ? `<ul style='padding-left:22px;margin:14px 0'><li style='margin:6px 0'>${p.split("\n").map(l=>l.replace(/^- ?/,"")).join("</li><li style='margin:6px 0'>")}</li></ul>`
                    : `<p style='margin-bottom:18px'>${p}</p>`)
                  .join("")
              }}
            />

            {/* Tip section */}
            <div className="card-flat" style={{ padding: "clamp(24px,4vw,36px)", textAlign: "center", borderRadius: "var(--radius-xl)" }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(18px,3vw,24px)", fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Tip this writer</h3>
              <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 20 }}>
                100% goes directly to {article.author.handle} — no platform cut. Direct USDC transfer on-chain.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                {[0.50, 1.00, 2.00, 5.00].map(amt => (
                  <button key={amt} onClick={() => setTipAmount(tipAmount === amt ? null : amt)}
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", border: `1.5px solid ${tipAmount === amt ? "var(--brand)" : "var(--border)"}`, background: tipAmount === amt ? "var(--brand-muted)" : "var(--bg-card)", color: tipAmount === amt ? "var(--brand)" : "var(--text-3)", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .15s" }}>
                    ${amt.toFixed(2)}
                  </button>
                ))}
              </div>

              {tipErr && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{tipErr}</div>}
              {tipTxHash && (
                <div style={{ marginBottom: 10 }}>
                  <a href={`${ARC_EXPLORER}/tx/${tipTxHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#059669", fontFamily: "JetBrains Mono, monospace", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={12} /> Tip sent! {tipTxHash.slice(0,14)}… <ExternalLink size={10} />
                  </a>
                </div>
              )}

              <button onClick={handleTip} disabled={!tipAmount || tipping || !!tipTxHash} className="btn btn-primary" style={{ fontWeight: 700, justifyContent: "center" }}>
                {tipping
                  ? <><div className="rl-spinner" /> {tipStep}</>
                  : tipTxHash
                  ? <><CheckCircle2 size={15} /> Tip Sent!</>
                  : <><Heart size={15} /> Tip {tipAmount ? `$${tipAmount.toFixed(2)}` : ""} USDC</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
