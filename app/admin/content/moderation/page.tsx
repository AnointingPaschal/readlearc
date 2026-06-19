"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  CheckCircle2, Ban, Eye, RefreshCw, ExternalLink, Search,
  ShieldCheck, Clock, Users, DollarSign, Filter,
} from "lucide-react";
import Link from "next/link";
import { READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER, getReadProvider } from "../../../../lib/web3";

// Status is tracked locally (no on-chain moderation mechanism in contract)
const STORAGE_KEY = "rl-mod-statuses";
function loadStatuses(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveStatuses(s: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  LIVE:    { label: "Live",    color: "#059669", bg: "rgba(5,150,105,0.08)"  },
  REVIEW:  { label: "Review", color: "#d97706", bg: "rgba(217,119,6,0.08)"  },
  REMOVED: { label: "Removed",color: "#dc2626", bg: "rgba(220,38,38,0.08)"  },
};

export default function ModerationPage() {
  const [articles,  setArticles]  = useState<any[]>([]);
  const [statuses,  setStatuses]  = useState<Record<string, string>>({});
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("ALL");
  const [actioning, setActioning] = useState<string>("");

  async function fetchArticles() {
    setLoading(true);
    try {
      if (!READLEARC_ADDRESS) return;
      const prov  = getReadProvider();
      const c     = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
      const count = Number(await c.articleCount());
      const arts: any[] = [];
      for (let i = count; i >= Math.max(1, count - 99); i--) {
        try {
          const m = await c.getArticleMetadata(i);
          arts.push({
            id:        m.id.toString(),
            title:     m.title,
            blurb:     m.blurb,
            category:  m.category,
            price:     ethers.formatUnits(m.price, 6),
            reads:     Number(m.reads),
            author:    m.author,
            timestamp: Number(m.timestamp),
          });
        } catch {}
      }
      setArticles(arts);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchArticles();
    setStatuses(loadStatuses());
  }, []);

  function setStatus(id: string, status: string) {
    setActioning(id);
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    saveStatuses(next);
    setTimeout(() => setActioning(""), 600);
  }

  function getStatus(id: string) { return statuses[id] || "LIVE"; }

  const filtered = articles.filter(a => {
    const ms  = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    const mf  = filter === "ALL" || getStatus(a.id) === filter;
    return ms && mf;
  });

  const counts = {
    ALL:     articles.length,
    LIVE:    articles.filter(a => getStatus(a.id) === "LIVE").length,
    REVIEW:  articles.filter(a => getStatus(a.id) === "REVIEW").length,
    REMOVED: articles.filter(a => getStatus(a.id) === "REMOVED").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Content Moderation
          </h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>
            All on-chain articles · {articles.length} total · manage visibility status
          </p>
        </div>
        <button onClick={fetchArticles} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
          <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["ALL", "LIVE", "REVIEW", "REMOVED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 14px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            border: `1.5px solid ${filter === f ? "var(--brand)" : "var(--border)"}`,
            background: filter === f ? "var(--brand-muted)" : "transparent",
            color: filter === f ? "var(--brand)" : "var(--text-3)",
          }}>
            {f === "ALL" ? "All Articles" : STATUS_META[f].label}
            <span style={{ marginLeft: 6, fontSize: 10, color: filter === f ? "var(--brand)" : "var(--text-4)" }}>
              {(counts as any)[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or author address…" className="admin-input" style={{ paddingLeft: 36, fontSize: 13 }} />
      </div>

      {/* Articles */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <ShieldCheck size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>
            {articles.length === 0
              ? "No articles on-chain yet"
              : "No articles match this filter"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>
            {articles.length === 0
              ? "Articles published by writers will appear here immediately after on-chain confirmation."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(a => {
            const status = getStatus(a.id);
            const meta   = STATUS_META[status];
            const isActioning = actioning === a.id;

            return (
              <div key={a.id} className="card" style={{ padding: "16px 18px", borderLeft: `3px solid ${meta.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {meta.label}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: 10, textTransform: "capitalize" }}>{a.category}</span>
                      <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>#{a.id}</span>
                    </div>

                    <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>
                      {a.title}
                    </h3>

                    <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                      {a.blurb}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                      <Link href={`/profile/${a.author}`} style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--brand)", textDecoration: "none" }}>
                        {a.author.slice(0,10)}…{a.author.slice(-6)}
                      </Link>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><DollarSign size={10} style={{ color: "#059669" }} />${a.price} USDC</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={10} /> {a.reads} reads</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {new Date(a.timestamp * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <Link href={`/article/${a.id}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-alt)", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textDecoration: "none" }}>
                      <Eye size={12} /> View Live
                    </Link>

                    {status !== "LIVE" && (
                      <button onClick={() => setStatus(a.id, "LIVE")} disabled={isActioning} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.08)", fontSize: 11, fontWeight: 700, color: "#059669", cursor: "pointer", opacity: isActioning ? 0.5 : 1 }}>
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    )}

                    {status !== "REVIEW" && (
                      <button onClick={() => setStatus(a.id, "REVIEW")} disabled={isActioning} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(217,119,6,0.3)", background: "rgba(217,119,6,0.08)", fontSize: 11, fontWeight: 700, color: "#d97706", cursor: "pointer", opacity: isActioning ? 0.5 : 1 }}>
                        <Filter size={12} /> Flag Review
                      </button>
                    )}

                    {status !== "REMOVED" && (
                      <button onClick={() => setStatus(a.id, "REMOVED")} disabled={isActioning} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.08)", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer", opacity: isActioning ? 0.5 : 1 }}>
                        <Ban size={12} /> Remove
                      </button>
                    )}

                    <a href={`${ARC_EXPLORER}/tx/${a.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", fontSize: 11, color: "var(--text-4)", textDecoration: "none" }}>
                      <ExternalLink size={11} /> On-chain
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>
        Articles are published directly to Arc blockchain — they are <strong>live immediately</strong> upon on-chain confirmation. Status labels here are for your admin reference only. To permanently remove content from the contract, a new contract version with removal support would need to be deployed.
      </div>

      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
