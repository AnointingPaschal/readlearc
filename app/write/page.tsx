"use client";
import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { Zap, Bold, Italic, List, Heading2, Quote, Code, Eye, Send, DollarSign, Clock, AlertCircle, CheckCircle2, ArrowLeft, Wallet, PenLine } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI } from "../../lib/web3";
import { useWallet } from "../../lib/web3Context";
import Navbar from "../../components/ui/Navbar";
import { motion } from "framer-motion";

const CATEGORIES = ["Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi", "Culture", "Opinion"];

export default function WritePage() {
  const { isConnected, signer, connect, isConnecting } = useWallet();
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState(0.02);
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "wallet" | "tx" | "mining" | "done">("idle");

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  async function handlePublish() {
    if (!title || !blurb || !body || !category || !signer) return;
    setPublishing(true);
    setError("");

    try {
      if (!READLEARC_ADDRESS) throw new Error("Contract address not configured in .env.local");

      const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);

      setStep("tx");
      const priceInUSDC = ethers.parseUnits(price.toString(), 6);
      const tx = await contract.publishArticle(title, blurb, body, priceInUSDC, category, readTime);

      setStep("mining");
      setTxHash(tx.hash);
      await tx.wait();

      setStep("done");
      setPublished(true);
    } catch (err: any) {
      setError(err.reason || err.message || "An unknown error occurred");
    } finally {
      setPublishing(false);
    }
  }

  // ── Wallet gate ───────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 24 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 440, width: "100%", padding: "52px 36px", textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
              <PenLine size={28} style={{ color: "var(--brand)" }} />
            </div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>Connect to Write</h1>
            <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
              Connect your wallet to publish articles on-chain. Your content will be stored permanently on the Arc blockchain.
            </p>
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              {isConnecting
                ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "rl-spin 0.7s linear infinite" }} /> Connecting…</>
                : <><Wallet size={17} /> Connect Wallet</>
              }
            </button>
            <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        </div>
      </div>
    );
  }

  const STEP_LABELS: Record<string, string> = {
    idle: "",
    wallet: "Awaiting wallet approval…",
    tx: "Sign transaction in wallet…",
    mining: "Confirming on-chain…",
    done: "Published! ✓",
  };

  const checklist = [
    { label: "Title added", done: title.length > 0 },
    { label: "Preview blurb", done: blurb.length > 0 },
    { label: "Article body", done: body.length > 50 },
    { label: "Category selected", done: category.length > 0 },
    { label: "Price set", done: price > 0 },
  ];
  const allDone = checklist.every(c => c.done);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .write-layout { grid-template-columns: 1fr !important; }
          .write-sidebar { order: -1; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "76px 16px 60px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" className="btn btn-ghost btn-sm">
              <ArrowLeft size={15} /> Home
            </Link>
            <span style={{ color: "var(--border-strong)" }}>›</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>New Article</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setPreview(!preview)}
              className="btn btn-ghost btn-sm"
            >
              <Eye size={15} /> {preview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || published || !allDone}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              {publishing
                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> {STEP_LABELS[step]}</>
                : published
                ? <><CheckCircle2 size={15} /> Published!</>
                : <><Send size={14} /> Publish to Chain</>
              }
            </button>
          </div>
        </div>

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

        {/* Published success */}
        {published ? (
          <div className="card" style={{ padding: "72px 32px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <CheckCircle2 size={32} style={{ color: "#059669" }} />
            </div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 36, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
              Article Published! 🎉
            </h2>
            <p style={{ color: "var(--text-3)", fontSize: 16, marginBottom: 8 }}>Your article is live on the Arc blockchain.</p>
            <p style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", marginBottom: 32 }}>
              Tx: {txHash.slice(0, 12)}…{txHash.slice(-8)}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/explore" className="btn btn-primary">Go to Explore</Link>
              <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="write-layout" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

            {/* Main editor area */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Publishing progress banner */}
              {publishing && (
                <div style={{
                  padding: "14px 18px",
                  background: "var(--brand-muted)", border: "1.5px solid var(--border-brand)",
                  borderRadius: "var(--radius)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 14, height: 14, border: "2px solid rgba(109,40,217,0.3)",
                    borderTopColor: "var(--brand)", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  <span style={{ fontSize: 14, color: "var(--brand)", fontWeight: 600 }}>{STEP_LABELS[step]}</span>
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                placeholder="Your article title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: "100%", border: "none", outline: "none",
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 900, letterSpacing: "-0.02em",
                  color: "var(--text)", background: "transparent",
                  lineHeight: 1.15,
                }}
              />

              {/* Blurb */}
              <div className="card-flat" style={{ padding: "18px 20px" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
                  Preview Blurb
                </label>
                <textarea
                  placeholder="Write a teaser that makes readers want to pay to read more…"
                  value={blurb}
                  onChange={e => setBlurb(e.target.value)}
                  maxLength={300}
                  rows={3}
                  style={{
                    width: "100%", border: "none", outline: "none",
                    background: "transparent",
                    color: "var(--text-2)", fontSize: 15, lineHeight: 1.65,
                    resize: "none", fontFamily: "Inter, sans-serif",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", marginTop: 6 }}>
                  {blurb.length}/300
                </div>
              </div>

              {/* Editor / Preview */}
              {!preview ? (
                <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                  {/* Toolbar */}
                  <div style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-alt)",
                    display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
                  }}>
                    {[
                      { icon: Bold, label: "Bold" },
                      { icon: Italic, label: "Italic" },
                      { icon: Heading2, label: "Heading" },
                      { icon: List, label: "List" },
                      { icon: Quote, label: "Quote" },
                      { icon: Code, label: "Code" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        title={label}
                        style={{
                          width: 32, height: 32, borderRadius: "var(--radius-sm)",
                          border: "none", background: "transparent",
                          color: "var(--text-3)", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </button>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>
                      <Clock size={12} /> {readTime} min · {wordCount} words
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your full article here. It will be stored entirely on-chain…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={22}
                    className="editor-area"
                    style={{ padding: "24px", fontSize: 16, lineHeight: 1.8, resize: "none", display: "block" }}
                  />
                </div>
              ) : (
                <div className="card" style={{ padding: "40px 36px" }}>
                  <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 32, fontWeight: 900, color: "var(--text)", marginBottom: 16, letterSpacing: "-0.02em" }}>
                    {title || "Your title here"}
                  </h1>
                  <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 24, borderLeft: "3px solid var(--brand)", paddingLeft: 18 }}>
                    {blurb || "Your preview blurb…"}
                  </p>
                  <hr className="divider" style={{ marginBottom: 24 }} />
                  <div style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                    {body || "Your article body…"}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Price */}
              <div className="card" style={{ padding: "22px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <DollarSign size={16} style={{ color: "#059669" }} />
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Article Price</h3>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--bg-alt)", border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 12,
                }}>
                  <span style={{ color: "var(--text-4)", fontWeight: 700, fontSize: 15 }}>$</span>
                  <input
                    type="number" min={0.01} max={1.0} step={0.01} value={price}
                    onChange={e => setPrice(parseFloat(e.target.value))}
                    style={{
                      flex: 1, border: "none", outline: "none",
                      background: "transparent",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: 28, fontWeight: 900, color: "#059669",
                    }}
                  />
                  <span style={{ color: "var(--text-4)", fontSize: 12, fontWeight: 700 }}>USDC</span>
                </div>
                <input
                  type="range" min={0.01} max={1.0} step={0.01} value={price}
                  onChange={e => setPrice(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#059669", cursor: "pointer", marginBottom: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-4)", marginBottom: 14 }}>
                  <span>$0.01</span><span>$1.00</span>
                </div>
                <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--text-3)" }}>
                  You earn: <strong style={{ color: "#059669" }}>${(price * 0.85).toFixed(3)} USDC</strong> per read
                </div>
              </div>

              {/* Category */}
              <div className="card" style={{ padding: "22px 20px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 14 }}>Category</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: "8px 10px", borderRadius: "var(--radius-sm)",
                        border: category === cat ? "1.5px solid var(--brand)" : "1.5px solid var(--border)",
                        background: category === cat ? "var(--brand-muted)" : "transparent",
                        color: category === cat ? "var(--brand)" : "var(--text-3)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="card" style={{ padding: "22px 20px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 14 }}>Publish Checklist</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {checklist.map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `1.5px solid ${item.done ? "#059669" : "var(--border-strong)"}`,
                        background: item.done ? "rgba(5,150,105,0.1)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 11, color: item.done ? "#059669" : "var(--text-4)",
                        fontWeight: 800,
                      }}>
                        {item.done ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: item.done ? "var(--text-2)" : "var(--text-4)" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .write-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
