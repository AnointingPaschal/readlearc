import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Shield, X, ExternalLink, ArrowRight, Layers } from "lucide-react";
import { cfg, addressUrl } from "@/lib/config";
import { approvals, type ApprovalRequest } from "@/lib/tx-approval";

const short = (a?: string) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—");
const fmtNative = (v?: bigint) => (v == null ? "—" : `${Number(ethers.formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`);

/** The sheet every transaction must pass through. Nothing is signed until "Approve & Sign" is pressed. */
export default function TxApproval() {
  const [queue, setQueue] = useState<ApprovalRequest[]>([]);
  useEffect(() => approvals.subscribe(setQueue), []);
  const r = queue[0];
  if (!r) return null;
  const batch = r.kind === "batch";
  const row = (k: string, v: React.ReactNode, last = false) => (
    <div style={{ padding: "11px 16px", borderBottom: last ? "none" : "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
      <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 600, flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, textAlign: "right", minWidth: 0, wordBreak: "break-word" }}>{v}</span>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={() => approvals.respond(r.id, false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.62)", backdropFilter: "blur(5px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: "var(--bg-card)", borderRadius: "var(--r-xl) var(--r-xl) 0 0", border: "1.5px solid var(--border)", borderBottom: "none", boxShadow: "0 -12px 48px rgba(0,0,0,.35)" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--brand-muted)", border: "1.5px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {batch ? <Layers size={18} style={{ color: "var(--brand)" }} /> : <Shield size={18} style={{ color: "var(--brand)" }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 17, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", margin: 0 }}>{batch ? "Approve transactions" : "Approve transaction"}</h3>
              <p style={{ fontSize: 11, color: "var(--text-4)", margin: "1px 0 0" }}>{cfg.chainName} · signed by your site wallet{queue.length > 1 ? ` · ${queue.length - 1} more waiting` : ""}</p>
            </div>
          </div>
          <button onClick={() => approvals.respond(r.id, false)} aria-label="Reject" style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", flexShrink: 0 }}><X size={13} /></button>
        </div>

        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.35 }}>{r.title}</div>
          {r.detail && <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55, margin: "6px 0 0" }}>{r.detail}</p>}
        </div>

        <div style={{ margin: "14px 20px 0", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {batch ? (<>
            {row("Transactions", r.count ? `about ${r.count}` : "several")}
            {r.from && row("Wallet", <span style={{ fontFamily: "JetBrains Mono,monospace" }}>{short(r.from)}</span>)}
            {row("Approval", "One approval covers this whole action", true)}
          </>) : (<>
            {r.action && row("Action", <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11 }}>{r.action}</span>)}
            {row("Contract", <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {r.contract && <b>{r.contract}</b>}
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontWeight: 500 }}>{r.to ? short(r.to) : "new contract"}</span>
              {r.to && <a href={addressUrl(r.to)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-4)", display: "flex" }}><ExternalLink size={11} /></a>}
            </span>)}
            {r.value ? row("Sending", <span style={{ color: "var(--accent)" }}>{fmtNative(r.value)}</span>) : null}
            {r.from && row("From", <span style={{ fontFamily: "JetBrains Mono,monospace" }}>{short(r.from)}</span>)}
            {row("Network fee", r.fee != null ? `≈ ${fmtNative(r.fee)}` : "estimated when sent", true)}
          </>)}
        </div>

        <div style={{ margin: "12px 20px 0", padding: "10px 12px", background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.2)", borderRadius: "var(--r-md)", display: "flex", gap: 8 }}>
          <Shield size={12} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11, color: "#b45309", lineHeight: 1.55, margin: 0 }}>
            {batch ? `This action sends several transactions on ${cfg.chainName}. Once you approve, they are signed one after another until it finishes.` : `You are signing a transaction on ${cfg.chainName}. Transactions are irreversible.`}
          </p>
        </div>

        <div style={{ padding: "16px 20px calc(24px + env(safe-area-inset-bottom))", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
          <button onClick={() => approvals.respond(r.id, false)} className="btn btn-secondary" style={{ justifyContent: "center", height: 50, fontSize: 14 }}>Reject</button>
          <button onClick={() => approvals.respond(r.id, true)} className="btn btn-primary" style={{ justifyContent: "center", height: 50, fontWeight: 800, fontSize: 15 }}>Approve &amp; Sign <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}
