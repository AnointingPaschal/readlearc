"use client";
import { useState } from "react";
import { Flag, Bot, CheckCircle, Ban, Trash2, ArrowUpRight, AlertTriangle } from "lucide-react";

const QUEUE = [
  { id: "1", title: "How to Earn $500/month Writing on Web3 Platforms", author: "0xSPAM…", flags: 12, aiScore: "HIGH",   aiReasons: ["Promotes get-rich-quick scheme", "Excessive referral links"], aiRec: "REJECT",  status: "PENDING" },
  { id: "2", title: "The Truth About Arc Development",                  author: "0xANGR…", flags: 4,  aiScore: "MEDIUM", aiReasons: ["Aggressive language", "Potential harassment"],              aiRec: "REVIEW",  status: "PENDING" },
];

const SCORE_COLOR: Record<string, string> = {
  HIGH:   "#dc2626",
  MEDIUM: "#d97706",
  LOW:    "#059669",
};

export default function ModerationPage() {
  const [actioned, setActioned] = useState<Record<string, string>>({});

  function action(id: string, act: string) {
    setActioned(a => ({ ...a, [id]: act }));
  }

  const pending = QUEUE.filter(q => !actioned[q.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            Moderation Queue
            {pending.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", padding: "3px 9px", borderRadius: "var(--radius-full)" }}>{pending.length} pending</span>}
          </h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Review flagged content and AI moderation recommendations.</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <CheckCircle size={32} style={{ color: "#059669", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-3)" }}>Queue is clear — no flagged content!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {QUEUE.map(item => {
            if (actioned[item.id]) return (
              <div key={item.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
                <CheckCircle size={14} style={{ color: "#059669" }} />
                <span style={{ fontSize: 13, color: "var(--text-4)" }}>"{item.title.slice(0,50)}…" → <strong>{actioned[item.id]}</strong></span>
              </div>
            );
            return (
              <div key={item.id} className="card" style={{ padding: "20px", borderLeft: "4px solid #dc2626" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{item.title}</h2>
                      <a href={`/article/${item.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-4)", display: "flex" }}><ArrowUpRight size={13} /></a>
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-4)", flexWrap: "wrap" }}>
                      <span>By {item.author}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dc2626" }}><Flag size={11} /> {item.flags} flags</span>
                    </div>
                  </div>
                </div>

                {/* AI analysis */}
                <div style={{ padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                      <Bot size={13} style={{ color: "var(--brand)" }} /> AI Analysis
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: `${SCORE_COLOR[item.aiScore]}18`, color: SCORE_COLOR[item.aiScore], border: `1px solid ${SCORE_COLOR[item.aiScore]}30` }}>
                      RISK: {item.aiScore}
                    </span>
                  </div>
                  <ul style={{ paddingLeft: 16, margin: "0 0 8px", fontSize: 12, color: "var(--text-3)" }}>
                    {item.aiReasons.map(r => <li key={r} style={{ marginBottom: 3 }}>{r}</li>)}
                  </ul>
                  <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-4)" }}>
                    Recommendation: <strong style={{ color: "var(--text-2)" }}>{item.aiRec}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => action(item.id, "APPROVED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius)", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", color: "#059669", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button onClick={() => action(item.id, "REMOVED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                    <Ban size={13} /> Remove
                  </button>
                  <button onClick={() => action(item.id, "SUSPENDED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--radius)", background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)", color: "#d97706", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                    <AlertTriangle size={13} /> Suspend Writer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
