"use client";
import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Bold, Italic, List, Heading2, Quote, Code,
  Eye, Send, DollarSign, Clock, AlertCircle, CheckCircle2,
  ArrowLeft, Wallet, PenLine, ChevronDown, ChevronUp,
} from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI } from "../../lib/web3";
import { useWallet } from "../../lib/web3Context";
import Navbar from "../../components/ui/Navbar";
import { motion } from "framer-motion";

const CATEGORIES = ["Web3", "Development", "Blockchain", "Economics", "Research", "Guide", "AI", "DeFi", "Culture", "Opinion"];

export default function WritePage() {
  const { isConnected, signer, connect, isConnecting } = useWallet();
  const [title, setTitle]       = useState("");
  const [blurb, setBlurb]       = useState("");
  const [body, setBody]         = useState("");
  const [price, setPrice]       = useState(0.02);
  const [category, setCategory] = useState("");
  const [preview, setPreview]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished]   = useState(false);
  const [txHash, setTxHash]         = useState("");
  const [error, setError]           = useState("");
  const [step, setStep] = useState<"idle" | "wallet" | "tx" | "mining" | "done">("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  async function handlePublish() {
    if (!title || !blurb || !body || !category || !signer) return;
    setPublishing(true);
    setError("");
    try {
      if (!READLEARC_ADDRESS) throw new Error("Contract address not configured in .env.local");
      const contract  = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);
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

  // ── Wallet gate ───────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 68px)", padding: "24px 16px" }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card"
            style={{ maxWidth: 420, width: "100%", padding: "clamp(28px,5vw,52px) clamp(20px,5vw,36px)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <PenLine size={26} style={{ color: "var(--brand)" }} />
            </div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(20px,4vw,24px)", fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
              Connect to Write
            </h1>
            <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
              Connect your wallet to publish articles on-chain. Your content will be stored permanently on the Arc blockchain.
            </p>
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
              {isConnecting
                ? <><div className="rl-spinner" /> Connecting…</>
                : <><Wallet size={17} /> Connect Wallet</>
              }
            </button>
          </motion.div>
        </div>
        <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}} .rl-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}`}</style>
      </div>
    );
  }

  const STEP_LABELS: Record<string, string> = {
    idle: "", wallet: "Awaiting wallet…", tx: "Sign transaction…", mining: "Confirming…", done: "Published! ✓",
  };

  const checklist = [
    { label: "Title added",       done: title.length > 0 },
    { label: "Preview blurb",     done: blurb.length > 0 },
    { label: "Article body",      done: body.length > 50 },
    { label: "Category selected", done: category.length > 0 },
    { label: "Price set",         done: price > 0 },
  ];
  const allDone   = checklist.every(c => c.done);
  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin { to { transform: rotate(360deg); } }
        .rl-spinner { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0; }

        .write-layout   { display:grid; grid-template-columns:1fr 272px; gap:20px; align-items:start; }
        .write-sidebar  { display:flex; flex-direction:column; gap:12px; position:sticky; top:86px; }
        .mob-pill       { display:none; }

        @media(max-width:768px) {
          .write-layout  { grid-template-columns:1fr !important; }
          .write-sidebar { position:static !important; }
          .mob-pill      { display:inline-flex !important; align-items:center; gap:4px; }
        }
        @media(max-width:480px) {
          .write-topbar-btns .btn-label { display:none; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "76px 14px 60px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> <span className="btn-label">Home</span>
            </Link>
            <span style={{ color: "var(--text-4)", fontSize: 14 }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>New Article</span>
          </div>

          <div className="write-topbar-btns" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Mobile: checklist progress pill */}
            <button
              className="mob-pill"
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                fontSize: 12, fontWeight: 700, padding: "6px 12px",
                borderRadius: "var(--radius-full)", cursor: "pointer", border: "none",
                background: allDone ? "rgba(5,150,105,0.08)" : "var(--bg-alt)",
                color: allDone ? "#059669" : "var(--text-3)",
                outline: `1px solid ${allDone ? "rgba(5,150,105,0.2)" : "var(--border)"}`,
              }}
            >
              {doneCount}/{checklist.length}{" "}
              {sidebarOpen ? <ChevronUp size={11} style={{ display: "inline" }} /> : <ChevronDown size={11} style={{ display: "inline" }} />}
            </button>

            <button onClick={() => setPreview(!preview)} className="btn btn-ghost btn-sm">
              <Eye size={14} /> <span className="btn-label">{preview ? "Edit" : "Preview"}</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || published || !allDone}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              {publishing
                ? <><div className="rl-spinner" /> <span className="btn-label">{STEP_LABELS[step]}</span></>
                : published
                ? <><CheckCircle2 size={14} /> <span className="btn-label">Published!</span></>
                : <><Send size={13} /> <span className="btn-label">Publish to Chain</span></>
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "var(--radius)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
          </div>
        )}

        {/* Success */}
        {published ? (
          <div className="card" style={{ padding: "clamp(32px,6vw,72px) clamp(20px,4vw,32px)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle2 size={28} style={{ color: "#059669" }} />
            </div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px,5vw,36px)", fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
              Article Published! 🎉
            </h2>
            <p style={{ color: "var(--text-3)", fontSize: 15, marginBottom: 8 }}>Your article is live on the Arc blockchain.</p>
            <p style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", marginBottom: 28 }}>
              Tx: {txHash.slice(0, 12)}…{txHash.slice(-8)}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/explore" className="btn btn-primary">Go to Explore</Link>
              <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="write-layout">

            {/* ── Editor column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

              {publishing && (
                <div style={{ padding: "12px 16px", background: "var(--brand-muted)", border: "1.5px solid var(--border-brand)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 13, height: 13, border: "2px solid rgba(109,40,217,0.3)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "rl-spin .7s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600 }}>{STEP_LABELS[step]}</span>
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
                  fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px, 5vw, 40px)",
                  fontWeight: 900, letterSpacing: "-0.02em",
                  color: "var(--text)", background: "transparent", lineHeight: 1.15, padding: "4px 0",
                }}
              />

              {/* Blurb */}
              <div className="card-flat" style={{ padding: "16px 18px" }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
                  Preview Blurb
                </label>
                <textarea
                  placeholder="Write a teaser that makes readers want to pay to read more…"
                  value={blurb}
                  onChange={e => setBlurb(e.target.value)}
                  maxLength={300}
                  rows={3}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, resize: "none", fontFamily: "Inter, sans-serif" }}
                />
                <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>
                  {blurb.length}/300
                </div>
              </div>

              {/* Editor / Preview */}
              {!preview ? (
                <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                  <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-alt)", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {[{ icon: Bold, label: "Bold" }, { icon: Italic, label: "Italic" }, { icon: Heading2, label: "Heading" }, { icon: List, label: "List" }, { icon: Quote, label: "Quote" }, { icon: Code, label: "Code" }].map(({ icon: Icon, label }) => (
                      <button key={label} title={label} style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </button>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-4)", fontWeight: 500 }}>
                      <Clock size={11} /> {readTime} min · {wordCount} words
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your full article here. It will be stored entirely on-chain…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={22}
                    className="editor-area"
                    style={{ padding: "20px", fontSize: 15, lineHeight: 1.8 }}
                  />
                </div>
              ) : (
                <div className="card" style={{ padding: "clamp(24px,4vw,40px) clamp(18px,4vw,36px)" }}>
                  <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px,5vw,32px)", fontWeight: 900, color: "var(--text)", marginBottom: 14, letterSpacing: "-0.02em" }}>
                    {title || "Your title here"}
                  </h1>
                  <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20, borderLeft: "3px solid var(--brand)", paddingLeft: 16 }}>
                    {blurb || "Your preview blurb…"}
                  </p>
                  <hr className="divider" style={{ marginBottom: 20 }} />
                  <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                    {body || "Your article body…"}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="write-sidebar">

              {/* Price */}
              <div className="card" style={{ padding: "20px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <DollarSign size={14} style={{ color: "#059669" }} />
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Article Price</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 10 }}>
                  <span style={{ color: "var(--text-4)", fontWeight: 700, fontSize: 14 }}>$</span>
                  <input type="number" min={0.01} max={1.0} step={0.01} value={price} onChange={e => setPrice(parseFloat(e.target.value))}
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "Outfit, sans-serif", fontSize: 26, fontWeight: 900, color: "#059669" }} />
                  <span style={{ color: "var(--text-4)", fontSize: 11, fontWeight: 700 }}>USDC</span>
                </div>
                <input type="range" min={0.01} max={1.0} step={0.01} value={price} onChange={e => setPrice(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#059669", cursor: "pointer", marginBottom: 4 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-4)", marginBottom: 12 }}>
                  <span>$0.01</span><span>$1.00</span>
                </div>
                <div style={{ paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)" }}>
                  You earn: <strong style={{ color: "#059669" }}>${(price * 0.85).toFixed(3)} USDC</strong> per read
                </div>
              </div>

              {/* Category */}
              <div className="card" style={{ padding: "20px 18px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 12 }}>Category</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                      padding: "7px 8px", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.15s",
                      border: category === cat ? "1.5px solid var(--brand)" : "1.5px solid var(--border)",
                      background: category === cat ? "var(--brand-muted)" : "transparent",
                      color: category === cat ? "var(--brand)" : "var(--text-3)",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="card" style={{ padding: "20px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Publish Checklist</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, color: allDone ? "#059669" : "var(--text-4)" }}>{doneCount}/{checklist.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {checklist.map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: `1.5px solid ${item.done ? "#059669" : "var(--border-strong)"}`,
                        background: item.done ? "rgba(5,150,105,0.08)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#059669", fontWeight: 800,
                      }}>
                        {item.done ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: item.done ? "var(--text-2)" : "var(--text-4)" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                {allDone && (
                  <button onClick={handlePublish} disabled={publishing || published}
                    className="btn btn-primary"
                    style={{ marginTop: 14, width: "100%", justifyContent: "center", fontWeight: 700 }}
                  >
                    <Send size={14} /> Publish to Chain
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
