"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import {
  Lock, Unlock, Zap, Clock, Users, ArrowLeft,
  Heart, Share2, CheckCircle2, Coins, AlertCircle
} from "lucide-react";
import { getProvider, READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI } from "../../../lib/web3";
import { motion } from "framer-motion";
import Navbar from "../../../components/ui/Navbar";

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [fullContent, setFullContent] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        if (!READLEARC_ADDRESS) return;

        let provider;
        let userAddress = "";
        if (typeof window !== "undefined" && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) userAddress = accounts[0].address;
        } else {
          provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
        }

        const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider);
        const meta = await contract.getArticleMetadata(articleId);
        setArticle({
          id: meta.id.toString(),
          title: meta.title,
          blurb: meta.blurb,
          price: ethers.formatUnits(meta.price, 6),
          category: meta.category,
          readTime: meta.readTime.toString(),
          timestamp: meta.timestamp.toString(),
          reads: meta.reads.toString(),
          author: { handle: meta.author.substring(0, 8) + "...", name: "Writer", address: meta.author },
          publishedAt: new Date(Number(meta.timestamp) * 1000).toLocaleDateString(),
        });

        if (userAddress) {
          const paid = await contract.hasReadReceipt(userAddress, articleId);
          setIsPaid(paid);
          if (paid) {
            const full = await contract.getFullArticle(articleId);
            setFullContent(full.content);
          }
        }
      } catch (err) {
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleId]);

  async function handlePay() {
    setIsPaying(true);
    setError("");
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);
      const priceInUnits = ethers.parseUnits(article.price.toString(), 6);

      setStep("Checking USDC approval…");
      const allowance = await usdc.allowance(signer.address, READLEARC_ADDRESS);
      if (allowance < priceInUnits) {
        setStep("Approving USDC…");
        const approveTx = await usdc.approve(READLEARC_ADDRESS, priceInUnits);
        await approveTx.wait();
      }

      setStep("Signing payment…");
      const tx = await contract.payToRead(articleId, ethers.ZeroAddress);
      setStep("Confirming on Arc…");
      setTxHash(tx.hash);
      await tx.wait();

      setPaymentDone(true);
      const full = await contract.getFullArticle(articleId);
      setFullContent(full.content);
      setIsPaid(true);
    } catch (err: any) {
      setError(err.reason || err.message || "Transaction failed");
    } finally {
      setIsPaying(false);
      setStep("");
    }
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>Fetching on-chain data…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────
  if (!article) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Article not found</h2>
        <Link href="/explore" className="btn btn-primary btn-sm">← Back to Explore</Link>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "96px 24px 80px" }}>

        {/* Back nav */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 32 }}>
          <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color: "var(--text-3)" }}>
            <ArrowLeft size={15} /> Back to Explore
          </Link>
        </motion.div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: "14px 18px",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius)", display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 14, color: "#ef4444" }}>{error}</span>
          </div>
        )}

        {/* Meta row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 20 }}
        >
          <span className="badge badge-brand" style={{ textTransform: "capitalize" }}>{article.category}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-4)", fontWeight: 500 }}>
            <Clock size={13} /> {article.readTime} min read
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-4)", fontWeight: 500 }}>
            <Users size={13} /> {article.reads} reads
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: 28,
          }}
        >
          {article.title}
        </motion.h1>

        {/* Author card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card-flat"
          style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, borderRadius: "var(--radius)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--brand), var(--accent))",
              flexShrink: 0,
            }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{article.author.name}</span>
                <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
              </div>
              <span style={{ fontSize: 13, color: "var(--text-4)", fontWeight: 500 }}>
                @{article.author.handle} · {article.publishedAt}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "1.5px solid var(--border)",
              background: "var(--bg-card)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)",
            }}
            title="Share"
          >
            <Share2 size={15} />
          </button>
        </motion.div>

        {/* Blurb — always visible */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "var(--text-2)",
            lineHeight: 1.75,
            marginBottom: 36,
            borderLeft: "3px solid var(--brand)",
            paddingLeft: 20,
            fontWeight: 400,
          }}
        >
          {article.blurb}
        </motion.p>

        <hr className="divider" style={{ marginBottom: 36 }} />

        {/* ── Locked state ──────────────────────────────────────── */}
        {!isPaid ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>

            {/* Blurred content preview */}
            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 32 }}>
              <div className="paywall-blur" style={{ padding: "28px 24px", background: "var(--bg-alt)", fontSize: 16, lineHeight: 1.85, color: "var(--text-2)" }}>
                <p>The internet promised to democratize publishing. Instead, it created a system where platforms extract 70–90% of creator revenue through advertising.</p>
                <p style={{ marginTop: 16 }}>When you read an article on a traditional blog, the economic relationship is inverted. You, the reader, are not the customer — you are the product.</p>
                <p style={{ marginTop: 16 }}>This makes something previously impossible, suddenly trivial: paying $0.02 to read one article, with every cent going to the writer…</p>
              </div>
              {/* Fade overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, transparent 20%, var(--bg) 100%)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                paddingBottom: 24,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "var(--brand-muted)",
                  border: "1.5px solid var(--border-brand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Lock size={22} style={{ color: "var(--brand)" }} />
                </div>
              </div>
            </div>

            {/* Paywall card */}
            <div className="card" style={{ padding: "48px 36px", textAlign: "center", borderColor: "var(--border-brand)" }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
                Unlock Full Article
              </h3>
              <p style={{ color: "var(--text-3)", fontSize: 15, lineHeight: 1.65, maxWidth: 420, margin: "0 auto 32px" }}>
                Pay once in USDC and own permanent on-chain read access. Your payment goes directly to the writer.
              </p>

              {/* Feature chips */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 32 }}>
                {[
                  { icon: Zap, label: "Sub-second settlement", color: "var(--brand)" },
                  { icon: CheckCircle2, label: "85% to writer", color: "var(--accent)" },
                  { icon: Coins, label: "On-chain proof", color: "#0284c7" },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: "var(--bg-alt)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-full)",
                    fontSize: 13, fontWeight: 600, color: "var(--text-3)",
                  }}>
                    <Icon size={13} style={{ color }} strokeWidth={2.5} />
                    {label}
                  </span>
                ))}
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={isPaying || paymentDone}
                className="btn btn-primary"
                style={{
                  width: "100%", maxWidth: 340, height: 54, fontSize: 16, fontWeight: 800,
                  margin: "0 auto", display: "flex",
                }}
              >
                {paymentDone ? (
                  <><CheckCircle2 size={18} /> Confirmed!</>
                ) : isPaying ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    {step || "Processing…"}
                  </>
                ) : (
                  <><Unlock size={18} /> Pay ${article.price} USDC</>
                )}
              </button>

              {txHash && (
                <p style={{ marginTop: 14, fontSize: 12, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
                  Tx: {txHash.slice(0, 12)}…{txHash.slice(-8)}
                </p>
              )}
            </div>
          </motion.div>

        ) : (
          /* ── Unlocked state ───────────────────────────────────── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

            {/* Access badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 20px",
              background: "rgba(5,150,105,0.07)",
              border: "1px solid rgba(5,150,105,0.2)",
              borderRadius: "var(--radius)",
              marginBottom: 32,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(5,150,105,0.12)",
                border: "1px solid rgba(5,150,105,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <CheckCircle2 size={20} style={{ color: "#059669" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>Access granted on-chain</p>
                <p style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>Verified Read Receipt · Arc Testnet</p>
              </div>
            </div>

            {/* Full article content */}
            <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--text-2)", marginBottom: 56 }}
              dangerouslySetInnerHTML={{
                __html: fullContent
                  .trim()
                  .replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text);font-weight:700'>$1</strong>")
                  .split("\n\n")
                  .map(p => p.startsWith("-")
                    ? `<ul style='padding-left:24px;margin:16px 0;'><li style='margin:6px 0'>${p.split("\n").map(l => l.replace(/^- ?/, "")).join("</li><li style='margin:6px 0'>")}</li></ul>`
                    : `<p style='margin-bottom:20px'>${p}</p>`
                  )
                  .join("")
              }}
            />

            {/* Tip section */}
            <div className="card-flat" style={{ padding: "40px 32px", textAlign: "center", borderRadius: "var(--radius-xl)" }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                Loved this article?
              </h3>
              <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 24 }}>
                100% of tips go directly to {article.author.name}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
                {[0.50, 1.00, 5.00].map(amount => (
                  <button
                    key={amount}
                    className="btn btn-secondary"
                    style={{ fontWeight: 700 }}
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
                <button className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <Heart size={15} /> Tip Writer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
