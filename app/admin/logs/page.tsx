"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { RefreshCw, ExternalLink, BookOpen, Users, UserCheck, Filter } from "lucide-react";
import Link from "next/link";
import { READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER, getReadProvider } from "../../../lib/web3";

type LogEntry = {
  type: "ArticlePublished" | "ArticleRead" | "WriterVerified";
  blockNumber: number;
  txHash: string;
  data: any;
};

const TYPE_META = {
  ArticlePublished: { label: "Article Published", color: "var(--brand)", bg: "var(--brand-muted)", icon: BookOpen },
  ArticleRead:      { label: "Article Read",      color: "#059669", bg: "rgba(5,150,105,0.08)", icon: Users },
  WriterVerified:   { label: "Writer Verified",   color: "#0284c7", bg: "rgba(2,132,199,0.08)", icon: UserCheck },
};

export default function LogsPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>("All");

  async function fetchLogs() {
    setLoading(true);
    try {
      if (!READLEARC_ADDRESS) return;
      const prov = getReadProvider();
      const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);

      const [pubEvs, readEvs, verEvs] = await Promise.all([
        c.queryFilter(c.filters.ArticlePublished(), -100000),
        c.queryFilter(c.filters.ArticleRead(),      -100000),
        c.queryFilter(c.filters.WriterVerified(),   -100000),
      ]);

      const all: LogEntry[] = [
        ...pubEvs.map((e: any) => ({
          type: "ArticlePublished" as const,
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
          data: { id: e.args.id?.toString(), author: e.args.author, title: e.args.title },
        })),
        ...readEvs.map((e: any) => ({
          type: "ArticleRead" as const,
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
          data: { id: e.args.id?.toString(), reader: e.args.reader, price: ethers.formatUnits(e.args.price, 6) },
        })),
        ...verEvs.map((e: any) => ({
          type: "WriterVerified" as const,
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
          data: { writer: e.args.writer, status: e.args.status },
        })),
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      setLogs(all);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter === "All" ? logs : logs.filter(l => l.type === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Activity Logs</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>
            All on-chain events · {logs.length} total events
          </p>
        </div>
        <button onClick={fetchLogs} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
          <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} />
          Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", "ArticlePublished", "ArticleRead", "WriterVerified"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            border: `1.5px solid ${filter === f ? "var(--brand)" : "var(--border)"}`,
            background: filter === f ? "var(--brand-muted)" : "transparent",
            color: filter === f ? "var(--brand)" : "var(--text-3)",
          }}>
            {f === "All" ? "All Events" : TYPE_META[f as keyof typeof TYPE_META]?.label ?? f}
            {f !== "All" && <span style={{ marginLeft: 5, fontSize: 10, color: "var(--text-4)" }}>
              ({logs.filter(l => l.type === f).length})
            </span>}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: 16 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 8 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
            {logs.length === 0 ? "No on-chain events found. Deploy the contract and start publishing." : "No events match this filter."}
          </div>
        ) : (
          <div>
            {filtered.map((log, i) => {
              const meta = TYPE_META[log.type];
              return (
                <div key={`${log.txHash}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <meta.icon size={15} style={{ color: meta.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>block #{log.blockNumber}</span>
                    </div>

                    {/* Event detail */}
                    <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                      {log.type === "ArticlePublished" && (
                        <span>
                          Article #{log.data.id} · <em>"{log.data.title?.slice(0,50)}{log.data.title?.length > 50 ? "…" : ""}"</em>
                          {" · "}<Link href={`/profile/${log.data.author}`} style={{ color: "var(--brand)", textDecoration: "none", fontFamily: "JetBrains Mono, monospace" }}>{log.data.author?.slice(0,10)}…</Link>
                        </span>
                      )}
                      {log.type === "ArticleRead" && (
                        <span>
                          Article #{log.data.id} · Paid <strong style={{ color: "#059669" }}>${log.data.price} USDC</strong>
                          {" · reader "}<span style={{ fontFamily: "JetBrains Mono, monospace" }}>{log.data.reader?.slice(0,10)}…</span>
                        </span>
                      )}
                      {log.type === "WriterVerified" && (
                        <span>
                          <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{log.data.writer?.slice(0,10)}…</span>
                          {" · "}<strong style={{ color: log.data.status ? "#059669" : "#dc2626" }}>{log.data.status ? "Verified" : "Unverified"}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tx link */}
                  <a href={`${ARC_EXPLORER}/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-4)", display: "flex", flexShrink: 0, marginTop: 2 }} title="View transaction">
                    <ExternalLink size={13} />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
