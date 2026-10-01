import { useState } from "react";
import type { ethers } from "ethers";
import { ArrowDownLeft, ArrowUpRight, Globe, Landmark, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ago, bankCall, fmtNgn, fmtUsd, type BankConfig } from "@/lib/bank";
import type { BankData } from "./useBank";
import NgAccountForm from "./NgAccountForm";
import WireForm from "./WireForm";
import { Sheet, StatusChip } from "./Sheet";

const sec = (t: string, right?: React.ReactNode) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 8px" }}>
    <h4 style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em" }}>{t}</h4>{right}
  </div>
);
const empty = (t: string) => <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: "var(--text-4)", background: "var(--bg-alt)", borderRadius: "var(--r)" }}>{t}</div>;
const card: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", marginBottom: 8 };
const ico = (c: string, bg: string, el: React.ReactNode) => <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{el}</div>;

export default function BankTab({ signer, cfg, bank, onUnlock, onCashOut, onAddMoney }: {
  signer: ethers.Signer | null; cfg: BankConfig; bank: BankData; onUnlock: () => void; onCashOut: () => void; onAddMoney: () => void;
}) {
  const [add, setAdd] = useState<"" | "ng" | "wire">("");
  if (!cfg.ngnConfigured && !cfg.circle) return (
    <div style={{ textAlign: "center", padding: "36px 16px" }}>
      <Landmark size={32} style={{ color: "var(--text-4)", marginBottom: 10 }} />
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>Bank features aren't switched on yet</p>
      <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>An admin can enable them in Admin → Finance → Banking.</p>
    </div>
  );
  if (!signer) return (
    <div style={{ textAlign: "center", padding: "36px 16px" }}>
      <Lock size={30} style={{ color: "var(--brand)", marginBottom: 10 }} />
      <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 14 }}>Unlock your wallet to see and manage bank accounts.</p>
      <button className="btn btn-primary" onClick={onUnlock} style={{ justifyContent: "center" }}>Unlock wallet</button>
    </div>
  );
  const { ng, cashouts, wires, deposits, withdrawals } = bank;

  async function removeNg(id: string) { try { await bankCall(signer, "DELETE", `/api/bank/ng/accounts?id=${encodeURIComponent(id)}`); bank.setNg(ng.filter((a) => a.id !== id)); } catch { /* keep */ } }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={bank.refresh} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}><RefreshCw size={11} className={bank.loading ? "spin" : ""} />Refresh</button>
      </div>
      {bank.error && <div style={{ fontSize: 12, color: "#dc2626", padding: "8px 12px", background: "rgba(220,38,38,.06)", borderRadius: "var(--r)", marginTop: 4 }}>{bank.error}</div>}

      {cfg.ngnConfigured && <>
        {sec("Nigerian bank accounts (₦)", <button onClick={() => setAdd("ng")} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}><Plus size={12} />Add</button>)}
        {!ng.length ? empty("No bank account yet") : ng.map((a) => (
          <div key={a.id} style={card}>
            {ico("#059669", "rgba(5,150,105,.1)", <Landmark size={15} />)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.accountName}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{a.bankName} ••{a.last4}</div>
            </div>
            <button onClick={() => removeNg(a.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}><Trash2 size={14} /></button>
          </div>
        ))}
        {cfg.ngn && ng.length > 0 && <button className="btn btn-primary" onClick={onCashOut} style={{ width: "100%", justifyContent: "center", height: 44, marginTop: 4 }}>Cash out to Naira · $1 = {fmtNgn(cfg.rate)}</button>}
        {sec("Cash-out history")}
        {!cashouts.length ? empty("No cash-outs yet") : cashouts.map((c) => (
          <div key={c.id} style={card}>
            {ico("#dc2626", "rgba(220,38,38,.1)", <ArrowUpRight size={15} />)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtNgn(c.ngn)}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{fmtUsd(c.amountUsd)} → {c.bankName} ••{c.last4} · {ago(c.createdAt)}</div>
              {c.status === "failed" && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{c.error || "Payout failed"} — contact support; your USDC is safe.</div>}
            </div>
            <StatusChip s={c.status} />
          </div>
        ))}
      </>}

      {cfg.circle && <>
        {sec("International banks (USD / EUR)", <button onClick={() => setAdd("wire")} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}><Plus size={12} />Link</button>)}
        {!wires.length ? empty("No linked bank") : wires.map((w) => (
          <div key={w.id} style={card}>
            {ico("var(--brand)", "var(--bg-alt)", <Globe size={15} />)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{w.holder || "Bank account"}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{w.description}</div>
            </div>
            <StatusChip s={w.status || "pending"} />
          </div>
        ))}
        {wires.length > 0 && <button className="btn btn-secondary" onClick={onAddMoney} style={{ width: "100%", justifyContent: "center", height: 42, marginTop: 4 }}>Show wire instructions</button>}
        {sec("Bank deposits")}
        {!deposits.length ? empty("No deposits yet") : deposits.map((d) => (
          <div key={d.id} style={card}>
            {ico("#059669", "rgba(5,150,105,.1)", <ArrowDownLeft size={15} />)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.amount ? `${d.amount.amount} ${d.amount.currency}` : "Pending amount"}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{(d.source?.type || "wire").toUpperCase()} · {ago(d.createDate)}</div>
            </div>
            <StatusChip s={d.status} />
          </div>
        ))}
        {sec("Bank withdrawals")}
        {!withdrawals.length ? empty("No withdrawals yet") : withdrawals.map((w) => (
          <div key={w.id} style={card}>
            {ico("#dc2626", "rgba(220,38,38,.1)", <ArrowUpRight size={15} />)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{w.amount.amount} {w.amount.currency}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{w.destination?.name || "Bank"} · {ago(w.createDate)}</div>
              {w.status === "failed" && w.errorCode && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{w.errorCode.replace(/_/g, " ")}</div>}
            </div>
            <StatusChip s={w.status} />
          </div>
        ))}
      </>}

      {add === "ng" && <Sheet title="Add Nigerian bank account" onClose={() => setAdd("")}><NgAccountForm signer={signer} onSaved={(a) => { bank.setNg([a, ...ng]); setAdd(""); }} /></Sheet>}
      {add === "wire" && <Sheet title="Link international bank" onClose={() => setAdd("")}><WireForm signer={signer} onSaved={(w) => { bank.setWires([w, ...wires]); setAdd(""); }} /></Sheet>}
    </div>
  );
}
