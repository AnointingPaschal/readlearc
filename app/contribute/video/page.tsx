"use client";
/**
 * /contribute/video — Creator video upload page.
 * Mirrors the /write page structure and theme.
 */
import { useState } from "react";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import ConnectGate from "../../../components/ui/ConnectGate";
import { useAuth } from "../../../lib/auth";
import {
  Video, Upload, DollarSign, Clock, CheckCircle2,
  AlertCircle, Eye, Loader2, Info,
} from "lucide-react";
import Link from "next/link";

export default function VideoUploadPage() {
  const { address, isAuth, requireAuth } = useAuth();

  const [title,            setTitle]            = useState("");
  const [blurb,            setBlurb]            = useState("");
  const [slug,             setSlug]             = useState("");
  const [category,         setCategory]         = useState("General");
  const [isFree,           setIsFree]           = useState(false);
  const [pricePerSec,      setPricePerSec]      = useState("0.0001");
  const [freePreviewSecs,  setFreePreviewSecs]  = useState(30);
  const [hlsMasterUrl,     setHlsMasterUrl]     = useState("");
  const [thumbnailUrl,     setThumbnailUrl]     = useState("");
  const [durationSecs,     setDurationSecs]     = useState(0);
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [error,            setError]            = useState("");

  const CATEGORIES = ["General","Technology","Science","DeFi","Web3","AI","Business","Education","Art","Music","Gaming","Lifestyle"];

  const effectivePrice = isFree ? "0" : pricePerSec;
  const totalCost = isFree || !durationSecs ? 0 : parseFloat(pricePerSec) * durationSecs;
  const autoSlug  = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function submit() {
    if (!isAuth) { requireAuth(); return; }
    if (!title.trim()) { setError("Title is required"); return; }
    if (!hlsMasterUrl.trim()) { setError("HLS master URL is required. Upload your video first and paste the .m3u8 URL."); return; }

    const finalSlug = slug.trim() || autoSlug(title);

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/videos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          creatorAddress:  address,
          title:           title.trim(),
          blurb:           blurb.trim(),
          slug:            finalSlug,
          category,
          pricePerSecUsdc: effectivePrice,
          freePreviewSecs,
          durationSeconds: durationSecs,
          hlsMasterUrl:    hlsMasterUrl.trim(),
          thumbnailUrl:    thumbnailUrl.trim() || null,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit");

      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit video");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <ConnectGate title="Upload a Video" body="Connect your wallet to upload videos and earn USDC per second watched." icon={Video} />
    </div>
  );

  if (saved) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <CheckCircle2 size={48} style={{ color: "var(--accent)", marginBottom: 16 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Video submitted!</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
          Your video is pending review. Once approved, viewers can start paying per second to watch it on Arc Mainnet.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/videos" className="btn btn-primary btn-sm">Browse videos</Link>
          <button onClick={() => setSaved(false)} className="btn btn-ghost btn-sm">Upload another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "calc(var(--header-h) + 24px) 16px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Video size={22} style={{ color: "var(--brand)" }} />
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 900, fontSize: "clamp(18px,4vw,24px)", color: "var(--text)", letterSpacing: "-.02em" }}>
              Upload a Video
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            Upload your HLS video and set a per-second price. Viewers pay only for what they watch, settled on Arc Mainnet instantly.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>VIDEO TITLE *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My awesome video"
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 14, color: "var(--text)", boxSizing: "border-box" as const }}
            />
          </div>

          {/* Blurb */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>DESCRIPTION</label>
            <textarea
              value={blurb}
              onChange={e => setBlurb(e.target.value)}
              rows={3}
              placeholder="What's this video about?"
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", resize: "vertical", boxSizing: "border-box" as const }}
            />
          </div>

          {/* HLS URL */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>HLS MASTER URL (m3u8) *</label>
            <input
              value={hlsMasterUrl}
              onChange={e => setHlsMasterUrl(e.target.value)}
              placeholder="https://cdn.example.com/videos/my-video/master.m3u8"
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
            />
            <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6 }}>
              Upload your video to Cloudflare Stream, Mux, or any HLS CDN and paste the master playlist URL here.
            </p>
          </div>

          {/* Thumbnail & duration */}
          <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>THUMBNAIL URL</label>
              <input
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://…/thumbnail.jpg"
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 12, color: "var(--text)", boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>DURATION (seconds)</label>
              <input
                type="number"
                min={0}
                value={durationSecs}
                onChange={e => setDurationSecs(parseInt(e.target.value) || 0)}
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 12, color: "var(--text)", boxSizing: "border-box" as const }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 10 }}>PRICING</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", marginBottom: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isFree}
                onChange={e => setIsFree(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--brand)" }}
              />
              Make this video free (no USDC required)
            </label>

            {!isFree && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", display: "block", marginBottom: 5 }}>PRICE PER SECOND (USDC)</label>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
                    <input
                      type="number"
                      min="0"
                      step="0.00001"
                      value={pricePerSec}
                      onChange={e => setPricePerSec(e.target.value)}
                      style={{ width: "100%", paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
                    />
                  </div>
                  {durationSecs > 0 && (
                    <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4 }}>
                      Max cost: ${totalCost.toFixed(4)} USDC for full video
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", display: "block", marginBottom: 5 }}>FREE PREVIEW (seconds)</label>
                  <div style={{ position: "relative" }}>
                    <Eye size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
                    <input
                      type="number"
                      min="0"
                      value={freePreviewSecs}
                      onChange={e => setFreePreviewSecs(parseInt(e.target.value) || 0)}
                      style={{ width: "100%", paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
                    />
                  </div>
                  <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4 }}>Viewers watch this many seconds free before paying</p>
                </div>
              </div>
            )}
          </div>

          {/* Category + Slug */}
          <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>CUSTOM SLUG (optional)</label>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder={autoSlug(title) || "my-video"}
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
              />
            </div>
          </div>

          {/* Info banner */}
          <div style={{ padding: "10px 14px", background: "var(--brand-muted)", borderRadius: "var(--r)", border: "1px solid var(--brand-border)", display: "flex", gap: 8 }}>
            <Info size={14} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "var(--brand)", margin: 0, lineHeight: 1.6 }}>
              Payments settle on <strong>Arc Mainnet</strong> in under a second. You earn USDC per second watched — minus a 2% platform fee (configurable to 0% from the admin panel).
            </p>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(239,68,68,.08)", borderRadius: "var(--r)", border: "1px solid rgba(239,68,68,.25)" }}>
              <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={saving}
            className="btn btn-primary"
            style={{ height: 44, fontWeight: 700, fontSize: 14, justifyContent: "center" }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
              : <><Upload size={15} /> Submit Video</>}
          </button>
        </div>
      </div>
    </div>
  );
}
