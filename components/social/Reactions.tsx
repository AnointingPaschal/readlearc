
"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../lib/wallet";
import { REACTIONS } from "../../lib/store";

const POSITIVE = Object.entries(REACTIONS).filter(([,r])=>r.type==="positive");
const NEGATIVE = Object.entries(REACTIONS).filter(([,r])=>r.type==="negative");

interface Props { articleId: string; }

export default function Reactions({ articleId }: Props) {
  const { address, isConnected } = useWallet();
  const [counts, setCounts] = useState<Record<string,number>>({});
  const [mine,   setMine]   = useState<string|null>(null);
  const [loading,setLoading]= useState(false);

  async function load() {
    const res  = await fetch(`/api/social/reactions/${articleId}`);
    const data = await res.json();
    setCounts(data.counts || {});
    if (address) setMine(data.voters?.[address.toLowerCase()] || null);
  }

  useEffect(() => { load(); }, [articleId, address]);

  async function react(emoji: string) {
    if (!isConnected || !address || loading) return;
    setLoading(true);
    const res  = await fetch(`/api/social/reactions/${articleId}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ address: address.toLowerCase(), emoji: mine===emoji ? null : emoji }),
    });
    const data = await res.json();
    setCounts(data.counts || {});
    setMine(data.voters?.[address.toLowerCase()] || null);
    setLoading(false);
  }

  const totalPos = POSITIVE.reduce((s,[k])=>s+(counts[k]||0),0);
  const totalNeg = NEGATIVE.reduce((s,[k])=>s+(counts[k]||0),0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".06em" }}>Reactions</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:5 }}>
          {POSITIVE.map(([emoji,r]) => (
            <button key={emoji} onClick={() => react(emoji)} title={r.label} disabled={loading}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 12px", borderRadius:14,
                border:`2px solid ${mine===emoji?"var(--accent)":"var(--border)"}`,
                background:mine===emoji?"var(--accent-muted)":"var(--bg-alt)",
                cursor:isConnected?"pointer":"default", transition:"all .18s", opacity:loading?.6:1,
                transform:mine===emoji?"scale(1.08)":"scale(1)" }}>
              <span style={{ fontSize:r.level===3?22:r.level===2?18:16 }}>{emoji}</span>
              <span style={{ fontSize:10, fontWeight:700, color:mine===emoji?"var(--accent)":"var(--text-4)" }}>{counts[emoji]||0}</span>
            </button>
          ))}
        </div>
        <div style={{ width:1, height:40, background:"var(--border)" }}/>
        <div style={{ display:"flex", gap:5 }}>
          {NEGATIVE.map(([emoji,r]) => (
            <button key={emoji} onClick={() => react(emoji)} title={r.label} disabled={loading}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 12px", borderRadius:14,
                border:`2px solid ${mine===emoji?"#dc2626":"var(--border)"}`,
                background:mine===emoji?"rgba(220,38,38,.08)":"var(--bg-alt)",
                cursor:isConnected?"pointer":"default", transition:"all .18s", opacity:loading?.6:1,
                transform:mine===emoji?"scale(1.08)":"scale(1)" }}>
              <span style={{ fontSize:r.level===3?22:r.level===2?18:16 }}>{emoji}</span>
              <span style={{ fontSize:10, fontWeight:700, color:mine===emoji?"#dc2626":"var(--text-4)" }}>{counts[emoji]||0}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft:"auto", fontSize:12, color:"var(--text-4)", display:"flex", gap:12 }}>
          <span>👍 {totalPos}</span><span>👎 {totalNeg}</span>
        </div>
      </div>
      {!isConnected && <p style={{ fontSize:11, color:"var(--text-4)", margin:0 }}>Connect wallet to react</p>}
    </div>
  );
}
