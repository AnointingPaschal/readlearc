"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Bell, BookOpen, DollarSign, UserCheck, Flag, RefreshCw, ExternalLink, CheckCheck } from "lucide-react";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL, readProvider } from "../../../lib/chain";

type Notification = {
  id: string; type: string; title: string; body: string;
  color: string; bg: string; icon: any;
  txHash?: string; link?: string; blockNumber: number; read: boolean;
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      if (!CONTRACT_ADDRESS) return;
      const prov = readProvider();
      const c    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);

      const [pubEvs, readEvs, verEvs] = await Promise.all([
        c.queryFilter(c.filters.ArticlePublished(), -100000),
        c.queryFilter(c.filters.ArticleRead(),      -100000),
        c.queryFilter(c.filters.WriterVerified(),   -100000),
      ]);

      const all: Notification[] = [];

      // New articles
      for (const e of pubEvs as any[]) {
        all.push({
          id: e.transactionHash + "-pub",
          type: "article",
          title: "New article published",
          body: `"${e.args.title?.slice(0,60)}" by ${e.args.author?.slice(0,10)}…`,
          color: "var(--brand)", bg: "var(--brand-muted)", icon: BookOpen,
          txHash: e.transactionHash, link: `/article/${e.args.id}`,
          blockNumber: e.blockNumber, read: false,
        });
      }

      // High-value reads (>= $0.05)
      for (const e of readEvs as any[]) {
        const price = parseFloat(ethers.formatUnits(e.args.price, 6));
        if (price >= 0.05) {
          all.push({
            id: e.transactionHash + "-read",
            type: "revenue",
            title: `High-value read · $${price.toFixed(4)} USDC`,
            body: `Article #${e.args.id} unlocked by ${e.args.reader?.slice(0,10)}…`,
            color: "#059669", bg: "rgba(5,150,105,0.08)", icon: DollarSign,
            txHash: e.transactionHash,
            blockNumber: e.blockNumber, read: false,
          });
        }
      }

      // All revenue events (low value)
      for (const e of readEvs as any[]) {
        const price = parseFloat(ethers.formatUnits(e.args.price, 6));
        if (price < 0.05) {
          all.push({
            id: e.transactionHash + "-rev",
            type: "revenue",
            title: `Article read · $${price.toFixed(4)} USDC`,
            body: `Article #${e.args.id} unlocked`,
            color: "#059669", bg: "rgba(5,150,105,0.08)", icon: DollarSign,
            txHash: e.transactionHash,
            blockNumber: e.blockNumber, read: false,
          });
        }
      }

      // Writer verification events
      for (const e of verEvs as any[]) {
        all.push({
          id: e.transactionHash + "-ver",
          type: "verify",
          title: e.args.status ? "Writer verified" : "Writer unverified",
          body: `${e.args.writer?.slice(0,14)}…${e.args.writer?.slice(-6)}`,
          color: "#0284c7", bg: "rgba(2,132,199,0.08)", icon: UserCheck,
          txHash: e.transactionHash, link: `/profile/${e.args.writer}`,
          blockNumber: e.blockNumber, read: false,
        });
      }

      all.sort((a, b) => b.blockNumber - a.blockNumber);
      setNotifs(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function markAllRead() {
    setReadSet(new Set(notifs.map(n => n.id)));
  }

  const unread = notifs.filter(n => !readSet.has(n.id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            Notifications
            {unread > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", background: "var(--brand-muted)", border: "1px solid var(--border-brand)", padding: "2px 9px", borderRadius: "var(--radius-full)" }}>{unread}</span>}
          </h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Platform activity from on-chain events</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={markAllRead} disabled={unread === 0} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)", opacity: unread === 0 ? 0.5 : 1 }}>
            <CheckCheck size={13} /> Mark all read
          </button>
          <button onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
            <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: 16 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 62, borderRadius: 8, marginBottom: 8 }} />)}</div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <Bell size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>No activity yet</p>
            <p style={{ fontSize: 12, color: "var(--text-4)" }}>Events will appear here as your platform gets activity.</p>
          </div>
        ) : (
          notifs.map((n, i) => {
            const isRead = readSet.has(n.id);
            return (
              <div key={n.id}
                onClick={() => setReadSet(s => new Set([...s, n.id]))}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderBottom: i < notifs.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", background: isRead ? "transparent" : "rgba(109,40,217,0.02)", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-alt)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isRead ? "transparent" : "rgba(109,40,217,0.02)"}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: n.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <n.icon size={15} style={{ color: n.color }} />
                  </div>
                  {!isRead && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", border: "2px solid var(--bg-card)" }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 3, fontFamily: "JetBrains Mono, monospace" }}>Block #{n.blockNumber}</div>
                </div>

                {n.txHash && (
                  <a href={`${EXPLORER_URL}/tx/${n.txHash}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--text-4)", display: "flex", flexShrink: 0 }}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
