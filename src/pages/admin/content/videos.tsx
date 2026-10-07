/**
 * Admin → Content → All Videos
 * View, moderate (approve / reject / feature / remove), and manage all uploaded videos.
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Link } from "@/lib/nav";
import {
  Video, RefreshCw, Search, Eye, CheckCircle2, Ban, Star,
  Trash2, AlertCircle, Loader2, Play, ChevronDown, ChevronUp,
  Clock, User, Zap, DollarSign,
} from "lucide-react";

type VS = "pending" | "approved" | "featured" | "rejected" | "removed";
const STATUS_CFG: Record<VS, { label: string; c: string; bg: string }> = {
  pending:  { label: "Pending",  c: "#d97706", bg: "rgba(217,119,6,.09)"  },
  approved: { label: "Approved", c: "#059669", bg: "rgba(5,150,105,.09)"  },
  featured: { label: "Featured", c: "#ca8a04", bg: "rgba(234,179,8,.09)"  },
  rejected: { label: "Rejected", c: "#dc2626", bg: "rgba(220,38,38,.09)"  },
  removed:  { label: "Removed",  c: "#6b7280", bg: "rgba(107,114,128,.09)"},
};

interface VideoRow {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  creator_address: string;
  price_per_sec_usdc: string;
  free_preview_secs: number;
  duration_seconds: number;
  category: string;
  status: VS;
  featured: boolean;
  views: number;
  created_at: string;
  encrypted: boolean;
  r2: boolean; // true = stored in R2, false = on-chain chunks
}

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function AdminVideosPage() {
  const [videos,   setVideos]   = useState<VideoRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | VS>("all");
  const [search,   setSearch]   = useState("");
  const [busy,     setBusy]     = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [err,      setErr]      = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const p = new URLSearchParams();
      if (filter !== "all") p.set("status", filter);
      if (search) p.set("q", search);
      const r = await apiFetch(`/api/admin/videos?${p}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load");
      setVideos(Array.isArray(d) ? d : []);
    } catch (e: any) {
      setErr(e.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  async function patch(id: number, body: Partial<VideoRow>) {
    setBusy(String(id));
    try {
      const r = await apiFetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
      setVideos(prev => prev.map(v => v.id === id ? { ...v, ...body } : v));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function del(id: number) {
    if (!confirm("Remove this video permanently? This cannot be undone.")) return;
    setBusy(String(id));
    try {
      const r = await apiFetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const filtered = videos.filter(v => {
    if (filter !== "all" && v.status !== filter) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase()) &&
        !v.creator_address.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { all: videos.length };
  videos.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Video size={20} style={{ color: "var(--brand)" }} />
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>
              All Videos
            </h1>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>
            {videos.length} video{videos.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/contribute/video" className="btn btn-primary btn-sm" style={{ gap: 5 }}>
            <Play size={12} /> Upload Video
          </Link>
          <button onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--r-f)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r-md)", fontSize: 13, color: "#dc2626", display: "flex", gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {err}
        </div>
      )}

      {/* Status filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "featured", "rejected", "removed"] as const).map(f => {
          const sc = STATUS_CFG[f as VS] || { c: "var(--brand)", bg: "var(--brand-muted)" };
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "5px 12px", borderRadius: "var(--r-f)", fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${filter === f ? sc.c : "var(--border)"}`, background: filter === f ? sc.bg : "transparent", color: filter === f ? sc.c : "var(--text-3)", transition: "all .15s" }}>
              {f === "all" ? "All" : sc.label} ({counts[f] || 0})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()}
          placeholder="Search by title or creator address…"
          className="admin-input"
          style={{ paddingLeft: 34 }}
        />
      </div>

      {/* List */}
      {loading
        ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--r-lg)" }} />)
        : !filtered.length
          ? <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-4)", fontSize: 14 }}>
              {videos.length === 0 ? "No videos uploaded yet." : "No videos match this filter."}
            </div>
          : filtered.map(v => {
              const sc = STATUS_CFG[v.status] || STATUS_CFG.pending;
              const isFree = parseFloat(v.price_per_sec_usdc) === 0;
              const isExp = expanded === v.id;
              const isBusy = busy === String(v.id);

              return (
                <div key={v.id} className="card" style={{ overflow: "hidden", borderLeft: `3px solid ${sc.c}`, padding: 0 }}>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>

                      {/* Thumbnail placeholder */}
                      <div style={{ width: 72, height: 48, borderRadius: "var(--r)", background: "var(--bg-alt)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                        {v.r2
                          ? <img src={`/api/video/thumb/${v.id}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--r)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <Video size={18} />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", gap: 5, marginBottom: 5, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "var(--r-f)", background: sc.bg, color: sc.c }}>{sc.label}</span>
                          {v.featured && <span className="badge badge-star" style={{ fontSize: 9 }}>Featured</span>}
                          <span className="badge badge-neutral" style={{ fontSize: 9 }}>{v.category}</span>
                          {v.r2
                            ? <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: "var(--r-f)", background: "rgba(16,185,129,.08)", color: "#10b981", border: "1px solid rgba(16,185,129,.2)", fontWeight: 700 }}>R2</span>
                            : <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: "var(--r-f)", background: "rgba(99,102,241,.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,.2)", fontWeight: 700 }}>Chain</span>}
                          <span style={{ fontSize: 9, color: "var(--text-4)", fontFamily: "JetBrains Mono,monospace" }}>#{v.id}</span>
                        </div>
                        <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>{v.title}</h3>
                        {v.blurb && <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.4, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.blurb}</p>}
                        <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-4)", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><User size={9} />{shortAddr(v.creator_address)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />{fmtDur(v.duration_seconds)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Eye size={9} />{v.views} views</span>
                          {isFree
                            ? <span style={{ color: "#10b981", fontWeight: 700 }}>Free</span>
                            : <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#ca8a04", fontWeight: 700 }}><Zap size={8} />${v.price_per_sec_usdc}/s</span>}
                          <span>{new Date(v.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Link href={`/watch/${v.slug}`} target="_blank"
                            style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg-alt)", fontSize: 10, fontWeight: 600, color: "var(--text-3)", textDecoration: "none" }}>
                            <Eye size={9} /> Watch
                          </Link>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {v.status !== "approved" && (
                            <button onClick={() => patch(v.id, { status: "approved", featured: false })} disabled={isBusy}
                              style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: "var(--r)", border: "1px solid rgba(5,150,105,.3)", background: "rgba(5,150,105,.08)", fontSize: 10, fontWeight: 700, color: "#059669", cursor: "pointer" }}>
                              {isBusy ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={9} />} Approve
                            </button>
                          )}
                          {v.status !== "featured" && (
                            <button onClick={() => patch(v.id, { status: "featured", featured: true })} disabled={isBusy}
                              style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: "var(--r)", border: "1px solid rgba(234,179,8,.3)", background: "rgba(234,179,8,.08)", fontSize: 10, fontWeight: 700, color: "#ca8a04", cursor: "pointer" }}>
                              <Star size={9} /> Feature
                            </button>
                          )}
                          {v.status !== "rejected" && (
                            <button onClick={() => patch(v.id, { status: "rejected" })} disabled={isBusy}
                              style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: "var(--r)", border: "1px solid rgba(220,38,38,.3)", background: "rgba(220,38,38,.08)", fontSize: 10, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
                              <Ban size={9} /> Reject
                            </button>
                          )}
                          <button onClick={() => del(v.id)} disabled={isBusy}
                            style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: "var(--r)", border: "1px solid rgba(220,38,38,.2)", background: "transparent", fontSize: 10, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
                            <Trash2 size={9} /> Delete
                          </button>
                        </div>
                        {/* Toggle monetization */}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => patch(v.id, { price_per_sec_usdc: isFree ? "0.0001" : "0" })}
                            disabled={isBusy}
                            style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: "var(--r)", border: `1px solid ${isFree ? "rgba(202,138,4,.3)" : "rgba(107,114,128,.3)"}`, background: isFree ? "rgba(202,138,4,.06)" : "rgba(107,114,128,.06)", fontSize: 10, fontWeight: 700, color: isFree ? "#ca8a04" : "var(--text-4)", cursor: "pointer" }}>
                            <DollarSign size={9} /> {isFree ? "Set Paid" : "Set Free"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable details */}
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <button onClick={() => setExpanded(isExp ? null : v.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "var(--text-4)", padding: "2px 0" }}>
                        {isExp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        {isExp ? "Hide details" : "Show details"}
                      </button>
                      {isExp && (
                        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
                          {[
                            ["Creator", <a href={`/profile/${v.creator_address}`} style={{ color: "var(--brand)", fontFamily: "JetBrains Mono,monospace", fontSize: 10 }}>{v.creator_address}</a>],
                            ["Slug", <code style={{ fontSize: 10, fontFamily: "JetBrains Mono,monospace" }}>{v.slug}</code>],
                            ["Duration", fmtDur(v.duration_seconds)],
                            ["Free preview", `${v.free_preview_secs}s`],
                            ["Price", isFree ? "Free" : `$${v.price_per_sec_usdc}/s`],
                            ["Storage", v.r2 ? "Cloudflare R2" : "On-chain chunks"],
                            ["Encrypted", v.encrypted ? "Yes (paid)" : "No"],
                            ["Uploaded", new Date(v.created_at).toLocaleString()],
                          ].map(([k, val]) => (
                            <div key={String(k)} style={{ padding: "8px 10px", background: "var(--bg-alt)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{k}</div>
                              <div style={{ fontSize: 11, color: "var(--text)" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
    </div>
  );
}
