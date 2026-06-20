"use client";
import { useWallet } from "../../lib/wallet";
import { useState, useEffect } from "react";
import { Flame, Zap, Gem, ThumbsDown, CloudRain, XOctagon } from "lucide-react";
import { REACTIONS, POSITIVE_REACTIONS, NEGATIVE_REACTIONS, type ReactionKey } from "../../lib/store";

// Map reaction key → lucide icon
const ICONS: Record<ReactionKey, React.ElementType> = {
  flame:      Flame,
  zap:        Zap,
  gem:        Gem,
  thumbsdown: ThumbsDown,
  cloudrain:  CloudRain,
  xoctagon:   XOctagon,
};

interface Props { articleId: string; }

export default function Reactions({ articleId }: Props) {
  const { address, isConnected } = useWallet();
  const [counts,  setCounts]  = useState<Record<string, number>>({});
  const [mine,    setMine]    = useState<ReactionKey | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res  = await fetch(`/api/social/reactions/${articleId}`);
    const data = await res.json();
    setCounts(data.counts || {});
    if (address) setMine((data.voters?.[address.toLowerCase()] as ReactionKey) || null);
  }

  useEffect(() => { load(); }, [articleId, address]);

  async function react(key: ReactionKey) {
    if (!isConnected || !address || loading) return;
    setLoading(true);
    const next = mine === key ? null : key;
    // Optimistic update
    const prev = mine;
    setCounts(c => {
      const n = { ...c };
      if (prev) n[prev] = Math.max(0, (n[prev] || 0) - 1);
      if (next) n[next] = (n[next] || 0) + 1;
      return n;
    });
    setMine(next);
    await fetch(`/api/social/reactions/${articleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address.toLowerCase(), emoji: next }),
    });
    setLoading(false);
  }

  const totalPos = POSITIVE_REACTIONS.reduce((s, r) => s + (counts[r.key] || 0), 0);
  const totalNeg = NEGATIVE_REACTIONS.reduce((s, r) => s + (counts[r.key] || 0), 0);

  const ReactionBtn = ({ r }: { r: typeof REACTIONS[ReactionKey] }) => {
    const Icon    = ICONS[r.key];
    const active  = mine === r.key;
    const count   = counts[r.key] || 0;
    const size    = r.level === 3 ? 18 : r.level === 2 ? 16 : 14;
    const btnSize = r.level === 3 ? 52 : r.level === 2 ? 46 : 42;

    return (
      <button
        onClick={() => react(r.key)}
        disabled={!isConnected || loading}
        title={r.label}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          width: btnSize, padding: "8px 4px",
          borderRadius: "var(--r-md)",
          border: `1.5px solid ${active ? r.color : "var(--border)"}`,
          background: active ? `${r.color}14` : "var(--bg-alt)",
          cursor: isConnected ? "pointer" : "default",
          transition: "all .18s cubic-bezier(.2,0,.13,1)",
          transform: active ? "scale(1.1)" : "scale(1)",
          boxShadow: active ? `0 3px 12px ${r.color}28` : "none",
          opacity: loading ? .6 : 1,
        }}
        onMouseEnter={e => { if (!active && isConnected) { (e.currentTarget as HTMLElement).style.borderColor = r.color; (e.currentTarget as HTMLElement).style.background = `${r.color}08`; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)"; }}}
      >
        <Icon size={size} style={{ color: active ? r.color : "var(--text-4)" }} strokeWidth={active ? 2.5 : 1.75}/>
        <span style={{ fontSize: 10, fontWeight: 700, color: active ? r.color : "var(--text-4)", fontFamily: "Outfit,sans-serif", lineHeight: 1 }}>
          {count > 0 ? count : ""}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12, fontFamily: "Outfit,sans-serif" }}>
        Reactions
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Positive */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginRight: 2 }}>Positive</span>
          {POSITIVE_REACTIONS.map(r => <ReactionBtn key={r.key} r={r}/>)}
        </div>

        <div style={{ width: 1, height: 48, background: "var(--border)", flexShrink: 0 }}/>

        {/* Negative */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginRight: 2 }}>Negative</span>
          {NEGATIVE_REACTIONS.map(r => <ReactionBtn key={r.key} r={r}/>)}
        </div>

        {/* Totals */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {totalPos > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#ea580c" }}>
              <Flame size={12}/>{totalPos}
            </span>
          )}
          {totalNeg > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
              <ThumbsDown size={12}/>{totalNeg}
            </span>
          )}
        </div>
      </div>

      {!isConnected && (
        <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8 }}>
          Connect wallet to react
        </p>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        {Object.values(REACTIONS).map(r => {
          const Icon = ICONS[r.key];
          return (
            <span key={r.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-4)" }}>
              <Icon size={10} style={{ color: r.color }}/>{r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
