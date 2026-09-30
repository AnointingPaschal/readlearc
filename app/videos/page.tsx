"use client";
/**
 * /videos — Video discovery feed.
 * Uses the same card patterns and design tokens as the articles feed.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import { Clock, Eye, Zap, Play, Search, Flame } from "lucide-react";

interface Video {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  creator_address: string;
  price_per_sec_usdc: string;
  free_preview_secs: number;
  duration_seconds: number;
  thumbnail_url?: string;
  category: string;
  views: number;
  featured: boolean;
}

function VideoCard({ v }: { v: Video }) {
  const isFree = parseFloat(v.price_per_sec_usdc) === 0;
  const h = parseInt((v.creator_address || "000000").slice(2, 4) || "0", 16) * 1.4;
  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

  return (
    <Link href={`/watch/${v.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="card card-hover" style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Thumbnail */}
        <div style={{
          height: 140, background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover no-repeat` : `linear-gradient(135deg,hsl(${h}deg,40%,30%),hsl(${h+60}deg,40%,20%))`,
          position: "relative", flexShrink: 0,
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={20} color="#fff" />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.7)", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "#fff", fontFamily: "JetBrains Mono,monospace" }}>
            {fmtTime(v.duration_seconds)}
          </div>
          {isFree && (
            <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(16,185,129,.85)", borderRadius: 4, padding: "1px 7px", fontSize: 9, fontWeight: 700, color: "#fff" }}>Free</div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{v.category}</span>
          </div>
          <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", margin: 0 }}>{v.title}</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-4)" }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", background: `hsl(${h}deg,40%,50%)` }} />
              <span>{v.creator_address.slice(0,6)}…</span>
              <Eye size={9} /><span>{v.views}</span>
            </div>
            {!isFree && (
              <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>
                <Zap size={9} />${v.price_per_sec_usdc}/s
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function VideosPage() {
  const [videos,  setVideos]  = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    fetch("/api/videos?limit=40")
      .then(r => r.json())
      .then(d => setVideos(d.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = videos.filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  );
  const featured = filtered.filter(v => v.featured);
  const rest     = filtered.filter(v => !v.featured);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "calc(var(--header-h) + 24px) 16px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(20px,4vw,28px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", marginBottom: 4 }}>
              Videos
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Pay per second — only for what you watch. Settle on Arc Mainnet instantly.</p>
          </div>
          <Link href="/contribute/video" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            + Upload Video
          </Link>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24, maxWidth: 380 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos…"
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--r-f)", fontSize: 13, color: "var(--text)", boxSizing: "border-box" as const }}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--text-4)", fontSize: 13 }}>Loading videos…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-4)", fontSize: 14 }}>
            No videos yet. <Link href="/contribute/video" style={{ color: "var(--brand)" }}>Upload the first one →</Link>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <Flame size={14} style={{ color: "var(--brand)" }} />
                  <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Featured</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                  {featured.map(v => <VideoCard key={v.slug} v={v} />)}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
              {rest.map(v => <VideoCard key={v.slug} v={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
