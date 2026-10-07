/**
 * /contribute/video — R2-backed video upload.
 * The video is uploaded to Cloudflare R2 (free for creators).
 * Only a single cheap on-chain metadata transaction is needed (~$0.001).
 * Creators can choose free or paid (per-second StreamPay) for viewers.
 */
import { useState, useRef } from "react";
import { useMonetization } from "@/lib/useMonetization";
import MonetizationPanel from "@/components/ui/MonetizationPanel";
import { withActivity } from "@/lib/activity";
import { explainError } from "@/lib/chain";
import { publishVideoR2 } from "@/lib/onchain/video-r2";
import { captureThumb } from "@/lib/onchain/video";
import Navbar from "@/components/ui/Navbar";
import SetupBanner from "@/components/ui/SetupBanner";
import ConnectGate from "@/components/ui/ConnectGate";
import { useAuth } from "@/lib/auth";
import { Video, Upload, CheckCircle2, AlertCircle, Loader2, DollarSign, Eye } from "lucide-react";
import { Link } from "@/lib/nav";

export default function VideoUploadPage() {
  const { signer, address, isAuth, requireAuth } = useAuth();
  const { monetized, loading: monLoading } = useMonetization(address);

  const [title,           setTitle]           = useState("");
  const [blurb,           setBlurb]           = useState("");
  const [slug,            setSlug]            = useState("");
  const [category,        setCategory]        = useState("General");
  const [isFree,          setIsFree]          = useState(true);
  const [pricePerSec,     setPricePerSec]     = useState("0.001");
  const [freePreviewSecs, setFreePreviewSecs] = useState(30);
  const [file,            setFile]            = useState<File | null>(null);
  const [durationSecs,    setDurationSecs]    = useState(0);
  const [saving,          setSaving]          = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [error,           setError]           = useState("");
  const thumbRef = useRef<Uint8Array | null>(null);

  const CATEGORIES = ["General","Technology","Science","DeFi","Web3","AI","Business","Education","Art","Music","Gaming","Lifestyle"];
  const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function pickFile(f: File | null) {
    setFile(f); setDurationSecs(0); thumbRef.current = null;
    if (!f) return;
    if (!slug && !title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { setDurationSecs(Math.round(v.duration || 0)); URL.revokeObjectURL(v.src); };
    v.src = URL.createObjectURL(f);
    // Capture thumbnail in the background
    captureThumb(f).then(t => { thumbRef.current = t; }).catch(() => {});
  }

  async function submit() {
    if (!isAuth || !signer) { requireAuth(); return; }
    if (!title.trim()) { setError("Title is required"); return; }
    if (!file) { setError("Choose a video file to upload."); return; }
    const finalSlug = slug.trim() || autoSlug(title);
    setSaving(true); setError("");
    try {
      await withActivity("Uploading video", async (update) => {
        await publishVideoR2(signer, {
          title: title.trim(),
          blurb: blurb.trim(),
          slug: finalSlug,
          category,
          pricePerSec: isFree ? "0" : pricePerSec,
          freePreviewSecs: isFree ? 0 : freePreviewSecs,
          durationSecs,
        }, file, thumbRef.current, update);
      }, { batch: "Registers your video on-chain (one transaction) then uploads the file. All signed automatically." });
      setSaved(true);
    } catch (e) {
      setError(explainError(e, "Failed to upload video"));
    } finally {
      setSaving(false);
    }
  }

  if (!isAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <ConnectGate title="Upload a Video" body="Connect your wallet to upload videos to Readlearc." icon={Video} />
    </div>
  );

  if (saved) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <CheckCircle2 size={48} style={{ color: "var(--accent)", marginBottom: 16 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Video uploaded!</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
          Your video is live. It will appear in the videos feed once approved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/videos" className="btn btn-primary btn-sm">Browse videos</Link>
          <button onClick={() => { setSaved(false); setFile(null); setTitle(""); setBlurb(""); setSlug(""); }} className="btn btn-ghost btn-sm">Upload another</button>
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
            Upload your video for free. Only a tiny on-chain metadata fee (~$0.001 USDC) applies — no storage cost.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>VIDEO TITLE *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My awesome video" disabled={saving}
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 14, color: "var(--text)", boxSizing: "border-box" as const }} />
          </div>

          {/* Description */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>DESCRIPTION</label>
            <textarea value={blurb} onChange={e => setBlurb(e.target.value)} rows={3} placeholder="What's this video about?" disabled={saving}
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", resize: "vertical", boxSizing: "border-box" as const }} />
          </div>

          {/* Video file */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>VIDEO FILE *</label>
            <input type="file" accept="video/*" onChange={e => pickFile(e.target.files?.[0] || null)} disabled={saving}
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px dashed var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }} />
            {file && (
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                {file.name} · {(file.size / 1e6).toFixed(1)} MB{durationSecs ? ` · ${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, "0")}` : ""}
              </p>
            )}
            <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8, lineHeight: 1.6 }}>
              Uploaded directly to cloud storage — no compression needed. Supports MP4, WebM, MOV, and most video formats.
            </p>
          </div>

          {/* Pricing */}
          <div className="card" style={{ padding: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 10 }}>PRICING</label>
            {!monetized && !monLoading && <div style={{ marginBottom: 12 }}><MonetizationPanel compact /></div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", marginBottom: isFree ? 0 : 14, cursor: "pointer" }}>
              <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} disabled={!monetized}
                style={{ width: 16, height: 16, accentColor: "var(--brand)" }} />
              Make this video free (no USDC required to watch)
            </label>
            {!isFree && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", display: "block", marginBottom: 5 }}>PRICE PER SECOND (USDC)</label>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
                    <input type="number" min="0" step="0.00001" value={pricePerSec} onChange={e => setPricePerSec(e.target.value)}
                      style={{ width: "100%", paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", display: "block", marginBottom: 5 }}>FREE PREVIEW (seconds)</label>
                  <div style={{ position: "relative" }}>
                    <Eye size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
                    <input type="number" min="0" value={freePreviewSecs} onChange={e => setFreePreviewSecs(parseInt(e.target.value) || 0)}
                      style={{ width: "100%", paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category + Slug */}
          <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>CATEGORY</label>
              <select value={category} onChange={e => setCategory(e.target.value)} disabled={saving}
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>CUSTOM SLUG (optional)</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder={autoSlug(title) || "my-video"} disabled={saving}
                style={{ width: "100%", padding: "8px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }} />
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(239,68,68,.08)", borderRadius: "var(--r)", border: "1px solid rgba(239,68,68,.25)" }}>
              <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={saving} className="btn btn-primary"
            style={{ height: 44, fontWeight: 700, fontSize: 14, justifyContent: "center" }}>
            {saving
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
              : <><Upload size={15} /> Upload Video</>}
          </button>
        </div>
      </div>
    </div>
  );
}
