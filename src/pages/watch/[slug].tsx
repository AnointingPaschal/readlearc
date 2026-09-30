/**
 * /watch/[slug] — Pay-per-second video player page.
 * Preserves all existing theme tokens and page structure patterns.
 */
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams } from "@/lib/nav";
import { Link } from "@/lib/nav";
import Navbar from "@/components/ui/Navbar";
import SetupBanner from "@/components/ui/SetupBanner";
import StreamPlayer from "@/components/ui/StreamPlayer";
import TipModal from "@/components/ui/TipModal";
import SubscribeModal from "@/components/ui/SubscribeModal";
import {
  Clock, Eye, Zap, Heart, Star, ArrowLeft,
  User, AlertCircle, Loader2,
} from "lucide-react";

interface VideoMeta {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  creator_address: string;
  price_per_sec_usdc: string;
  free_preview_secs: number;
  duration_seconds: number;
  hls_master_url: string;
  thumbnail_url?: string;
  category: string;
  views: number;
}

interface CreatorSub {
  monthly_price_usdc: string;
  yearly_price_usdc: string;
  enabled: boolean;
}

export default function WatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const [video,      setVideo]      = useState<VideoMeta | null>(null);
  const [subConfig,  setSubConfig]  = useState<CreatorSub | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showTip,    setShowTip]    = useState(false);
  const [showSub,    setShowSub]    = useState(false);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/stream/meta/${slug}`);
        if (!res.ok) { setError("Video not found"); setLoading(false); return; }
        const { video: v } = await res.json();
        setVideo(v);

        // Fetch creator subscription config
        const subRes = await apiFetch(`/api/pay/subscribe/config?creator=${v.creator_address}`).catch(() => null);
        if (subRes?.ok) {
          const d = await subRes.json();
          if (d.config) setSubConfig(d.config);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400, gap: 10, color: "var(--text-3)" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading video…</span>
      </div>
    </div>
  );

  if (error || !video) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ color: "#ef4444", marginBottom: 12 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text)", marginBottom: 8 }}>
          {error || "Video not found"}
        </h2>
        <Link href="/explore" className="btn btn-primary btn-sm" style={{ display: "inline-flex" }}>
          Browse content
        </Link>
      </div>
    </div>
  );

  const isFree = parseFloat(video.price_per_sec_usdc) === 0;
  const totalCost = (parseFloat(video.price_per_sec_usdc) * video.duration_seconds).toFixed(4);
  const creatorShort = `${video.creator_address.slice(0,6)}…${video.creator_address.slice(-4)}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "calc(var(--header-h) + 20px) 16px 60px" }}>

        {/* Back */}
        <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", textDecoration: "none", marginBottom: 16, opacity: 0.8 }}>
          <ArrowLeft size={13} /> Back to explore
        </Link>

        {/* Player */}
        <StreamPlayer
          videoId={video.id}
          title={video.title}
          creatorAddress={video.creator_address}
          pricePerSecUsdc={video.price_per_sec_usdc}
          durationSeconds={video.duration_seconds}
          freePreviewSecs={video.free_preview_secs}
        />

        {/* Metadata */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>
              {video.category}
            </span>
            {isFree ? (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,.1)", color: "#10b981", border: "1px solid rgba(16,185,129,.3)" }}>Free</span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(202,138,4,.1)", color: "#ca8a04", border: "1px solid rgba(202,138,4,.3)", display: "flex", alignItems: "center", gap: 3 }}>
                <Zap size={7} />${video.price_per_sec_usdc}/s
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 900, fontSize: "clamp(18px,4vw,26px)", color: "var(--text)", letterSpacing: "-.02em", lineHeight: 1.25, marginBottom: 8 }}>
            {video.title}
          </h1>
          {video.blurb && (
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 16, maxWidth: 680 }}>{video.blurb}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <Link href={`/profile/${video.creator_address}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${parseInt(video.creator_address.slice(2,4)||"6d",16)*1.4}deg,65%,55%)` }} />
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{creatorShort}</span>
            </Link>
            <span style={{ fontSize: 11, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />{fmtTime(video.duration_seconds)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={11} />{video.views} views
            </span>
            {!isFree && (
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>
                Max cost: ${totalCost} USDC for full video
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowTip(true)}
              className="btn btn-ghost btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Heart size={13} style={{ color: "var(--brand)" }} /> Tip Creator
            </button>

            {subConfig?.enabled && (
              <button
                onClick={() => setShowSub(true)}
                className="btn btn-ghost btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Star size={13} style={{ color: "#ca8a04" }} /> Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      {showTip && (
        <TipModal
          creatorAddress={video.creator_address}
          contentId={String(video.id)}
          contentType="video"
          onClose={() => setShowTip(false)}
        />
      )}

      {showSub && subConfig && (
        <SubscribeModal
          creatorAddress={video.creator_address}
          monthlyPrice={subConfig.monthly_price_usdc}
          yearlyPrice={subConfig.yearly_price_usdc}
          onClose={() => setShowSub(false)}
          onSuccess={() => setShowSub(false)}
        />
      )}
    </div>
  );
}
